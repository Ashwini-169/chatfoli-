from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Message(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    conversationHistory: List[Message]
    userMessage: str
    role: Optional[str] = "general"

class ChatResponse(BaseModel):
    assistantMessage: str
    resumeData: Optional[Dict[str, Any]] = None
