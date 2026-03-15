from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import yaml
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "configs", "database_config.yaml")
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    DB_CONFIG = yaml.safe_load(f).get("database", {})

SQLALCHEMY_DATABASE_URL = DB_CONFIG.get("url", "sqlite:///./sql_app.db")
connect_args = DB_CONFIG.get("connect_args", {"check_same_thread": False})

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
