from agent.react.react import AgenticRAG
from agent.store.langchain_store import LangchainStore
from agent.configs.config import DATABASE_ENDPOINT
from loguru import logger
from typing import AsyncGenerator

agentic_rag: AgenticRAG | None = None
store : LangchainStore | None = None

def get_store() -> LangchainStore:
    global store
    if store is None:
        store = LangchainStore(DATABASE_ENDPOINT.get())
    return store


def get_agent(store=None) -> AgenticRAG:
    """Get or create the agentic RAG system."""
    global agentic_rag
    
    if agentic_rag is None:
        agentic_rag = AgenticRAG(store)
    
    return agentic_rag



