"""
DeepGuard CLIP Fine-Tuning Script
==================================
Fine-tunes OpenAI's CLIP ViT-B/32 model to classify images as AI-generated or real.
Uses labeled data exported from the DeepGuard admin panel (/admin/training-data).

Requirements:
    pip install torch torchvision transformers pillow pandas requests tqdm scikit-learn

Usage:
    python train_clip_detector.py \
        --data deepguard-training-data-2026-03-16.csv \
        --epochs 10 \
        --batch-size 32 \
        --output ./deepguard-clip-model

After training, deploy the model to Hugging Face Hub:
    python train_clip_detector.py --push-to-hub your-username/deepguard-detector
"""

import argparse
import os
import json
import random
from pathlib import Path
from typing import Optional

import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import requests
from io import BytesIO
from tqdm import tqdm
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support


# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────

DEFAULT_MODEL = "openai/clip-vit-base-patch32"
LABEL_MAP = {
    "ai_generated": 1,
    "deepfake_video": 1,
    "ai_audio": 1,
    "real": 0,
    "human_audio": 0,
}

# ─────────────────────────────────────────────
# Dataset
# ─────────────────────────────────────────────

class DeepGuardDataset(Dataset):
    """
    Loads images from S3 URLs and maps ground-truth labels to binary:
      1 = AI-generated / deepfake
      0 = Real / authentic
    """

    def __init__(self, records: pd.DataFrame, processor: CLIPProcessor, cache_dir: str = "./image_cache"):
        self.records = records.reset_index(drop=True)
        self.processor = processor
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)

    def __len__(self):
        return len(self.records)

    def _load_image(self, url: str) -> Optional[Image.Image]:
        """Download and cache image from URL."""
        # Use URL hash as cache key
        cache_key = str(abs(hash(url)))
        cache_path = self.cache_dir / f"{cache_key}.jpg"

        if cache_path.exists():
            try:
                return Image.open(cache_path).convert("RGB")
            except Exception:
                cache_path.unlink(missing_ok=True)

        try:
            response = requests.get(url, timeout=15, stream=True)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content)).convert("RGB")
            img.save(cache_path, "JPEG", quality=90)
            return img
        except Exception as e:
            print(f"[Warning] Failed to load image from {url}: {e}")
            return None

    def __getitem__(self, idx):
        row = self.records.iloc[idx]
        label = LABEL_MAP.get(row.get("feedbackLabel", ""), -1)

        img = self._load_image(row["fileUrl"]) if pd.notna(row.get("fileUrl")) else None

        if img is None:
            # Return a blank image as fallback
            img = Image.new("RGB", (224, 224), color=(128, 128, 128))

        inputs = self.processor(images=img, return_tensors="pt", padding=True)
        pixel_values = inputs["pixel_values"].squeeze(0)

        return pixel_values, torch.tensor(label, dtype=torch.long)


# ─────────────────────────────────────────────
# Model: CLIP + Binary Classifier Head
# ─────────────────────────────────────────────

class CLIPDeepfakeDetector(nn.Module):
    """
    CLIP visual encoder + lightweight binary classification head.
    The CLIP backbone is partially frozen; only the last 4 transformer blocks
    and the classifier head are trained.
    """

    def __init__(self, clip_model: CLIPModel, hidden_dim: int = 512, dropout: float = 0.3):
        super().__init__()
        self.clip = clip_model
        embed_dim = clip_model.config.projection_dim  # 512 for ViT-B/32

        # Freeze all CLIP parameters first
        for param in self.clip.parameters():
            param.requires_grad = False

        # Unfreeze the last 4 visual transformer blocks for fine-tuning
        visual_layers = list(self.clip.vision_model.encoder.layers)
        for layer in visual_layers[-4:]:
            for param in layer.parameters():
                param.requires_grad = True

        # Also unfreeze the final layer norm and projection
        for param in self.clip.vision_model.post_layernorm.parameters():
            param.requires_grad = True
        for param in self.clip.visual_projection.parameters():
            param.requires_grad = True

        # Binary classifier head
        self.classifier = nn.Sequential(
            nn.Linear(embed_dim, hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, 256),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(256, 2),  # 2 classes: real (0) vs AI-generated (1)
        )

    def forward(self, pixel_values: torch.Tensor) -> torch.Tensor:
        # Extract visual features from CLIP
        vision_outputs = self.clip.vision_model(pixel_values=pixel_values)
        image_embeds = vision_outputs.pooler_output
        image_embeds = self.clip.visual_projection(image_embeds)

        # L2 normalize (same as CLIP does internally)
        image_embeds = image_embeds / image_embeds.norm(dim=-1, keepdim=True)

        # Classify
        logits = self.classifier(image_embeds)
        return logits


# ─────────────────────────────────────────────
# Training Loop
# ─────────────────────────────────────────────

def train_epoch(model, loader, optimizer, criterion, device, scaler):
    model.train()
    total_loss = 0.0
    all_preds, all_labels = [], []

    for pixel_values, labels in tqdm(loader, desc="Training", leave=False):
        pixel_values = pixel_values.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()

        with torch.cuda.amp.autocast(enabled=scaler is not None):
            logits = model(pixel_values)
            loss = criterion(logits, labels)

        if scaler:
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            scaler.step(optimizer)
            scaler.update()
        else:
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

        total_loss += loss.item()
        preds = logits.argmax(dim=-1).cpu().tolist()
        all_preds.extend(preds)
        all_labels.extend(labels.cpu().tolist())

    acc = accuracy_score(all_labels, all_preds)
    return total_loss / len(loader), acc


@torch.no_grad()
def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss = 0.0
    all_preds, all_labels = [], []

    for pixel_values, labels in tqdm(loader, desc="Evaluating", leave=False):
        pixel_values = pixel_values.to(device)
        labels = labels.to(device)

        logits = model(pixel_values)
        loss = criterion(logits, labels)

        total_loss += loss.item()
        preds = logits.argmax(dim=-1).cpu().tolist()
        all_preds.extend(preds)
        all_labels.extend(labels.cpu().tolist())

    acc = accuracy_score(all_labels, all_preds)
    precision, recall, f1, _ = precision_recall_fscore_support(
        all_labels, all_preds, average="binary", zero_division=0
    )
    return total_loss / len(loader), acc, precision, recall, f1


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="DeepGuard CLIP Fine-Tuning")
    parser.add_argument("--data", required=True, help="Path to CSV exported from /admin/training-data")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Base CLIP model from Hugging Face")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--output", default="./deepguard-clip-model", help="Directory to save the trained model")
    parser.add_argument("--cache-dir", default="./image_cache", help="Directory to cache downloaded images")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--push-to-hub", default=None, help="Hugging Face Hub repo (e.g. your-username/deepguard-detector)")
    args = parser.parse_args()

    # Reproducibility
    random.seed(args.seed)
    torch.manual_seed(args.seed)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n{'='*60}")
    print(f"  DeepGuard CLIP Fine-Tuning")
    print(f"{'='*60}")
    print(f"  Device:     {device}")
    print(f"  Base model: {args.model}")
    print(f"  Epochs:     {args.epochs}")
    print(f"  Batch size: {args.batch_size}")
    print(f"  Output:     {args.output}")
    print(f"{'='*60}\n")

    # Load and filter data
    print("[1/5] Loading training data...")
    df = pd.read_csv(args.data)
    df = df[df["feedbackLabel"].notna()]
    df = df[df["feedbackLabel"].isin(LABEL_MAP.keys())]
    df = df[df["fileUrl"].notna()]
    df = df[df["type"] == "image"]  # Start with images only

    print(f"  Total labeled image samples: {len(df)}")
    print(f"  AI-generated: {(df['feedbackLabel'].isin(['ai_generated', 'deepfake_video'])).sum()}")
    print(f"  Real:         {(df['feedbackLabel'].isin(['real', 'human_audio'])).sum()}")

    if len(df) < 50:
        print("\n[Warning] Very few samples. Collect at least 200+ labeled samples for meaningful training.")
        print("  Continue anyway? (y/n): ", end="")
        if input().strip().lower() != "y":
            return

    # Train/val split
    train_df, val_df = train_test_split(df, test_size=0.15, random_state=args.seed, stratify=df["feedbackLabel"].map(LABEL_MAP))
    print(f"  Train: {len(train_df)} | Val: {len(val_df)}")

    # Load CLIP
    print("\n[2/5] Loading CLIP model...")
    processor = CLIPProcessor.from_pretrained(args.model)
    clip_model = CLIPModel.from_pretrained(args.model)

    model = CLIPDeepfakeDetector(clip_model).to(device)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"  Trainable parameters: {trainable:,} / {total:,} ({100*trainable/total:.1f}%)")

    # Datasets
    print("\n[3/5] Preparing datasets (downloading images)...")
    train_dataset = DeepGuardDataset(train_df, processor, args.cache_dir)
    val_dataset = DeepGuardDataset(val_df, processor, args.cache_dir)

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=2, pin_memory=True)

    # Training setup
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=args.lr, weight_decay=0.01
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
    scaler = torch.cuda.amp.GradScaler() if device.type == "cuda" else None

    # Training loop
    print(f"\n[4/5] Training for {args.epochs} epochs...\n")
    best_val_f1 = 0.0
    history = []

    for epoch in range(1, args.epochs + 1):
        train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion, device, scaler)
        val_loss, val_acc, val_prec, val_rec, val_f1 = evaluate(model, val_loader, criterion, device)
        scheduler.step()

        history.append({
            "epoch": epoch, "train_loss": train_loss, "train_acc": train_acc,
            "val_loss": val_loss, "val_acc": val_acc, "val_f1": val_f1,
        })

        print(
            f"  Epoch {epoch:2d}/{args.epochs} | "
            f"Train Loss: {train_loss:.4f} Acc: {train_acc:.3f} | "
            f"Val Loss: {val_loss:.4f} Acc: {val_acc:.3f} F1: {val_f1:.3f}"
        )

        # Save best model
        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            output_dir = Path(args.output)
            output_dir.mkdir(parents=True, exist_ok=True)
            torch.save(model.state_dict(), output_dir / "best_model.pt")
            processor.save_pretrained(output_dir)
            print(f"    ✅ New best model saved (F1={val_f1:.3f})")

    # Save training history
    output_dir = Path(args.output)
    with open(output_dir / "training_history.json", "w") as f:
        json.dump(history, f, indent=2)

    print(f"\n[5/5] Training complete!")
    print(f"  Best validation F1: {best_val_f1:.3f}")
    print(f"  Model saved to: {args.output}/best_model.pt")

    # Push to Hugging Face Hub
    if args.push_to_hub:
        print(f"\n  Pushing to Hugging Face Hub: {args.push_to_hub}...")
        try:
            from huggingface_hub import HfApi
            api = HfApi()
            api.upload_folder(folder_path=str(output_dir), repo_id=args.push_to_hub, repo_type="model")
            print(f"  ✅ Model available at: https://huggingface.co/{args.push_to_hub}")
        except ImportError:
            print("  [Warning] huggingface_hub not installed. Run: pip install huggingface_hub")
        except Exception as e:
            print(f"  [Error] Failed to push: {e}")

    print("\n  Next step: integrate the model into DeepGuard server:")
    print("  See model-training/INTEGRATION.md for deployment instructions.\n")


if __name__ == "__main__":
    main()
