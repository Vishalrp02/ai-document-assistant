from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class FileBase(BaseModel):
    filename: str
    original_filename: str
    file_type: str
    file_size: int


class FileCreate(FileBase):
    file_path: str


class FileResponse(FileBase):
    id: int
    extracted_text: Optional[str] = None
    summary: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatMessageBase(BaseModel):
    message: str


class ChatMessageCreate(ChatMessageBase):
    file_id: Optional[int] = None


class ChatMessageResponse(ChatMessageBase):
    id: int
    response: str
    file_id: Optional[int] = None
    timestamp_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class SummaryRequest(BaseModel):
    file_id: int


class SummaryResponse(BaseModel):
    summary: str
    key_points: List[str]


class TimestampExtraction(BaseModel):
    topic: str
    timestamp: float
    confidence: float
    context: str
