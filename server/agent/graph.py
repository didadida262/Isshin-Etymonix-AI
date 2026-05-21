from collections.abc import Iterator

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph

from agent.nodes import create_chat_node
from agent.persona import SYSTEM_PROMPT
from agent.sanitize import strip_think_content
from agent.schema import ChatMessage, ChatState


def build_messages(user_message: str, history: list[ChatMessage]) -> list:
    messages: list = [SystemMessage(content=SYSTEM_PROMPT)]
    for item in history:
        if item.role == "user":
            messages.append(HumanMessage(content=item.content))
        elif item.role == "assistant":
            messages.append(AIMessage(content=item.content))
    messages.append(HumanMessage(content=user_message))
    return messages


def run_chat(
    message: str,
    history: list[ChatMessage],
    base_url: str,
    api_key: str,
    model: str,
) -> str:
    workflow = StateGraph(ChatState)
    workflow.add_node("chat", create_chat_node(base_url, api_key, model))
    workflow.set_entry_point("chat")
    workflow.add_edge("chat", END)
    app = workflow.compile()

    result = app.invoke(
        {
            "messages": build_messages(message, history),
            "reply": "",
        }
    )
    return result.get("reply", "")


def _chunk_text(chunk) -> str:
    content = getattr(chunk, "content", chunk)
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict) and block.get("type") == "text":
                parts.append(str(block.get("text", "")))
        return "".join(parts)
    return str(content) if content else ""


def stream_chat(
    message: str,
    history: list[ChatMessage],
    base_url: str,
    api_key: str,
    model: str,
) -> Iterator[str]:
    """流式输出可见正文增量（已过滤 think 块）。"""
    llm = ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url=base_url.rstrip("/"),
    )
    messages = build_messages(message, history)
    accumulated = ""
    visible_prev = ""

    for chunk in llm.stream(messages):
        text = _chunk_text(chunk)
        if not text:
            continue
        accumulated += text
        visible = strip_think_content(accumulated)
        delta = visible[len(visible_prev) :]
        visible_prev = visible
        if delta:
            yield delta
