import os
from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from app.routes import user
from app.core.database import init_db, get_db
from app.core.logger import logger

app = FastAPI()

@app.on_event("startup")
def on_startup():
    try:
        # Initialize DB (create tables)
        init_db()
        logger.info("Database tables created successfully.")
    except Exception as e:
        logger.error(f"Error creating tables: {str(e)}")

# Use production database in normal operation
app.include_router(user.router, prefix="/users", tags=["users"])

# Serve static files from the frontend directory
frontend_directory = os.path.join(os.path.dirname(__file__), "frontend")

if not os.path.exists(frontend_directory):
    raise RuntimeError(f"Directory '{frontend_directory}' does not exist")

app.mount("/static", StaticFiles(directory=frontend_directory), name="static")

@app.get("/")
def serve_index():
    with open(os.path.join(frontend_directory, "index.html")) as f:
        return f.read()
