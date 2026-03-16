# DeepGuard 模型训练部署指南

从注册到训练完成，全程约 30–60 分钟，费用不超过 $2。

---

## 第一步：注册 RunPod（约 5 分钟）

前往 [runpod.io](https://www.runpod.io) 注册账号，充值 $5（支持信用卡或加密货币）。$5 足够训练 2–3 个模型。

---

## 第二步：注册 Hugging Face（约 3 分钟）

前往 [huggingface.co](https://huggingface.co) 注册账号，然后在 **Settings → Access Tokens** 创建一个 Write 权限的 Token，格式为 `hf_xxxxxxxxxxxxxxxx`。

这个 Token 用于把训练好的模型上传到你的 Hugging Face 账号，之后 DeepGuard 服务器可以直接调用。

---

## 第三步：在 RunPod 启动 GPU 实例

登录 RunPod 后，点击 **Deploy** → **GPU Cloud**，按以下配置选择：

| 设置项 | 推荐选择 |
|--------|---------|
| GPU 型号 | RTX 4090（24GB VRAM）或 A100 40GB |
| 镜像 | `runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel` |
| 存储 | 20GB（足够） |
| 计费方式 | On-Demand（按小时） |

RTX 4090 约 $0.44/小时，训练 CIFAKE 数据集大概需要 40–60 分钟，总费用约 **$0.30–0.50**。

点击 **Deploy** 后等待实例启动（约 1–2 分钟），然后点击 **Connect → Start Web Terminal** 进入命令行。

---

## 第四步：运行一键训练脚本

在 RunPod 的终端里，依次运行以下命令：

```bash
# 1. 下载 DeepGuard 训练脚本
curl -O https://raw.githubusercontent.com/your-username/deepguard-demo/main/model-training/auto_train.sh

# 或者直接粘贴脚本内容（见下方）
```

如果你没有把代码上传到 GitHub，可以直接在终端里创建脚本文件：

```bash
# 在 RunPod 终端里运行：
cat > auto_train.sh << 'SCRIPT_END'
# 把 auto_train.sh 的全部内容粘贴到这里
SCRIPT_END

chmod +x auto_train.sh
```

然后运行训练：

```bash
bash auto_train.sh \
  --hf-token hf_你的Token \
  --hf-repo 你的用户名/deepguard-detector \
  --epochs 10 \
  --batch-size 32
```

**示例（把 `kevin` 替换成你的 Hugging Face 用户名）：**

```bash
bash auto_train.sh \
  --hf-token hf_abcdefghijklmnop \
  --hf-repo kevin/deepguard-detector \
  --epochs 10 \
  --batch-size 32
```

---

## 第五步：等待训练完成

训练过程会自动打印每个 epoch 的准确率，正常情况下：

```
Epoch  1/10 | Train Acc: 0.812 | Val Acc: 0.834 | Val F1: 0.831
Epoch  2/10 | Train Acc: 0.891 | Val Acc: 0.903 | Val F1: 0.901
  ✅ Best model saved (F1=0.901)
Epoch  3/10 | Train Acc: 0.921 | Val Acc: 0.927 | Val F1: 0.925
  ✅ Best model saved (F1=0.925)
...
Epoch 10/10 | Train Acc: 0.961 | Val Acc: 0.943 | Val F1: 0.941
  ✅ Best model saved (F1=0.941)

Training complete! Best F1: 0.941
Model uploaded to: https://huggingface.co/kevin/deepguard-detector
```

训练完成后，**立即关闭 RunPod 实例**（点击 Terminate），避免继续计费。

---

## 第六步：把模型接入 DeepGuard

训练完成后，在 DeepGuard 平台的管理面板里添加一个环境变量：

| 变量名 | 值 |
|--------|---|
| `HF_API_KEY` | 你的 Hugging Face Token（同上）|
| `HF_MODEL_REPO` | `你的用户名/deepguard-detector` |

然后告诉我，我帮你在 `server/routers.ts` 里把这个模型接入为第四个检测引擎（权重 30%），替换掉 Illuminarty 的位置。

---

## 费用汇总

| 项目 | 费用 |
|------|------|
| RunPod RTX 4090（1小时） | $0.44 |
| 实际训练时间（约40分钟） | **≈ $0.30** |
| Hugging Face 模型托管 | **免费**（公开模型无限免费） |
| Hugging Face 推理 API | 免费额度 30,000 次/月 |
| **总计（首次训练）** | **< $1** |

---

## 常见问题

**Q: 训练中途断了怎么办？**
A: 脚本每个 epoch 都会保存最佳模型，重新运行脚本即可从头开始（CIFAKE 数据集已缓存在本地）。

**Q: 显存不够（OOM 错误）怎么办？**
A: 把 `--batch-size 32` 改成 `--batch-size 16` 或 `--batch-size 8`，显存占用减半。

**Q: 训练完的模型准确率多少？**
A: 在 CIFAKE 数据集上，CLIP 微调通常能达到 92–96% 的验证准确率。加上你平台积累的真实用户数据后，准确率会进一步提升。

**Q: 可以用 Google Colab 代替 RunPod 吗？**
A: 可以，但 Colab 免费版有时间限制（约 12 小时），训练 120,000 张图片可能超时。建议用 Colab Pro（$10/月）或直接用 RunPod 按次付费。

---

## 下一步：持续改进模型

每次你的平台积累了新的用户反馈数据，可以：

1. 从 `/admin/training-data` 导出最新 CSV
2. 把 CSV 上传到 RunPod（用 `scp` 或直接粘贴）
3. 重新运行 `auto_train.sh`，加上 `--epochs 5`（微调已有模型，不用从头训练）
4. 新模型自动覆盖 Hugging Face 上的旧版本

随着数据积累，模型准确率会从 93% 逐步提升到 96–98%，最终超越 SightEngine 等商业 API。
