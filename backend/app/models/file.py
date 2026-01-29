from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, audio, video
    file_size = Column(Integer, nullable=False)
    file_path = Column(String, nullable=False)
    extracted_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)  # timestamps, duration, etc.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="files")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp_data = Column(JSON, nullable=True)  # relevant timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    file = relationship("File", backref="chat_messages")
    user = relationship("User", backref="chat_messages")
