from langchain.tools import tool , ToolRuntime
from langgraph.runtime import Runtime
from agent.react.tools.tool_schema import SearchWebInput
from agent.react.context import Context
from ddgs import DDGS
from loguru import logger
from typing import List, Dict, Annotated

@tool("web_search_tool", description="Search the internet for texts related to the question.", args_schema=SearchWebInput)
def search_web(
    query: str,
    max_results: int = 5,
    region: str | None = None,
    safesearch: str = "moderate",
    timelimit: str | None = None,
) -> List[Dict]:
    """
    Search the internet for texts related to the question using DuckDuckGo via ddgs.

    Args:
        query: The text / query to search for.
        max_results: Maximum number of results.
        region: Search region such as 'wt-wt', 'us-en', etc.
        safesearch: on, moderate, off.
        timelimit: d, w, m, y or None.

    Returns:
        A list of dictionaries for each result containing (title, href, body, ...).
    """
    try:
        logger.debug(
            f"search_web called with query={query}, max_results={max_results}, region={region}, safesearch={safesearch}, timelimit={timelimit}"
        )

        with DDGS() as ddgs:
            results = list(
                ddgs.text(
                    query=query,
                    region=region,
                    safesearch=safesearch,
                    timelimit=timelimit,
                    max_results=max_results,
                )
            )

        logger.debug(f"search_web returned {len(results)} results + data: {results}")
        return results

    except Exception as e:
        logger.error(f"Error in search_web: {e}")

        # Return a structured error instead of a random string
        return [
            {
                "title": "Search error",
                "href": "",
                "body": f"Search error: {e}",
            }
        ]

TOOLS = [search_web]

