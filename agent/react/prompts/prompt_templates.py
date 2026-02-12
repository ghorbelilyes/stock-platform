from langchain_core.prompts import ChatPromptTemplate , PromptTemplate
from agent.react.prompts.prompt_text import ANALYZE_RESULT


analyze_paper_template = PromptTemplate(
    template=ANALYZE_RESULT,
    input_variables=["input_text"]
)
