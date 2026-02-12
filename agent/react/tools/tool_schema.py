from pydantic import BaseModel, Field
from typing import List , Annotated , Any
from langchain.tools import InjectedToolArg

class SearchEmbeddingsInput(BaseModel):
    """Input for search embeddings."""
    query: str = Field(description="Query to search for in the vector database")
    file_id: List[int] | None = Field(default=None, description="Optional files ID to filter results")
    k: int = Field(default=5, description="Number of results to return")
    runtime: Annotated[Any, InjectedToolArg]

class SearchWebInput(BaseModel):
    query: str = Field(..., description="النص / السؤال الذي سيتم البحث عنه في الويب.")
    max_results: int = Field(5, description="أقصى عدد من النتائج المراد استرجاعها.")
    region: str | None = Field(
        default=None,
        description="منطقة البحث مثل 'wt-wt', 'us-en'، اتركها فارغة للوضع الافتراضي."
    )
    safesearch: str = Field(
        default="moderate",
        description="مستوى SafeSearch: on, moderate, off."
    )
    timelimit: str | None = Field(
        default=None,
        description="المدّة الزمنية: d (يوم)، w (أسبوع)، m (شهر)، y (سنة)، أو None."
    )
