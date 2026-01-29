import pytest
import os
import tempfile
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.models.user import User
from app.models.file import File

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user(test_db):
    # Create a test user and get token
    client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword123"
        }
    )
    
    login_response = client.post(
        "/api/auth/login",
        params={
            "email": "test@example.com",
            "password": "testpassword123"
        }
    )
    return login_response.json()["access_token"]


@pytest.fixture
def test_file():
    # Create a temporary test file
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tmp:
        tmp.write(b"This is a test file content for testing purposes.")
        tmp_path = tmp.name
    
    yield tmp_path
    os.unlink(tmp_path)


def test_upload_file(test_db, test_user, test_file):
    with open(test_file, "rb") as f:
        response = client.post(
            "/api/upload",
            files={"file": ("test.txt", f, "text/plain")},
            headers={"Authorization": f"Bearer {test_user}"}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["original_filename"] == "test.txt"
    assert data["file_type"] == "other"
    assert "id" in data


def test_upload_unauthorized(test_db, test_file):
    with open(test_file, "rb") as f:
        response = client.post(
            "/api/upload",
            files={"file": ("test.txt", f, "text/plain")}
        )
    
    assert response.status_code == 401


def test_get_files(test_db, test_user):
    response = client.get(
        "/api/files",
        headers={"Authorization": f"Bearer {test_user}"}
    )
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_files_unauthorized(test_db):
    response = client.get("/api/files")
    assert response.status_code == 401


def test_delete_file(test_db, test_user, test_file):
    # First upload a file
    with open(test_file, "rb") as f:
        upload_response = client.post(
            "/api/upload",
            files={"file": ("test.txt", f, "text/plain")},
            headers={"Authorization": f"Bearer {test_user}"}
        )
    
    file_id = upload_response.json()["id"]
    
    # Then delete it
    response = client.delete(
        f"/api/files/{file_id}",
        headers={"Authorization": f"Bearer {test_user}"}
    )
    
    assert response.status_code == 200
    assert "message" in response.json()


def test_chat_without_file(test_db, test_user):
    response = client.post(
        "/api/chat",
        json={
            "message": "Hello, how are you?",
            "file_id": None
        },
        headers={"Authorization": f"Bearer {test_user}"}
    )
    
    # Should return 400 since no documents are available
    assert response.status_code == 400


def test_chat_unauthorized(test_db):
    response = client.post(
        "/api/chat",
        json={
            "message": "Hello",
            "file_id": None
        }
    )
    
    assert response.status_code == 401
