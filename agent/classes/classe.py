from pydantic import BaseModel, Field
from typing import Optional ,Any , List , Dict
from datetime import datetime

class AskRequest(BaseModel):
    question: str
    thread_id: str
    file_id: Optional[List[int]] = None

class ThreadSummary(BaseModel):
    thread_id: str
    last_activity: Optional[datetime] = None
    checkpoint_count: int

class ThreadCreateRequest(BaseModel):
    thread_id: Optional[str] = None  # if not provided, we generate one

class ThreadCreateResponse(BaseModel):
    thread_id: str

class ThreadMessage(BaseModel):
    role: str
    content: Any
    name: Optional[str] = None
    tool_calls: Optional[Any] = None
    additional_kwargs: Optional[dict] = None

class ThreadDetailResponse(BaseModel):
    thread_id: str
    last_activity: Optional[datetime] = None
    messages: List[ThreadMessage]