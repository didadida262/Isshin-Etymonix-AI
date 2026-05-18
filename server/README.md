# Whisper ASR 后端

使用本地 HuggingFace 格式模型 + FastAPI，M4 Mac 自动启用 MPS 加速。

## 本地运行（推荐）

```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 默认读取 ~/Desktop/work/whisper-large-v3-turbo
python main.py
```

切换模型路径：
```bash
WHISPER_MODEL_PATH=/your/model/path python main.py
```

## 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查，返回设备信息 |
| POST | `/transcribe` | 上传音频，返回文本 |

`/transcribe` 参数：
- `file`（必填）：音频文件，支持 webm / ogg / wav / mp3 / mp4
- `language`（可选）：强制指定语言，如 `zh`、`en`
