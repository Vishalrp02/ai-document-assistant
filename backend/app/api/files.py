import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.config import settings
from ..models.user import User
from ..models.file import File, ChatMessage
from ..schemas.file import FileResponse, ChatMessageCreate, ChatMessageResponse, SummaryRequest, SummaryResponse
from ..services.auth import get_current_user
from ..services.file_processor import FileProcessor

router = APIRouter(prefix="/api", tags=["files"])
file_processor = FileProcessor()


@router.post("/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file (PDF, audio, or video)"""
    # Validate file type
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in settings.allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_extension} not allowed"
        )
    
    # Validate file size
    file_content = await file.read()
    if len(file_content) > settings.max_file_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed size of {settings.max_file_size} bytes"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(settings.upload_dir, unique_filename)
    
    # Ensure upload directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Determine file type
    if file_extension == ".pdf":
        file_type = "pdf"
    elif file_extension in [".mp3", ".wav", ".m4a"]:
        file_type = "audio"
    elif file_extension in [".mp4", ".mov"]:
        file_type = "video"
    else:
        file_type = "other"
    
    # Create database record
    db_file = File(
        filename=unique_filename,
        original_filename=file.filename,
        file_type=file_type,
        file_size=len(file_content),
        file_path=file_path,
        user_id=current_user.id
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    # Process file asynchronously
    try:
        processed_data = await file_processor.process_file(file_path, file_type)
        db_file.extracted_text = processed_data["extracted_text"]
        db_file.metadata = processed_data["metadata"]
        db.commit()
        db.refresh(db_file)
    except Exception as e:
        # If processing fails, delete the file and record
        db.delete(db_file)
        db.commit()
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process file: {str(e)}"
        )
    
    return db_file


@router.get("/files", response_model=List[FileResponse])
async def get_files(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all files for current user"""
    files = db.query(File).filter(File.user_id == current_user.id).all()
    return files


@router.get("/files/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific file details"""
    file = db.query(File).filter(
        File.id == file_id,
        File.user_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return file


@router.delete("/files/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file"""
    file = db.query(File).filter(
        File.id == file_id,
        File.user_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Delete physical file
    if os.path.exists(file.file_path):
        os.remove(file.file_path)
    
    # Delete database record
    db.delete(file)
    db.commit()
    
    return {"message": "File deleted successfully"}


@router.post("/summarize/{file_id}", response_model=SummaryResponse)
async def summarize_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate summary for a file"""
    file = db.query(File).filter(
        File.id == file_id,
        File.user_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    if not file.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File has not been processed yet"
        )
    
    # Generate summary
    try:
        summary_data = await file_processor.generate_summary(file.extracted_text)
        
        # Update file with summary
        file.summary = summary_data["summary"]
        db.commit()
        
        return SummaryResponse(
            summary=summary_data["summary"],
            key_points=summary_data["key_points"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}"
        )


@router.post("/chat", response_model=ChatMessageResponse)
async def chat_with_file(
    chat_message: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat with AI about uploaded files"""
    # Get file if specified
    file = None
    timestamps = None
    document_text = ""
    
    if chat_message.file_id:
        file = db.query(File).filter(
            File.id == chat_message.file_id,
            File.user_id == current_user.id
        ).first()
        
        if not file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        document_text = file.extracted_text or ""
        timestamps = file.metadata.get("timestamps", []) if file.metadata else []
    
    # If no file specified, get all user's files text
    if not document_text:
        files = db.query(File).filter(File.user_id == current_user.id).all()
        document_text = "\n\n".join([f.extracted_text or "" for f in files])
    
    if not document_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No documents available to chat with"
        )
    
    try:
        # Get AI response
        chat_response = await file_processor.chat_with_document(
            chat_message.message,
            document_text,
            timestamps
        )
        
        # Save chat message
        db_chat = ChatMessage(
            message=chat_message.message,
            response=chat_response["response"],
            file_id=chat_message.file_id,
            user_id=current_user.id,
            timestamp_data=chat_response["timestamp_data"]
        )
        db.add(db_chat)
        db.commit()
        db.refresh(db_chat)
        
        return db_chat
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get AI response: {str(e)}"
        )


@router.get("/chat/history", response_model=List[ChatMessageResponse])
async def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chat history for current user"""
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.desc()).all()
    
    return messages
