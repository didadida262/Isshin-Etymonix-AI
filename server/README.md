# API 后端

FastAPI 服务：代理模型列表、经 LangGraph Agent 转发大模型对话。

## 本地运行

```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

## 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/models?api_key=...` | 代理获取可用模型列表 |
| POST | `/chat/stream` | SSE 流式对话（推荐） |
| POST | `/chat` | 非流式对话（一次性返回） |

### POST /chat 示例

```json
{
  "message": "解释词根 bene",
  "base_url": "https://aiplatform.njsrd.com/llm/v1",
  "api_key": "sk-...",
  "model": "qwen3.5-122b-a10b",
  "history": []
}
```
