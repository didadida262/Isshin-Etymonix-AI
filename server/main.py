import os
import tempfile
from pathlib import Path
from typing import Optional

import torch
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI(title="Whisper ASR Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 模型路径：优先读环境变量，默认指向本地已下载的目录
MODEL_PATH = os.environ.get(
    "WHISPER_MODEL_PATH",
    str(Path.home() / "Desktop/work/whisper-large-v3-turbo"),
)

# M4 Mac 用 MPS 加速；有 CUDA 用 CUDA；否则 CPU
if torch.backends.mps.is_available():
    device = "mps"
    dtype = torch.float16
elif torch.cuda.is_available():
    device = "cuda"
    dtype = torch.float16
else:
    device = "cpu"
    dtype = torch.float32

print(f"[Whisper] 模型路径: {MODEL_PATH}")
print(f"[Whisper] 推理设备: {device}")
print("[Whisper] 加载模型中...")

pipe = pipeline(
    "automatic-speech-recognition",
    model=MODEL_PATH,
    device=device,
    dtype=dtype,
)

print("[Whisper] 模型加载完成 ✓")


class TranscribeResult(BaseModel):
    text: str
    language: str


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_PATH, "device": device}


@app.post("/transcribe", response_model=TranscribeResult)
async def transcribe(
    file: UploadFile = File(...),
    language: Optional[str] = None,
):
    """
    接收音频文件，返回识别文本。
    language: 可选，强制指定语言如 'zh'、'en'，不传则自动检测。
    """
    suffix = _get_suffix(file.content_type or "")
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        generate_kwargs: dict = {"task": "transcribe"}
        if language:
            generate_kwargs["language"] = language

        result = pipe(
            tmp_path,
            generate_kwargs=generate_kwargs,
            return_timestamps=False,
        )

        text = result["text"].strip() if isinstance(result, dict) else ""
        detected_lang = language or ""

        return TranscribeResult(text=text, language=detected_lang)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)


def _get_suffix(content_type: str) -> str:
    mapping = {
        "audio/webm": ".webm",
        "audio/ogg": ".ogg",
        "audio/wav": ".wav",
        "audio/mpeg": ".mp3",
        "audio/mp4": ".mp4",
        "audio/x-m4a": ".m4a",
    }
    return mapping.get(content_type, ".webm")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
