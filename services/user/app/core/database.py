from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import DATABASE_URL
from app.core.logger import logger

# Main Database Engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# SQLite In-Memory Database for Testing
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DATABASE_URL)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

Base = declarative_base()

def get_db():
    """Dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_test_db():
    """Dependency for test database session."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize the database and create tables."""
    try:
        logger.info("Initializing the database and creating tables...")
        from app.models.user import Base  
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")

def init_test_db():
    """Initialize the test database and create tables."""
    try:
        logger.info("Initializing the test database and creating tables...")
        from app.models.user import Base  
        Base.metadata.create_all(bind=test_engine)
        logger.info("Test database tables created successfully.")
    except Exception as e:
        logger.error(f"Error during test database initialization: {e}")
