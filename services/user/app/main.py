import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routes import user
from app.core.database import init_db
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


app.include_router(user.router, prefix="/users", tags=["users"])

# Correctly point to the 'frontend' directory relative to the current script's location
frontend_directory = os.path.join(os.path.dirname(__file__), "frontend")

# Make sure that the frontend folder exists
if not os.path.exists(frontend_directory):
    raise RuntimeError(f"Directory '{frontend_directory}' does not exist")

# Serve static files from the 'frontend' directory
app.mount("/static", StaticFiles(directory=frontend_directory), name="static")

# Add route to serve the main HTML file (index.html)
@app.get("/")
def serve_index():
    with open(os.path.join(frontend_directory, "index.html")) as f:
        return f.read()

