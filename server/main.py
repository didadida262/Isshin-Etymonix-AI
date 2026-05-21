import json
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from agent import run_chat, stream_chat
from agent.schema import ChatRequest, ChatResponse

MODELS_API_URL = "https://aiplatform.njsrd.com/nexus/api/api-keys/models"

app = FastAPI(title="API Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def parse_models_payload(data: Any) -> list[str]:
    """兼容多种模型列表返回格式。"""
    if isinstance(data, list):
        result: list[str] = []
        for item in data:
            if isinstance(item, str):
                result.append(item)
            elif isinstance(item, dict):
                name = item.get("id") or item.get("name") or item.get("model")
                if name:
                    result.append(str(name))
        return result

    if isinstance(data, dict):
        for key in ("data", "models", "items", "results"):
            if key in data:
                return parse_models_payload(data[key])
        if "model" in data and isinstance(data["model"], str):
            return [data["model"]]

    return []


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/models")
async def list_models(api_key: str = Query(..., description="API Key")):
    """代理获取可用模型列表。"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                MODELS_API_URL,
                params={"api_key": api_key},
            )
            if response.status_code >= 400:
                detail = response.text
                try:
                    body = response.json()
                    detail = body.get("detail", detail)
                except Exception:
                    pass
                raise HTTPException(status_code=response.status_code, detail=detail)

            payload = response.json()
            models = parse_models_payload(payload)
            return {"models": models, "raw": payload}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"获取模型列表失败: {e}") from e


def _validate_chat_request(req: ChatRequest) -> None:
    if not req.api_key.strip():
        raise HTTPException(status_code=400, detail="api_key 不能为空")
    if not req.model.strip():
        raise HTTPException(status_code=400, detail="model 不能为空")
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="message 不能为空")


@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """SSE 流式对话。"""
    _validate_chat_request(req)

    def event_generator():
        try:
            for delta in stream_chat(
                message=req.message.strip(),
                history=req.history,
                base_url=req.base_url.strip() or "https://aiplatform.njsrd.com/llm/v1",
                api_key=req.api_key.strip(),
                model=req.model.strip(),
            ):
                payload = json.dumps({"content": delta}, ensure_ascii=False)
                yield f"data: {payload}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            payload = json.dumps({"error": str(e)}, ensure_ascii=False)
            yield f"data: {payload}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """经 AI Agent 调用大模型对话。"""
    _validate_chat_request(req)

    try:
        reply = run_chat(
            message=req.message.strip(),
            history=req.history,
            base_url=req.base_url.strip() or "https://aiplatform.njsrd.com/llm/v1",
            api_key=req.api_key.strip(),
            model=req.model.strip(),
        )
        return ChatResponse(reply=reply or "")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
