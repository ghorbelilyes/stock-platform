from typing import Optional
from loguru import logger
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver


class LangchainStore:
    """Wrapper for AsyncPostgresSaver with long-lived connection."""

    def __init__(self, db_uri: str, use_pipeline: bool = False):
        self.db_uri = db_uri
        self.use_pipeline = use_pipeline
        self._cm: Optional[AsyncPostgresSaver] = None  # the context manager
        self.saver: Optional[AsyncPostgresSaver] = None  # the actual saver

    async def connect(self):
        """Initialize the saver from the connection string and run migrations."""
        logger.info("Initializing AsyncPostgresSaver...")

        self._cm = AsyncPostgresSaver.from_conn_string(
            self.db_uri,
            pipeline=self.use_pipeline,
        )

        self.saver = await self._cm.__aenter__()

        logger.info("Running migrations...")
        await self.saver.setup()
        logger.info("AsyncPostgresSaver ready.")

    async def close(self):
        """Close the saver and its connection."""
        if self._cm:
            await self._cm.__aexit__(None, None, None)
            logger.info("AsyncPostgresSaver connection closed.")
            self._cm = None
            self.saver = None
