import sys
import os
from pathlib import Path

# Add the root project directory to the system path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.main import app
from fastapi.testclient import TestClient

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
