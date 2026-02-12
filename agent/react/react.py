from langgraph.checkpoint.memory import InMemorySaver 
from langgraph.checkpoint.postgres import PostgresSaver  
from langgraph.prebuilt import ToolNode
from langchain.agents import create_agent
from langchain_litellm import ChatLiteLLM
from agent.configs.config import GEMINI_MODEL, DATABASE_ENDPOINT
from agent.react.tools.tool import TOOLS
from agent.react.prompts.prompt_text import SYSTEM_PROMPT
from agent.react.context import Context
from agent.store.langchain_store import LangchainStore    
from loguru import logger
import litellm

class AgenticRAG:

    def __init__(self,memory:LangchainStore):
        self.llm = self._build_llm()
        self.memory = self._create_memory(memory)
        self.agent = self._build_agent()
        
    def _build_llm(self) -> ChatLiteLLM:
        model_name = GEMINI_MODEL.get()
        supports_reasoning = litellm.supports_reasoning(model=model_name)
        
        llm_kwargs = {
            "model": model_name,
            "temperature": 0,
            "streaming": True
        }

        if supports_reasoning:
            llm_kwargs["model_kwargs"] = {"reasoning_effort": "low"}
            logger.info(f"Reasoning enabled for model: {model_name} with reasoning_effort=low")
        else:
            logger.info(f"Model {model_name} does not support reasoning")

        return ChatLiteLLM(**llm_kwargs)

    def _build_agent(self):
        return create_agent(self.llm, tools=TOOLS, system_prompt=SYSTEM_PROMPT, context_schema=Context, checkpointer=self.memory)

    def _build_graph(self):
        raise NotImplementedError()

    def _create_memory(self,memory:LangchainStore):
        if memory:
            logger.info("Agent using AsyncPostgresSaver for memory")
            return memory.saver
        else:
            logger.info("Agent using InMemorySaver for memory")
            return InMemorySaver()