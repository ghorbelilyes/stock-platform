from dataclasses import dataclass
from typing import List, Dict, Any
from dataclasses import field

@dataclass
class Context:
    user_id: str
    thread_id: str 
    metadata: Dict[Any, Any]
