#!/bin/bash
# ============================================================
# DeepGuard One-Click Training Script
# ============================================================
# Runs on any cloud GPU (RunPod, Vast.ai, Google Colab, etc.)
# What it does:
#   1. Install all dependencies
#   2. Download CIFAKE dataset from Kaggle (120,000 images)
#   3. Convert to DeepGuard CSV format
#   4. Fine-tune CLIP ViT-B/32 on the dataset
#   5. Push trained model to Hugging Face Hub
#
# Usage:
#   bash auto_train.sh --hf-token YOUR_HF_TOKEN --hf-repo your-username/deepguard-detector
#   bash auto_train.sh --hf-token hf_xxx --hf-repo kevin/deepguard-detector --epochs 15
#
# Optional: add Kaggle credentials to download CIFAKE automatically
#   export KAGGLE_USERNAME=your_username
#   export KAGGLE_KEY=your_api_key
# ============================================================

set -e  # Exit on error

# ── Parse arguments ──────────────────────────────────────────
HF_TOKEN=""
HF_REPO=""
EPOCHS=10
BATCH_SIZE=32

while [[ $# -gt 0 ]]; do
  case $1 in
    --hf-token) HF_TOKEN="$2"; shift 2 ;;
    --hf-repo)  HF_REPO="$2";  shift 2 ;;
    --epochs)   EPOCHS="$2";   shift 2 ;;
    --batch-size) BATCH_SIZE="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

if [ -z "$HF_TOKEN" ] || [ -z "$HF_REPO" ]; then
  echo "Usage: bash auto_train.sh --hf-token YOUR_HF_TOKEN --hf-repo your-username/deepguard-detector"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║        DeepGuard CLIP Auto-Training Pipeline         ║"
echo "╚══════════════════════════════════════════════════════╝"
echo "  HF Repo:    $HF_REPO"
echo "  Epochs:     $EPOCHS"
echo "  Batch size: $BATCH_SIZE"
echo ""

# ── Step 1: Install dependencies ─────────────────────────────
echo "▶ [1/5] Installing dependencies..."
pip install -q torch torchvision transformers pillow pandas requests tqdm scikit-learn huggingface_hub kaggle 2>&1 | tail -3
echo "  ✓ Dependencies installed"

# ── Step 2: Download CIFAKE dataset ──────────────────────────
echo ""
echo "▶ [2/5] Downloading CIFAKE dataset..."
echo "  (60,000 real images + 60,000 AI-generated images = 120,000 total)"

mkdir -p ./data/cifake

if [ -n "$KAGGLE_USERNAME" ] && [ -n "$KAGGLE_KEY" ]; then
  # Download via Kaggle API
  mkdir -p ~/.kaggle
  echo "{\"username\":\"$KAGGLE_USERNAME\",\"key\":\"$KAGGLE_KEY\"}" > ~/.kaggle/kaggle.json
  chmod 600 ~/.kaggle/kaggle.json
  kaggle datasets download -d birdy654/cifake-real-and-ai-generated-synthetic-images -p ./data/cifake --unzip
  echo "  ✓ CIFAKE downloaded via Kaggle API"
else
  # Fallback: download from Hugging Face mirror
  echo "  No Kaggle credentials found. Downloading from Hugging Face mirror..."
  python3 - <<'PYEOF'
from huggingface_hub import hf_hub_download, snapshot_download
import os

print("  Downloading CIFAKE from HuggingFace...")
snapshot_download(
    repo_id="datasets/cifake",
    repo_type="dataset",
    local_dir="./data/cifake",
    ignore_patterns=["*.git*"],
)
print("  ✓ CIFAKE downloaded from HuggingFace")
PYEOF
fi

# ── Step 3: Convert to DeepGuard CSV format ───────────────────
echo ""
echo "▶ [3/5] Converting dataset to DeepGuard CSV format..."

python3 - <<'PYEOF'
import os
import csv
import glob
import random

data_dir = "./data/cifake"
output_csv = "./data/training_data.csv"

rows = []

# Find all image files and assign labels
# CIFAKE structure: train/REAL/*.jpg, train/FAKE/*.jpg
for split in ["train", "test"]:
    for label_dir, label in [("REAL", "real"), ("FAKE", "ai_generated")]:
        pattern = os.path.join(data_dir, "**", split, label_dir, "*.jpg")
        files = glob.glob(pattern, recursive=True)
        if not files:
            # Try alternative structure
            pattern = os.path.join(data_dir, split, label_dir, "*.jpg")
            files = glob.glob(pattern)
        if not files:
            # Try flat structure
            pattern = os.path.join(data_dir, label_dir, "*.jpg")
            files = glob.glob(pattern)

        for f in files:
            rows.append({
                "id": f"cifake_{len(rows)}",
                "type": "image",
                "fileUrl": f"file://{os.path.abspath(f)}",
                "localPath": os.path.abspath(f),
                "feedbackLabel": label,
                "userFeedback": "correct",
                "riskScore": 90 if label == "ai_generated" else 5,
                "verdict": "deepfake" if label == "ai_generated" else "safe",
            })

random.shuffle(rows)

with open(output_csv, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)

ai_count = sum(1 for r in rows if r["feedbackLabel"] == "ai_generated")
real_count = sum(1 for r in rows if r["feedbackLabel"] == "real")
print(f"  ✓ CSV created: {len(rows)} total samples")
print(f"    AI-generated: {ai_count}")
print(f"    Real:         {real_count}")
PYEOF

# ── Step 4: Train CLIP model ──────────────────────────────────
echo ""
echo "▶ [4/5] Training CLIP model..."
echo "  This will take 10-60 minutes depending on GPU..."

# Check if GPU is available
python3 -c "import torch; print(f'  GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"CPU (no GPU found)\"}'); print(f'  VRAM: {torch.cuda.get_device_properties(0).total_memory // 1024**3}GB' if torch.cuda.is_available() else '')"

# Run training (using local paths instead of URLs)
python3 - <<PYEOF
import argparse
import os
import json
import random
from pathlib import Path

import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
from tqdm import tqdm
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

EPOCHS = int(os.environ.get("TRAIN_EPOCHS", "$EPOCHS"))
BATCH_SIZE = int(os.environ.get("TRAIN_BATCH_SIZE", "$BATCH_SIZE"))
OUTPUT_DIR = "./deepguard-clip-v1"
SEED = 42

random.seed(SEED)
torch.manual_seed(SEED)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"  Training on: {device}")

# Load data
df = pd.read_csv("./data/training_data.csv")
df = df[df["feedbackLabel"].isin(["ai_generated", "real"])]
LABEL_MAP = {"ai_generated": 1, "real": 0}

train_df, val_df = train_test_split(df, test_size=0.1, random_state=SEED, stratify=df["feedbackLabel"])
print(f"  Train: {len(train_df)} | Val: {len(val_df)}")

class CIFAKEDataset(Dataset):
    def __init__(self, records, processor):
        self.records = records.reset_index(drop=True)
        self.processor = processor

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        row = self.records.iloc[idx]
        label = LABEL_MAP[row["feedbackLabel"]]
        local_path = row.get("localPath", "")
        try:
            img = Image.open(local_path).convert("RGB")
        except Exception:
            img = Image.new("RGB", (224, 224), color=(128, 128, 128))
        inputs = self.processor(images=img, return_tensors="pt", padding=True)
        return inputs["pixel_values"].squeeze(0), torch.tensor(label, dtype=torch.long)

class CLIPDetector(nn.Module):
    def __init__(self, clip_model):
        super().__init__()
        self.clip = clip_model
        embed_dim = clip_model.config.projection_dim
        for param in self.clip.parameters():
            param.requires_grad = False
        for layer in list(self.clip.vision_model.encoder.layers)[-4:]:
            for param in layer.parameters():
                param.requires_grad = True
        for param in self.clip.vision_model.post_layernorm.parameters():
            param.requires_grad = True
        for param in self.clip.visual_projection.parameters():
            param.requires_grad = True
        self.classifier = nn.Sequential(
            nn.Linear(embed_dim, 512), nn.GELU(), nn.Dropout(0.3),
            nn.Linear(512, 256), nn.GELU(), nn.Dropout(0.3),
            nn.Linear(256, 2),
        )

    def forward(self, pixel_values):
        out = self.clip.vision_model(pixel_values=pixel_values)
        embeds = self.clip.visual_projection(out.pooler_output)
        embeds = embeds / embeds.norm(dim=-1, keepdim=True)
        return self.classifier(embeds)

print("  Loading CLIP ViT-B/32...")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
model = CLIPDetector(clip_model).to(device)

trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
total = sum(p.numel() for p in model.parameters())
print(f"  Trainable params: {trainable:,} / {total:,} ({100*trainable/total:.1f}%)")

train_ds = CIFAKEDataset(train_df, processor)
val_ds = CIFAKEDataset(val_df, processor)
train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=4, pin_memory=True)
val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=4, pin_memory=True)

criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-4, weight_decay=0.01)
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)
scaler = torch.cuda.amp.GradScaler() if device.type == "cuda" else None

best_f1 = 0.0
history = []
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

for epoch in range(1, EPOCHS + 1):
    model.train()
    total_loss, all_preds, all_labels = 0.0, [], []
    for pv, labels in tqdm(train_loader, desc=f"Epoch {epoch}/{EPOCHS}", leave=False):
        pv, labels = pv.to(device), labels.to(device)
        optimizer.zero_grad()
        with torch.cuda.amp.autocast(enabled=scaler is not None):
            logits = model(pv)
            loss = criterion(logits, labels)
        if scaler:
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            scaler.step(optimizer)
            scaler.update()
        else:
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
        total_loss += loss.item()
        all_preds.extend(logits.argmax(-1).cpu().tolist())
        all_labels.extend(labels.cpu().tolist())
    train_acc = accuracy_score(all_labels, all_preds)

    model.eval()
    val_preds, val_labels = [], []
    with torch.no_grad():
        for pv, labels in val_loader:
            pv, labels = pv.to(device), labels.to(device)
            logits = model(pv)
            val_preds.extend(logits.argmax(-1).cpu().tolist())
            val_labels.extend(labels.cpu().tolist())
    val_acc = accuracy_score(val_labels, val_preds)
    from sklearn.metrics import f1_score
    val_f1 = f1_score(val_labels, val_preds, average="binary", zero_division=0)

    scheduler.step()
    history.append({"epoch": epoch, "train_acc": train_acc, "val_acc": val_acc, "val_f1": val_f1})
    print(f"  Epoch {epoch:2d}/{EPOCHS} | Train Acc: {train_acc:.3f} | Val Acc: {val_acc:.3f} | Val F1: {val_f1:.3f}")

    if val_f1 > best_f1:
        best_f1 = val_f1
        torch.save(model.state_dict(), f"{OUTPUT_DIR}/best_model.pt")
        processor.save_pretrained(OUTPUT_DIR)
        print(f"    ✅ Best model saved (F1={val_f1:.3f})")

with open(f"{OUTPUT_DIR}/training_history.json", "w") as f:
    json.dump(history, f, indent=2)

print(f"\n  Training complete! Best F1: {best_f1:.3f}")
print(f"  Model saved to: {OUTPUT_DIR}/")
PYEOF

# ── Step 5: Push to Hugging Face Hub ─────────────────────────
echo ""
echo "▶ [5/5] Pushing model to Hugging Face Hub..."

python3 - <<PYEOF
from huggingface_hub import HfApi, login
import os

token = "$HF_TOKEN"
repo_id = "$HF_REPO"

login(token=token)
api = HfApi()

# Create repo if it doesn't exist
try:
    api.create_repo(repo_id=repo_id, repo_type="model", exist_ok=True)
    print(f"  Repo ready: https://huggingface.co/{repo_id}")
except Exception as e:
    print(f"  Repo already exists or error: {e}")

# Write model card
model_card = f"""---
language: en
tags:
- image-classification
- deepfake-detection
- clip
- ai-generated-content
license: mit
---

# DeepGuard CLIP Detector

Fine-tuned CLIP ViT-B/32 model for detecting AI-generated images and deepfakes.

## Training Data
- **CIFAKE**: 120,000 images (60k real + 60k AI-generated)
- Base model: openai/clip-vit-base-patch32

## Performance
See training_history.json for epoch-by-epoch metrics.

## Usage
```python
from transformers import CLIPProcessor, CLIPModel
import torch

# Load model
processor = CLIPProcessor.from_pretrained("{repo_id}")
# ... (see DeepGuard inference.py for full usage)
```
"""
with open("./deepguard-clip-v1/README.md", "w") as f:
    f.write(model_card)

api.upload_folder(
    folder_path="./deepguard-clip-v1",
    repo_id=repo_id,
    repo_type="model",
)
print(f"  ✅ Model uploaded to: https://huggingface.co/{repo_id}")
PYEOF

# ── Done ──────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║                  Training Complete!                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Your model is live at:"
echo "  https://huggingface.co/$HF_REPO"
echo ""
echo "  Next step: Add your HF model to DeepGuard server"
echo "  See model-training/INTEGRATION.md for instructions"
echo ""
