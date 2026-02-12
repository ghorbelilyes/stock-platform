import os

class _EnvironmentVariable:
    """
    Represents an environment variable.
    """

    def __init__(self, name, type_, default):
        self.name = name
        self.type = type_
        self.default = default

    @property
    def defined(self):
        return self.name in os.environ

    def get_raw(self):
        return os.getenv(self.name)

    def set(self, value):
        os.environ[self.name] = str(value)

    def unset(self):
        os.environ.pop(self.name, None)

    def get(self):
        """
        Reads the value of the environment variable if it exists and converts it to the desired
        type. Otherwise, returns the default value.
        """
        if (val := self.get_raw()) is not None:
            try:
                return self.type(val)
            except Exception as e:
                raise ValueError(f"Failed to convert {val!r} to {self.type} for {self.name}: {e}")
        return self.default

    def __str__(self):
        return f"{self.name} (default: {self.default}, type: {self.type.__name__})"

    def __repr__(self):
        return repr(self.name)

    def __format__(self, format_spec: str) -> str:
        return self.name.__format__(format_spec)


class _BooleanEnvironmentVariable(_EnvironmentVariable):
    """
    Represents a boolean environment variable.
    """

    def __init__(self, name, default):
        # `default not in [True, False, None]` doesn't work because `1 in [True]`
        # (or `0 in [False]`) returns True.
        if not (default is True or default is False or default is None):
            raise ValueError(f"{name} default value must be one of [True, False, None]")
        super().__init__(name, bool, default)

    def get(self):
        if not self.defined:
            return self.default

        val = os.getenv(self.name)
        lowercased = val.lower()
        if lowercased not in ["true", "false", "1", "0"]:
            raise ValueError(
                f"{self.name} value must be one of ['true', 'false', '1', '0'] (case-insensitive), "
                f"but got {val}"
            )
        return lowercased in ["true", "1"]

class _InsightItem:
    """
    Represents an insight item for metadata document system handling.
    """
    def __init__(self, name, id):
        self.name = name
        self.id = id

#: jwt signer for authentication
JWT_SIGNER = _EnvironmentVariable("JWT_SIGNER",str,"3d9f8c7e2b6a4f1d9e0b5a7c8d2f6b1e4a7c9d0f3b8e6a1d5c2f9b4e7a8d0c1f",)
#: logger level (example: debug, info )
LOG_LEVEL = _EnvironmentVariable("LOG_LEVEL",str,"DEBUG",)  
#: log storage path 
LOG_DIR = _EnvironmentVariable("LOG_DIR",str,"./logs",) 
#: database url (example: postgresql+psycopg2://<username>:<password>@<host>:<port>/<database> )
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
#: GEMINI_API_KEY api key for google ai 
GEMINI_API_KEY = _EnvironmentVariable("GEMINI_API_KEY",str,"AIzaSyBXlak-9dwqyYMRZ3wnojP402ZBoXSg2YI",) 
os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY.get()
#: gemini model gemini-2.5-flash gemini-2.5-pro
GEMINI_MODEL = _EnvironmentVariable("GEMINI_MODEL",str,"gemini/gemini-flash-lite-latest",)
MONITORING_ENABLED = _BooleanEnvironmentVariable("MONITORING_ENABLED", True)
#: langfuse public key
LANGFUSE_PUBLIC_KEY = _EnvironmentVariable("LANGFUSE_PUBLIC_KEY",str,"pk-lf-51f1d8c2-821c-4977-b6dd-8b4590c0e8d0",)
#: langfuse secret key
LANGFUSE_SECRET_KEY = _EnvironmentVariable("LANGFUSE_SECRET_KEY",str,"sk-lf-b91f99e9-671c-4ca6-87dc-eb5caec7d1ad",)
#: langfuse base url
LANGFUSE_BASE_URL = _EnvironmentVariable("LANGFUSE_BASE_URL",str,"http://localhost:3000",)

DATABASE_ENDPOINT = _EnvironmentVariable(
    "DATABASE_URL",
    str,
    "postgres://secret:secret@localhost:5432/stock?sslmode=disable"
)#: Specifies the ``pool_size`` parameter to use for ``sqlalchemy.create_engine`` in the SQLAlchemy
#: tracking store. See https://docs.sqlalchemy.org/en/14/core/engines.html#sqlalchemy.create_engine.params.pool_size
#: for more information.
#: (default: ``None``)
SQLALCHEMYSTORE_POOL_SIZE = _EnvironmentVariable(
    "SQLALCHEMYSTORE_POOL_SIZE", int, None
)
#: Specifies the ``max_overflow`` parameter to use for ``sqlalchemy.create_engine`` in the
#: SQLAlchemy tracking store. See https://docs.sqlalchemy.org/en/14/core/engines.html#sqlalchemy.create_engine.params.max_overflow
#: for more information.
#: (default: ``None``)
SQLALCHEMYSTORE_MAX_OVERFLOW = _EnvironmentVariable(
    "SQLALCHEMYSTORE_MAX_OVERFLOW", int, None
)
#: Specifies the ``pool_recycle`` parameter to use for ``sqlalchemy.create_engine`` in the
#: SQLAlchemy tracking store. See https://docs.sqlalchemy.org/en/14/core/engines.html#sqlalchemy.create_engine.params.pool_recycle
#: for more information.
#: (default: ``None``)
SQLALCHEMYSTORE_POOL_RECYCLE = _EnvironmentVariable(
    "SQLALCHEMYSTORE_POOL_RECYCLE", int, None
)
#: Specifies the ``echo`` parameter to use for ``sqlalchemy.create_engine`` in the
#: SQLAlchemy tracking store. See https://docs.sqlalchemy.org/en/14/core/engines.html#sqlalchemy.create_engine.params.echo
#: for more information.
#: (default: ``False``)
SQLALCHEMYSTORE_ECHO = _BooleanEnvironmentVariable("SQLALCHEMYSTORE_ECHO", False)
#: Specifies the ``poolclass`` parameter to use for ``sqlalchemy.create_engine`` in the
#: SQLAlchemy tracking store. See https://docs.sqlalchemy.org/en/14/core/engines.html#sqlalchemy.create_engine.params.poolclass
#: for more information.
#: (default: ``None``)
SQLALCHEMYSTORE_POOLCLASS = _EnvironmentVariable(
    "SQLALCHEMYSTORE_POOLCLASS", str, None
)
#: database connection retry 
MAX_RETRY_COUNT = 15
#: Set of SQLAlchemy database schemas supported in Retina train scheduler
POSTGRES = "postgresql"
MYSQL = "mysql"
SQLITE = "sqlite"
MSSQL = "mssql"
#: sql drivers
DATABASE_ENGINES = [POSTGRES, MYSQL, SQLITE, MSSQL]
#: insights by id within document system
class Insights:
    EMBEDDING = _InsightItem("embedding", 1)
    DENSE_SUMMARY = _InsightItem("dense summary", 2)
    ANALYZE_PAPER = _InsightItem("analyze paper", 3)
    KEY_INSIGHTS = _InsightItem("key insights", 4)
    REFLECTIONS = _InsightItem("reflections", 5)
    SIMPLE_SUMMARY = _InsightItem("simple summary", 6)
    TABLE_OF_CONTENT = _InsightItem("table of content", 7)
    MAP_WIZZARD = _InsightItem("map wizzard", 8)
ROLE_MAP = {
    "human": "user",
    "ai": "assistant",
    "system": "system",
    "tool": "tool",
}
