from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import routers
from database import engine, Base
import yaml
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "configs", "api_config.yaml")
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    API_CONFIG = yaml.safe_load(f)

# Create all tables (including any new ones like notifications)
Base.metadata.create_all(bind=engine)

app_config = API_CONFIG.get("app", {})
app = FastAPI(title=app_config.get("title", "AI Parent Mentor API"), version=app_config.get("version", "1.0.0"))

cors_config = API_CONFIG.get("cors", {})
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_config.get("allow_origins", ["http://localhost:3000", "http://127.0.0.1:3000"]),
    allow_credentials=cors_config.get("allow_credentials", True),
    allow_methods=cors_config.get("allow_methods", ["*"]),
    allow_headers=cors_config.get("allow_headers", ["*"]),
)

app.include_router(routers.router, prefix="/api")

os.makedirs("uploads", exist_ok=True)
from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Parent Mentor API"}
