# DeepGuard Custom Model Training

This directory contains everything you need to train your own AI detection model using data collected from your DeepGuard platform.

---

## How It Works

Every time a user detects an image on your platform and clicks **"Was this detection accurate?"**, their feedback is saved to your database. Over time, this builds a labeled dataset of real images and AI-generated images — the exact training data you need.

The model architecture is **CLIP ViT-B/32** (OpenAI) with a binary classification head. CLIP already understands visual concepts at a deep level, so fine-tuning it on your labeled data requires far less data and compute than training from scratch.

```
User uploads image
       ↓
DeepGuard detects (SightEngine + LLM)
       ↓
User labels result (AI Generated / Real)
       ↓
Label saved to database
       ↓
Admin exports CSV from /admin/training-data
       ↓
Fine-tune CLIP on your labeled data
       ↓
Deploy as DeepGuard-CLIP-v1 engine
```

---

## Step 1: Collect Training Data

Before training, you need labeled samples. The more the better:

| Samples | Expected Accuracy | Notes |
|---------|------------------|-------|
| < 100   | Not reliable     | Too few — keep collecting |
| 200–500 | ~75–80%          | Usable for a first test run |
| 1,000+  | ~85–90%          | Good for production |
| 5,000+  | ~92–95%          | Competitive with SightEngine |
| 10,000+ | 95%+             | Matches or exceeds commercial APIs |

To collect data faster, you can also use public datasets:
- **LAION-AI/CLIP-ViT** — millions of real images (free)
- **FaceForensics++** — deepfake video frames (academic license)
- **CIFAKE** — 60,000 real + 60,000 AI images from Kaggle (free)

---

## Step 2: Export Your Data

1. Log in to your DeepGuard platform as admin
2. Go to `/admin/training-data`
3. Click **Download CSV**
4. Save the file as `training_data.csv` in this directory

The CSV contains these columns:

| Column | Description |
|--------|-------------|
| `fileUrl` | S3 URL of the uploaded image |
| `feedbackLabel` | Ground truth: `ai_generated` or `real` |
| `userFeedback` | User rating: `correct`, `incorrect`, `unsure` |
| `riskScore` | System's original AI risk score (0–100) |
| `verdict` | System's original verdict |

---

## Step 3: Install Dependencies

```bash
pip install torch torchvision transformers pillow pandas requests tqdm scikit-learn huggingface_hub
```

For GPU training (strongly recommended):
```bash
# CUDA 12.1
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

---

## Step 4: Train the Model

```bash
python train_clip_detector.py \
  --data training_data.csv \
  --epochs 10 \
  --batch-size 16 \
  --output ./deepguard-clip-v1
```

**Parameters:**

| Flag | Default | Description |
|------|---------|-------------|
| `--data` | required | Path to your exported CSV |
| `--epochs` | 10 | Training epochs (10–20 is usually enough) |
| `--batch-size` | 16 | Reduce to 8 if you run out of GPU memory |
| `--lr` | 1e-4 | Learning rate |
| `--output` | `./deepguard-clip-model` | Where to save the trained model |

**Expected training time:**

| Hardware | 1,000 samples | 5,000 samples |
|----------|--------------|--------------|
| RTX 3090 (24GB) | ~8 min | ~35 min |
| RTX 4090 (24GB) | ~5 min | ~22 min |
| A100 (40GB, cloud) | ~4 min | ~18 min |
| CPU only | ~2 hours | ~10 hours |

**Cloud GPU options (cheapest):**
- [RunPod](https://runpod.io) — A100 at ~$1.50/hour
- [Vast.ai](https://vast.ai) — RTX 4090 at ~$0.40/hour
- [Google Colab Pro](https://colab.research.google.com) — A100 at ~$10/month

---

## Step 5: Test the Model

```bash
python inference.py \
  --model ./deepguard-clip-v1 \
  --image https://example.com/test-image.jpg
```

Or test with a local file:
```bash
python inference.py --model ./deepguard-clip-v1 --image ./test.jpg --json
```

Expected output:
```json
{
  "riskScore": 87,
  "verdict": "deepfake",
  "aiProbability": 87.3,
  "realProbability": 12.7,
  "predictedClass": "AI Generated",
  "confidence": 87.3,
  "engine": "DeepGuard-CLIP-v1"
}
```

---

## Step 6: Deploy to Hugging Face Hub

Hugging Face provides free model hosting with an inference API.

```bash
# Install CLI
pip install huggingface_hub

# Login
huggingface-cli login

# Push model
python train_clip_detector.py \
  --data training_data.csv \
  --push-to-hub your-username/deepguard-detector
```

Your model will be available at:
`https://huggingface.co/your-username/deepguard-detector`

---

## Step 7: Integrate Into DeepGuard Server

Once deployed to Hugging Face, add it as a fourth detection engine in `server/routers.ts`:

```typescript
// Add this function to server/routers.ts
async function deepguardModelDetect(imageUrl: string): Promise<{ score: number; available: boolean } | null> {
  try {
    const HF_API_KEY = process.env.HF_API_KEY;
    const MODEL_URL = "https://api-inference.huggingface.co/models/your-username/deepguard-detector";

    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: imageUrl }),
    });

    const result = await response.json();
    // result[0] = { label: "AI Generated", score: 0.87 }
    const aiEntry = result.find((r: any) => r.label === "AI Generated");
    return { score: Math.round((aiEntry?.score ?? 0) * 100), available: true };
  } catch {
    return null;
  }
}
```

Then add it to the `combineEngineScores` function with a 30% weight, and reduce LLM weight to 30%.

---

## Frequently Asked Questions

**Q: Do I need a GPU?**
A: No, but training on CPU takes hours. For serious training, rent a cloud GPU for $1–5 total.

**Q: How many epochs should I train?**
A: Start with 10. If validation F1 is still improving at epoch 10, continue to 15–20. Stop when it plateaus.

**Q: My model is overfitting (train acc >> val acc). What do I do?**
A: Increase dropout (edit `dropout=0.3` to `0.5`), reduce epochs, or collect more data.

**Q: Can I train on video frames too?**
A: Yes. Extract frames from deepfake videos using ffmpeg, label them as `deepfake_video`, and include them in the CSV. The model treats them as images.

**Q: How do I update the model with new data?**
A: Re-run the training script with the updated CSV. The script always trains from the base CLIP weights, so you get a fresh model each time. This prevents catastrophic forgetting.

---

## Files in This Directory

| File | Description |
|------|-------------|
| `train_clip_detector.py` | Main training script |
| `inference.py` | Test the model on a single image |
| `README.md` | This document |
| `requirements.txt` | Python dependencies |

---

## Contact

If you have questions about training or deployment, the model architecture is based on:
- [CLIP paper](https://arxiv.org/abs/2103.00020) (Radford et al., 2021)
- [Hugging Face CLIP docs](https://huggingface.co/docs/transformers/model_doc/clip)
