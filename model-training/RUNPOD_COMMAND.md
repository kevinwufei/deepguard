# 你的专属 RunPod 训练命令

模型仓库已创建：https://huggingface.co/kevinwufei/deepguard-detector

## 在 RunPod 终端里直接粘贴运行以下命令：

```bash
# 第一步：下载训练脚本
curl -fsSL https://raw.githubusercontent.com/kevinwufei/deepguard-demo/main/model-training/auto_train.sh -o auto_train.sh 2>/dev/null || \
wget -q https://raw.githubusercontent.com/kevinwufei/deepguard-demo/main/model-training/auto_train.sh 2>/dev/null || \
echo "请手动上传 auto_train.sh 文件"

# 第二步：运行训练（直接复制这一整行）
bash auto_train.sh \
  --hf-token YOUR_HUGGINGFACE_TOKEN \
  --hf-repo kevinwufei/deepguard-detector \
  --epochs 10 \
  --batch-size 32
```

## 如果无法从 GitHub 下载脚本，用这个方法：

在 RunPod 终端里运行：

```bash
pip install huggingface_hub
python3 -c "
from huggingface_hub import hf_hub_download
# 从 HuggingFace 下载脚本（训练完成后会上传到这里）
print('请直接粘贴 auto_train.sh 内容')
"
```

或者在 RunPod 的 **File Manager** 里直接上传 `auto_train.sh` 文件。

---

## 预期训练时间和费用

| GPU | 训练时间 | 费用 |
|-----|---------|------|
| RTX 4090 (推荐) | ~40 分钟 | ~$0.30 |
| A100 40GB | ~20 分钟 | ~$0.60 |
| RTX 3090 | ~60 分钟 | ~$0.25 |

## 训练完成后

训练完成后，模型会自动上传到：
https://huggingface.co/kevinwufei/deepguard-detector

然后告诉我，我立刻帮你把这个模型接入 DeepGuard 作为第四个检测引擎！
