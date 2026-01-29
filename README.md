# AI Document Assistant - Full Stack Web Application

A comprehensive web application that allows users to upload PDF documents, audio, and video files, interact with an AI-powered chatbot, and get intelligent summaries with timestamp extraction.

## Tech Stack

### Backend
- **FastAPI** (Python) - Modern, fast web framework
- **OpenAI API** - LLM chatbot and Whisper transcription
- **PostgreSQL** - Database for metadata and extracted text
- **LangChain** - LLM orchestration and document processing
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation and serialization

### Frontend
- **React** with JavaScript - Modern UI framework
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client for API calls
- **React Player** - Media playback with timestamp control

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **pytest** - Testing framework with coverage reporting

## Features

- **File Upload**: Support for PDF, audio, and video files
- **AI Chatbot**: Ask questions based on uploaded content
- **Content Summarization**: Automatic summarization of uploaded files
- **Timestamp Extraction**: Extract timestamps from audio/video for specific topics
- **Media Playback**: Play relevant portions of audio/video files
- **Real-time Chat**: Streaming responses from the AI
- **Vector Search**: Semantic search on documents (bonus feature)

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── services/
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .github/workflows/
└── README.md
```

## Setup Instructions

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)
- OpenAI API key

### Environment Variables
Create a `.env` file in the root directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/ai_assistant

# JWT Configuration
JWT_SECRET_KEY=your_jwt_secret_key_here

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100MB
```

### Running the Application

#### Using Docker Compose (Recommended)
```bash
# Clone the repository
git clone <repository-url>
cd ai-document-assistant

# Start all services
docker-compose up -d

# The application will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

#### Local Development
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (in another terminal)
cd frontend
npm install
npm start
```

## API Documentation

### Endpoints

#### File Management
- `POST /api/upload` - Upload files (PDF, audio, video)
- `GET /api/files` - List uploaded files
- `GET /api/files/{file_id}` - Get file details
- `DELETE /api/files/{file_id}` - Delete file

#### Chat & AI
- `POST /api/chat` - Send message to AI chatbot
- `GET /api/chat/history` - Get chat history
- `POST /api/summarize/{file_id}` - Generate file summary

#### Media Processing
- `POST /api/transcribe/{file_id}` - Transcribe audio/video
- `GET /api/timestamps/{file_id}` - Get extracted timestamps

### API Examples

#### Upload File
```javascript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

#### Chat with AI
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "What are the key points in this document?",
    file_id: "file-uuid"
  })
});
```

## Testing

### Backend Tests
```bash
cd backend
pytest --cov=app tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Coverage Requirements
- Backend: Minimum 95% test coverage
- Frontend: Component and integration tests

## Deployment

### Docker Deployment
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD Pipeline
The GitHub Actions workflow automatically:
- Runs tests on push/PR
- Builds Docker images
- Deploys to staging/production environments

## Bonus Features Implemented

1. **Vector Search**: Semantic search using sentence-transformers
2. **Real-time Streaming**: Server-Sent Events for chat responses
3. **Multi-user Authentication**: JWT-based authentication
4. **Rate Limiting**: Redis-based rate limiting
5. **Caching**: Redis caching for improved performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.
