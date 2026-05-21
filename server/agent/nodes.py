from langchain_openai import ChatOpenAI

from agent.persona import SYSTEM_PROMPT
from agent.sanitize import strip_think_content
from agent.schema import ChatState


def create_chat_node(base_url: str, api_key: str, model: str):
    llm = ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url=base_url.rstrip("/"),
    )

    def chat_node(state: ChatState) -> dict:
        response = llm.invoke(state["messages"])
        content = response.content if isinstance(response.content, str) else str(response.content)
        return {"reply": strip_think_content(content)}

    return chat_node
