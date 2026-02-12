from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from agent.routers.chat import genai 
from agent.configs.config import LOG_DIR, DATABASE_ENDPOINT
from agent.dependencies import get_agent , get_store
from loguru import logger 
import uvicorn
import os
# incr this for pipeline integration
VERSION="0.0.1"


@asynccontextmanager
async def lifespan(app: FastAPI):
    store = None
    """Startup & shutdown lifecycle."""
    logger.info(f"Initializing services ...")
    if DATABASE_ENDPOINT.get():
        logger.info("langchain store enabled !")
        store = get_store()
        await store.connect()
    get_agent(store)  
    try:
        yield  # --- App runs here ---
    finally:
        if store:
            await store.close()
        logger.info("Shutting down services...")
        logger.info("Shutdown complete.")

logger.add(f"{LOG_DIR.get()}/genai-doc-system.log", rotation="10 MB", retention="7 days", compression="zip")
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.include_router(genai)
app.mount("/chat", StaticFiles(directory=static_dir, html=True), name="static")



# --- Main Execution ---
if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)