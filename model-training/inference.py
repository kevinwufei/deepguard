"""
DeepGuard Model Inference Script
=================================
Loads the fine-tuned CLIP model and runs inference on a single image URL.
Use this to test the model before integrating into the DeepGuard server.

Usage:
    python inference.py --model ./deepguard-clip-model --image https://example.com/image.jpg
    python inference.py --model your-username/deepguard-detector --image ./local_image.jpg
"""

import argparse
import torch
import torch.nn.functional as F
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import requests
from io import BytesIO
import sys
import json


class CLIPDeepfakeDetector(torch.nn.Module):
    """Same architecture as in train_clip_detector.py — must match exactly."""

    def __init__(self, clip_model, hidden_dim=512, dropout=0.3):
        super().__init__()
        self.clip = clip_model
        embed_dim = clip_model.config.projection_dim

        self.classifier = torch.nn.Sequential(
            torch.nn.Linear(embed_dim, hidden_dim),
            torch.nn.GELU(),
            torch.nn.Dropout(dropout),
            torch.nn.Linear(hidden_dim, 256),
            torch.nn.GELU(),
            torch.nn.Dropout(dropout),
            torch.nn.Linear(256, 2),
        )

    def forward(self, pixel_values):
        vision_outputs = self.clip.vision_model(pixel_values=pixel_values)
        image_embeds = vision_outputs.pooler_output
        image_embeds = self.clip.visual_projection(image_embeds)
        image_embeds = image_embeds / image_embeds.norm(dim=-1, keepdim=True)
        return self.classifier(image_embeds)


def load_model(model_path: str, device: torch.device):
    """Load fine-tuned model from local path or Hugging Face Hub."""
    processor = CLIPProcessor.from_pretrained(model_path)
    base_clip = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    model = CLIPDeepfakeDetector(base_clip)

    import os
    weights_path = os.path.join(model_path, "best_model.pt")
    if os.path.exists(weights_path):
        state_dict = torch.load(weights_path, map_location=device)
        model.load_state_dict(state_dict)
        print(f"[✓] Loaded weights from {weights_path}")
    else:
        print(f"[Warning] No best_model.pt found at {model_path}. Using base CLIP weights.")

    model.to(device)
    model.eval()
    return model, processor


def load_image(source: str) -> Image.Image:
    """Load image from URL or local path."""
    if source.startswith("http://") or source.startswith("https://"):
        response = requests.get(source, timeout=15)
        response.raise_for_status()
        return Image.open(BytesIO(response.content)).convert("RGB")
    else:
        return Image.open(source).convert("RGB")


@torch.no_grad()
def predict(model, processor, image: Image.Image, device: torch.device) -> dict:
    """Run inference and return structured result."""
    inputs = processor(images=image, return_tensors="pt")
    pixel_values = inputs["pixel_values"].to(device)

    logits = model(pixel_values)
    probs = F.softmax(logits, dim=-1)

    real_prob = probs[0, 0].item()
    ai_prob = probs[0, 1].item()
    predicted_class = "AI Generated" if ai_prob > 0.5 else "Real / Authentic"
    confidence = max(ai_prob, real_prob)

    # Map to DeepGuard risk score (0-100)
    risk_score = round(ai_prob * 100)
    verdict = "deepfake" if risk_score >= 70 else "suspicious" if risk_score >= 30 else "safe"

    return {
        "riskScore": risk_score,
        "verdict": verdict,
        "aiProbability": round(ai_prob * 100, 1),
        "realProbability": round(real_prob * 100, 1),
        "predictedClass": predicted_class,
        "confidence": round(confidence * 100, 1),
        "engine": "DeepGuard-CLIP-v1",
    }


def main():
    parser = argparse.ArgumentParser(description="DeepGuard Model Inference")
    parser.add_argument("--model", required=True, help="Path to fine-tuned model or HF Hub repo")
    parser.add_argument("--image", required=True, help="Image URL or local file path")
    parser.add_argument("--json", action="store_true", help="Output result as JSON")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    print(f"Loading model from {args.model}...")
    model, processor = load_model(args.model, device)

    print(f"Loading image from {args.image}...")
    try:
        image = load_image(args.image)
    except Exception as e:
        print(f"[Error] Failed to load image: {e}", file=sys.stderr)
        sys.exit(1)

    result = predict(model, processor, image, device)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"\n{'='*50}")
        print(f"  DeepGuard Detection Result")
        print(f"{'='*50}")
        print(f"  Risk Score:    {result['riskScore']}/100")
        print(f"  Verdict:       {result['verdict'].upper()}")
        print(f"  AI Prob:       {result['aiProbability']}%")
        print(f"  Real Prob:     {result['realProbability']}%")
        print(f"  Confidence:    {result['confidence']}%")
        print(f"  Prediction:    {result['predictedClass']}")
        print(f"  Engine:        {result['engine']}")
        print(f"{'='*50}\n")


if __name__ == "__main__":
    main()
