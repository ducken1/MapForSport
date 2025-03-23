from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import DATABASE_URL
from app.core.logger import logger

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    """Creates tables based on the models."""
    from app.models.user import Base
    Base.metadata.create_all(bind=engine)


def init_db():
    """Creates tables based on the models."""
    try:
        logger.info("Initializing the database and creating tables...")
        
        logger.debug(f"Connecting to database with URL: {DATABASE_URL}")

        from app.models.user import Base, User  
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        logger.info("Database tables created successfully.")
    
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")