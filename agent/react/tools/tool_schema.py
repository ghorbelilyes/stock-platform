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
    query: str = Field(..., description="The text / question to search for on the web.")
    max_results: int = Field(5, description="Maximum number of results to retrieve.")
    region: str | None = Field(
        default=None,
        description="Search region like 'wt-wt', 'us-en', leave it empty for default."
    )
    safesearch: str = Field(
        default="moderate",
        description="SafeSearch level: on, moderate, off."
    )
    timelimit: str | None = Field(
        default=None,
        description="Time limit: d (day), w (week), m (month), y (year), or None."
    )

class GetStoresInput(BaseModel):
    page: int = Field(0, description="Page number")
    size: int = Field(20, description="Page size")
    sort: str | None = Field(None, description="Sorting field (e.g. 'name,asc')")
    search: str | None = Field(None, description="Global search string")
    name: str | None = Field(None, description="Filter by store name")
    serialNumber: str | None = Field(None, description="Filter by serial number")
    city: str | None = Field(None, description="Filter by city")
    type: str | None = Field(None, description="Filter by type")

class GetStoreByIdInput(BaseModel):
    store_id: int = Field(..., description="Store ID")

class GetProductsInput(BaseModel):
    page: int = Field(0, description="Page number")
    size: int = Field(20, description="Page size")
    sort: str | None = Field(None, description="Sorting (e.g. 'name,asc')")
    search: str | None = Field(None, description="Global search")
    name: str | None = Field(None, description="Filter by product name")
    codeBarre: str | None = Field(None, description="Filter by barcode")
    description: str | None = Field(None, description="Filter by description")
    categoryId: int | None = Field(None, description="Filter by category ID")

class GetProductByIdInput(BaseModel):
    product_id: int = Field(..., description="Product ID")

class GetStocksInput(BaseModel):
    storeId: int | None = Field(None, description="Filter by store ID")
    productId: int | None = Field(None, description="Filter by product ID")
    sort: str | None = Field(None, description="Sort field and direction (e.g. 'store.name,asc')")
    search: str | None = Field(None, description="Global search term")
    storeName: str | None = Field(None, description="Filter by store name")
    productName: str | None = Field(None, description="Filter by product name")
    city: str | None = Field(None, description="Filter by city")
    type: str | None = Field(None, description="Filter by store type")
    page: int = Field(0, description="Page number (0-indexed)")
    size: int = Field(20, description="Page size")

class GetStocksByStoreInput(BaseModel):
    store_id: int = Field(..., description="Store ID (path parameter)")
    page: int = Field(0, description="Page number (0-indexed)")
    size: int = Field(20, description="Page size")

class GetStocksByProductInput(BaseModel):
    product_id: int = Field(..., description="Product ID (path parameter)")
    page: int = Field(0, description="Page number (0-indexed)")
    size: int = Field(20, description="Page size")

class CreateTransferSuggestionInput(BaseModel):
    fromStoreId: int = Field(..., description="Source store ID")
    toStoreId: int = Field(..., description="Destination store ID")
    productId: int = Field(..., description="Product ID")
    quantity: int = Field(..., description="Quantity to transfer")
    priority: str = Field(..., description="Priority level (e.g. HIGH, MEDIUM, LOW)")
    reason: str = Field(..., description="Reason for transfer")
    confidence: float = Field(..., description="Confidence score (0–1 or percentage depending on backend)")

class GetTransferSuggestionsInput(BaseModel):
    pass

class GetTransfersInput(BaseModel):
    storeSent: int | None = Field(None, description="Filter by source store ID")
    storeReceive: int | None = Field(None, description="Filter by destination store ID")
    productId: int | None = Field(None, description="Filter by product ID")
    startDate: str | None = Field(None, description="Filter by start date (YYYY-MM-DD)")
    endDate: str | None = Field(None, description="Filter by end date (YYYY-MM-DD)")
    sort: str | None = Field(None, description="Sort field (e.g., 'date,desc')")
    search: str | None = Field(None, description="Global search term")
    page: int = Field(0, description="Page number (0-indexed)")
    size: int = Field(20, description="Page size")
