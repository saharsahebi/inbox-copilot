from typing import TypedDict, List, Optional
from pydantic import BaseModel

class EmailState(TypedDict):
    thread_id: str
    sender: str
    subject: str
    body: str
    suggested_actions: List[str]
    current_step: str
    user_decision: Optional[str]
    draft_response: Optional[str]

class UserActionRequest(BaseModel):
    thread_id: str
    decision: str