import sys
import os
from pathlib import Path
from fastapi.testclient import TestClient
sys.path.append(str(Path(__file__).resolve().parents[2]))  # Adjusting the path to root
from app.main import app
from app.core.database import get_test_db, init_test_db, TestSessionLocal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set up in-memory SQLite engine
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DATABASE_URL)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Override the database dependency for testing
app.dependency_overrides[get_test_db] = lambda: TestSessionLocal()

# Initialize test database before running tests
init_test_db()

client = TestClient(app)

def test_register():
    response = client.post("/users/register", json={
        "email": "luka2@example.com",
        "password": "testpass123",
        "full_name": "Test User"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "User created successfully"

def test_login():
    response = client.post("/users/login", json={
        "email": "luka2@example.com",
        "password": "testpass123"
    })
    assert response.status_code == 200
    assert "token" in response.json()
