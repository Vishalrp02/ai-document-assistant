from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # OpenAI Configuration
    openai_api_key: str
    
    # Database Configuration
    database_url: str = "sqlite:///./ai_assistant.db"
    
    # JWT Configuration
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration: int = 3600  # 1 hour
    
    # File Upload Configuration
    upload_dir: str = "./uploads"
    max_file_size: int = 100 * 1024 * 1024  # 100MB
    allowed_extensions: list = [".pdf", ".mp3", ".mp4", ".wav", ".m4a", ".mov"]
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379"
    
    # Rate Limiting
    rate_limit_per_minute: int = 60
    
    class Config:
        env_file = ".env"


settings = Settings()
