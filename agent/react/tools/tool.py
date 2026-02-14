from langchain.tools import tool , ToolRuntime
from langgraph.runtime import Runtime
from agent.react.tools.tool_schema import SearchWebInput, GetStoresInput, GetStoreByIdInput, GetProductsInput, GetProductByIdInput, GetStocksInput, GetStocksByStoreInput, GetStocksByProductInput, CreateTransferSuggestionInput, GetTransferSuggestionsInput, GetTransfersInput
from agent.react.context import Context
from agent.configs.config import STOCK_ENDPOINT
from ddgs import DDGS
from loguru import logger
from typing import List, Dict, Annotated, Any, Optional
import requests

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


@tool("get_stores", description="Fetch stores from the API with filters and pagination.", args_schema=GetStoresInput)
def get_stores(
    page: int = 0,
    size: int = 20,
    sort: Optional[str] = None,
    search: Optional[str] = None,
    name: Optional[str] = None,
    serialNumber: Optional[str] = None,
    city: Optional[str] = None,
    type: Optional[str] = None,
    token: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetch stores from the API.

    :param page: Page number
    :param size: Page size
    :param sort: Sorting field (e.g. 'name,asc')
    :param search: Global search string
    :param name: Filter by store name
    :param serialNumber: Filter by serial number
    :param city: Filter by city
    :param type: Filter by type
    :param token: Optional Bearer token for authentication
    :return: JSON response as dict
    """
    try:
        url = f"{STOCK_ENDPOINT.get()}/api/stores"

        params = {
            "page": page,
            "size": size,
        }

        # Add optional filters only if provided
        if sort:
            params["sort"] = sort
        if search:
            params["search"] = search
        if name:
            params["name"] = name
        if serialNumber:
            params["serialNumber"] = serialNumber
        if city:
            params["city"] = city
        if type:
            params["type"] = type

        headers = {
            "Accept": "application/json"
        }

        if token:
            headers["Authorization"] = f"Bearer {token}"

        response = requests.get(url, params=params, headers=headers)

        # Raise error if request failed
        response.raise_for_status()

        return response.json()
    except Exception as e:
        logger.error(f"Error in get_stores: {e}")
        return {"error": str(e)}

@tool("get_store_by_id", description="Fetch a single store by ID.", args_schema=GetStoreByIdInput)
def get_store_by_id(
    store_id: int,
    token: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fetch a single store by ID.

    :param store_id: Store ID
    :param token: Optional Bearer token
    :return: JSON response
    """
    try:
        url = f"{STOCK_ENDPOINT.get()}/api/stores/{store_id}"

        headers = {
            "Accept": "application/json"
        }

        if token:
            headers["Authorization"] = f"Bearer {token}"

        response = requests.get(url, headers=headers)

        # Raise exception if HTTP error (4xx / 5xx)
        response.raise_for_status()

        data = response.json()

        # Handle API-level error (success = false)
        if not data.get("success", False) and "success" in data:
             # The original code checked data.get("success", False). 
             # I should be careful if the API doesn't return success field in success case.
             # But let's assume the user code is correct for their API.
             # However, typically APIs return just the object or a wrapper.
             # The user code: if not data.get("success", False): ... raise ...
             # This implies the API always returns {success: true, ...} or {success: false, error: ...}
             pass
        
        # User code logic for error checking:
        # if not data.get("success", False):
        #    error = data.get("error", {})
        #    raise Exception(...)
        
        # I will include this logic.
        if isinstance(data, dict) and "success" in data and not data["success"]:
             error = data.get("error", {})
             raise Exception(f"API Error [{error.get('code')}]: {error.get('message')}")

        return data
    except Exception as e:
        logger.error(f"Error in get_store_by_id: {e}")
        return {"error": str(e)}


@tool("get_products", description="Fetch products with pagination and filters.", args_schema=GetProductsInput)
def get_products(
    page: int = 0,
    size: int = 20,
    sort: Optional[str] = None,
    search: Optional[str] = None,
    name: Optional[str] = None,
    codeBarre: Optional[str] = None,
    description: Optional[str] = None,
    categoryId: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Fetch products with pagination and filters.

    :param page: Page number
    :param size: Page size
    :param sort: Sorting (e.g. 'name,asc')
    :param search: Global search
    :param name: Filter by product name
    :param codeBarre: Filter by barcode
    :param description: Filter by description
    :param categoryId: Filter by category ID
    :return: JSON response
    """
    try:
        url = f"{STOCK_ENDPOINT.get()}/api/products"

        params = {
            "page": page,
            "size": size,
        }

        # Add optional parameters only if provided
        if sort:
            params["sort"] = sort
        if search:
            params["search"] = search
        if name:
            params["name"] = name
        if codeBarre:
            params["codeBarre"] = codeBarre
        if description:
            params["description"] = description
        if categoryId is not None:
            params["categoryId"] = categoryId

        headers = {
            "Accept": "application/json"
        }

        response = requests.get(url, params=params, headers=headers)

        # Raise HTTP error if exists
        response.raise_for_status()

        data = response.json()

        # Handle API-level error
        if isinstance(data, dict) and "success" in data and not data["success"]:
            error = data.get("error", {})
            raise Exception(f"API Error [{error.get('code')}]: {error.get('message')}")

        return data
    except Exception as e:
        logger.error(f"Error in get_products: {e}")
        return {"error": str(e)}

@tool("get_product_by_id", description="Fetch a single product by ID.", args_schema=GetProductByIdInput)
def get_product_by_id(
    product_id: int,
) -> Dict[str, Any]:
    """
    Fetch a single product by ID.

    :param product_id: Product ID
    :return: JSON response
    """
    try:
        url = f"{STOCK_ENDPOINT.get()}/api/products/{product_id}"

        headers = {
            "Accept": "application/json"
        }

        response = requests.get(url, headers=headers)

        # Raise HTTP error if request failed
        response.raise_for_status()

        data = response.json()

        # Handle API-level error
        if isinstance(data, dict) and "success" in data and not data["success"]:
            error = data.get("error", {})
            raise Exception(f"API Error [{error.get('code')}]: {error.get('message')}")

        return data
    except Exception as e:
        logger.error(f"Error in get_product_by_id: {e}")
        return {"error": str(e)}


@tool("get_stocks", description="Retrieve stocks with optional filters and pagination.", args_schema=GetStocksInput)
def get_stocks(
    storeId: Optional[int] = None,
    productId: Optional[int] = None,
    sort: Optional[str] = None,
    search: Optional[str] = None,
    storeName: Optional[str] = None,
    productName: Optional[str] = None,
    city: Optional[str] = None,
    type: Optional[str] = None,
    page: int = 0,
    size: int = 20,
) -> Dict[str, Any]:
    """
    Retrieve stocks with optional filters and pagination.

    :param storeId: Filter by store ID
    :param productId: Filter by product ID
    :param sort: Sort field and direction (e.g. 'store.name,asc')
    :param search: Global search term
    :param storeName: Filter by store name
    :param productName: Filter by product name
    :param city: Filter by city
    :param type: Filter by store type
    :param page: Page number (0-indexed)
    :param size: Page size
    :return: JSON response
    """
    try:
        url = f"{STOCK_ENDPOINT.get()}/api/stocks"

        params = {
            "page": page,
            "size": size,
        }

        # Optional filters
        if storeId is not None:
            params["storeId"] = storeId
        if productId is not None:
            params["productId"] = productId
        if sort:
            params["sort"] = sort
        if search:
            params["search"] = search
        if storeName:
            params["storeName"] = storeName
        if productName:
            params["productName"] = productName
        if city:
            params["city"] = city
        if type:
            params["type"] = type

        headers = {
            "Accept": "application/json"
        }

        response = requests.get(url, params=params, headers=headers)

        # Raise HTTP errors
        response.raise_for_status()

        data = response.json()

        # Handle API-level error
        if isinstance(data, dict) and "success" in data and not data["success"]:
            error = data.get("error", {})
            raise Exception(f"API Error [{error.get('code')}]: {error.get('message')}")

        return data
    except Exception as e:
        logger.error(f"Error in get_stocks: {e}")
        return {"error": str(e)}

@tool("get_stocks_by_store", description="Retrieve all stock entries for a specific store.", args_schema=GetStocksByStoreInput)
def get_stocks_by_store(
    store_id: int,
    page: int = 0,
    size: int = 20,
) -> Dict[str, Any]:
    """
    Retrieve all stock entries for a specific store
    including incoming/outgoing transfer quantities.

    :param store_id: Store ID
    :param page: Page number (0-indexed)
    :param size: Page size
    :return: JSON response
    """
    try:
        url = f"{STOCK_ENDPOINT.get()}/api/stocks/store/{store_id}"

        params = {
            "page": page,
            "size": size
        }

        headers = {
            "Accept": "application/json"
        }

        response = requests.get(url, params=params, headers=headers)

        # Raise HTTP error if failed
        response.raise_for_status()

        data = response.json()

        # Handle API-level error
        if isinstance(data, dict) and "success" in data and not data["success"]:
            error = data.get("error", {})
            raise Exception(f"API Error [{error.get('code')}]: {error.get('message')}")

        return data
    except Exception as e:
        logger.error(f"Error in get_stocks_by_store: {e}")
        return {"error": str(e)}

@tool("get_stocks_by_product", description="Retrieve all stock entries for a specific product.", args_schema=GetStocksByProductInput)
def get_stocks_by_product(
    product_id: int,
    page: int = 0,
    size: int = 20,
) -> Dict[str, Any]:
    """
    Retrieve all stock entries for a specific product
    across all stores with pagination.

    :param product_id: Product ID
    :param page: Page number (0-indexed)
    :param size: Page size
    :return: JSON response
    """
    try:
        url = f"{STOCK_ENDPOINT.get()}/api/stocks/product/{product_id}"

        params = {
            "page": page,
            "size": size
        }

        headers = {
            "Accept": "application/json"
        }

        response = requests.get(url, params=params, headers=headers)

        # Raise HTTP errors (4xx/5xx)
        response.raise_for_status()

        data = response.json()

        # Handle API-level error
        if isinstance(data, dict) and "success" in data and not data["success"]:
            error = data.get("error", {})
            raise Exception(f"API Error [{error.get('code')}]: {error.get('message')}")

        return data
    except Exception as e:
        logger.error(f"Error in get_stocks_by_product: {e}")
        return {"error": str(e)}


@tool("create_transfer_suggestion", description="Create a transfer suggestion.", args_schema=CreateTransferSuggestionInput)
def create_transfer_suggestion(
    fromStoreId: int,
    toStoreId: int,
    productId: int,
    quantity: int,
    priority: str,
    reason: str,
    confidence: float,
) -> Dict[str, Any]:
    """
    Create a transfer suggestion.

    :param fromStoreId: Source store ID
    :param toStoreId: Destination store ID
    :param productId: Product ID
    :param quantity: Quantity to transfer
    :param priority: Priority level (e.g. HIGH, MEDIUM, LOW)
    :param reason: Reason for transfer
    :param confidence: Confidence score (0–1 or percentage depending on backend)
    :return: JSON response
    """
    try:
        url = f"{STOCK_ENDPOINT.get()}/api/transfers/suggestions"

        payload = {
            "fromStoreId": fromStoreId,
            "toStoreId": toStoreId,
            "productId": productId,
            "quantity": quantity,
            "priority": priority,
            "reason": reason,
            "confidence": confidence,
        }

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        response = requests.post(url, json=payload, headers=headers)

        # Raise HTTP errors
        response.raise_for_status()

        data = response.json()

        # Handle API-level error
        if isinstance(data, dict) and "success" in data and not data["success"]:
            error = data.get("error", {})
            raise Exception(f"API Error [{error.get('code')}]: {error.get('message')}")

        return data
    except Exception as e:
        logger.error(f"Error in create_transfer_suggestion: {e}")
        return {"error": str(e)}

@tool("get_transfer_suggestions", description="Retrieve all transfer suggestions.", args_schema=GetTransferSuggestionsInput)
def get_transfer_suggestions() -> Dict[str, Any]:
    """
    Retrieve all transfer suggestions.

    :return: JSON response
    """
    try:
        url = f"{STOCK_ENDPOINT.get()}/api/transfers/suggestions"

        headers = {
            "Accept": "application/json"
        }

        response = requests.get(url, headers=headers)

        # Raise HTTP errors (4xx / 5xx)
        response.raise_for_status()

        data = response.json()

        # Handle API-level error
        if isinstance(data, dict) and "success" in data and not data["success"]:
            error = data.get("error", {})
            raise Exception(f"API Error [{error.get('code')}]: {error.get('message')}")

        return data
    except Exception as e:
        logger.error(f"Error in get_transfer_suggestions: {e}")
        return {"error": str(e)}


@tool("get_transfers", description="Retrieve stock transfers with optional filters and pagination.", args_schema=GetTransfersInput)
def get_transfers(
    storeSent: Optional[int] = None,
    storeReceive: Optional[int] = None,
    productId: Optional[int] = None,
    startDate: Optional[str] = None,  # format: 'YYYY-MM-DD'
    endDate: Optional[str] = None,    # format: 'YYYY-MM-DD'
    sort: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 0,
    size: int = 20,
) -> Dict[str, Any]:
    """
    Retrieve stock transfers with optional filters and pagination.

    :param storeSent: Filter by source store ID
    :param storeReceive: Filter by destination store ID
    :param productId: Filter by product ID
    :param startDate: Filter by start date (YYYY-MM-DD)
    :param endDate: Filter by end date (YYYY-MM-DD)
    :param sort: Sort field (e.g., 'date,desc')
    :param search: Global search term
    :param page: Page number (0-indexed)
    :param size: Page size
    :return: JSON response
    """
    try:
        url = f"{STOCK_ENDPOINT.get()}/api/transfers"

        params = {
            "page": page,
            "size": size
        }

        # Optional filters
        if storeSent is not None:
            params["storeSent"] = storeSent
        if storeReceive is not None:
            params["storeReceive"] = storeReceive
        if productId is not None:
            params["productId"] = productId
        if startDate:
            params["startDate"] = startDate
        if endDate:
            params["endDate"] = endDate
        if sort:
            params["sort"] = sort
        if search:
            params["search"] = search

        headers = {
            "Accept": "application/json"
        }

        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()

        data = response.json()

        if isinstance(data, dict) and "success" in data and not data["success"]:
            error = data.get("error", {})
            raise Exception(f"API Error [{error.get('code')}]: {error.get('message')}")

        return data
    except Exception as e:
        logger.error(f"Error in get_transfers: {e}")
        return {"error": str(e)}

TOOLS = [search_web, get_stores, get_store_by_id, get_products, get_product_by_id, get_stocks, get_stocks_by_store, get_stocks_by_product, create_transfer_suggestion, get_transfer_suggestions, get_transfers]

