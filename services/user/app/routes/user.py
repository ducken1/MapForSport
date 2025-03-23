from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.core.auth import hash_password, verify_password, create_jwt
from pydantic import BaseModel
import os
from app.core.logger import logger

router = APIRouter()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

@router.get("/register", response_class=HTMLResponse)
def serve_register_page():
    frontend_directory = os.path.join(os.path.dirname(__file__), "..", "frontend")
    with open(os.path.join(frontend_directory, "register.html")) as f:
        return HTMLResponse(content=f.read(), status_code=200)

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        logger.warning(f"Failed register attempt for {user.email}")
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = User(
        email=user.email,
        password_hash=hash_password(user.password),
        full_name=user.full_name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    logger.info(f"User {user.email} registered successfully")
    return {"message": "User created successfully"}

@router.get("/login", response_class=HTMLResponse)
def serve_login_page():
    frontend_directory = os.path.join(os.path.dirname(__file__), "..", "frontend")
    with open(os.path.join(frontend_directory, "login.html")) as f:
        return HTMLResponse(content=f.read(), status_code=200)

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        logger.warning(f"Failed login attempt for {user.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    logger.info(f"User {user.email} logged in successfully")
    token = create_jwt({"sub": db_user.email})
    return {"message": "Login successful", "token": token}