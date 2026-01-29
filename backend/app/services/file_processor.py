import os
import uuid
from typing import Dict, Any, List
from pathlib import Path
import PyPDF2
import pdfplumber
import whisper
from openai import OpenAI
from sentence_transformers import SentenceTransformer
import numpy as np
from ..core.config import settings


class FileProcessor:
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.whisper_model = whisper.load_model("base")
        self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
    
    async def process_file(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """Process uploaded file and extract content"""
        if file_type == "pdf":
            return await self._process_pdf(file_path)
        elif file_type in ["mp3", "wav", "m4a", "mp4", "mov"]:
            return await self._process_media(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    
    async def _process_pdf(self, file_path: str) -> Dict[str, Any]:
        """Extract text from PDF file"""
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
        except Exception as e:
            # Fallback to PyPDF2
            try:
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        text += page.extract_text()
            except Exception as fallback_error:
                raise Exception(f"Failed to extract text from PDF: {str(e)}, {str(fallback_error)}")
        
        return {
            "extracted_text": text,
            "metadata": {
                "pages": len(PyPDF2.PdfReader(open(file_path, 'rb')).pages),
                "type": "pdf"
            }
        }
    
    async def _process_media(self, file_path: str) -> Dict[str, Any]:
        """Transcribe audio/video file using Whisper"""
        try:
            result = self.whisper_model.transcribe(file_path)
            segments = result["segments"]
            
            # Extract timestamps for different topics
            timestamps = []
            for segment in segments:
                timestamps.append({
                    "start": segment["start"],
                    "end": segment["end"],
                    "text": segment["text"].strip(),
                    "confidence": segment.get("avg_logprob", 0)
                })
            
            return {
                "extracted_text": result["text"],
                "metadata": {
                    "duration": result.get("duration", 0),
                    "language": result.get("language", "unknown"),
                    "timestamps": timestamps,
                    "type": "media"
                }
            }
        except Exception as e:
            raise Exception(f"Failed to transcribe media file: {str(e)}")
    
    async def generate_summary(self, text: str) -> Dict[str, Any]:
        """Generate summary using OpenAI"""
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that summarizes documents. Provide a concise summary and extract key points."
                    },
                    {
                        "role": "user",
                        "content": f"Please summarize the following text and extract the main key points:\n\n{text}"
                    }
                ],
                max_tokens=1000,
                temperature=0.3
            )
            
            summary_text = response.choices[0].message.content
            
            # Extract key points
            key_points_response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "Extract the main key points from the text. Return them as a numbered list."
                    },
                    {
                        "role": "user",
                        "content": f"Extract key points from:\n\n{text}"
                    }
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            key_points_text = key_points_response.choices[0].message.content
            key_points = [point.strip() for point in key_points_text.split('\n') if point.strip() and point[0].isdigit()]
            
            return {
                "summary": summary_text,
                "key_points": key_points
            }
        except Exception as e:
            raise Exception(f"Failed to generate summary: {str(e)}")
    
    async def chat_with_document(self, message: str, document_text: str, timestamps: List[Dict] = None) -> Dict[str, Any]:
        """Chat with document using OpenAI"""
        try:
            # Create context for the AI
            context = f"Document content:\n{document_text}\n\nUser question: {message}"
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that answers questions based on the provided document content. If relevant timestamps are available, mention them in your response."
                    },
                    {
                        "role": "user",
                        "content": context
                    }
                ],
                max_tokens=1500,
                temperature=0.3
            )
            
            ai_response = response.choices[0].message.content
            
            # Extract relevant timestamps if available
            relevant_timestamps = []
            if timestamps:
                # Simple keyword matching to find relevant timestamps
                message_keywords = message.lower().split()
                for ts in timestamps:
                    ts_text_lower = ts["text"].lower()
                    if any(keyword in ts_text_lower for keyword in message_keywords):
                        relevant_timestamps.append(ts)
            
            return {
                "response": ai_response,
                "timestamp_data": relevant_timestamps if relevant_timestamps else None
            }
        except Exception as e:
            raise Exception(f"Failed to chat with document: {str(e)}")
    
    def create_embeddings(self, text: str) -> np.ndarray:
        """Create embeddings for semantic search"""
        return self.sentence_model.encode(text)
