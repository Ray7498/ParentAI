from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import routers
import agent
import models
from database import engine, Base

# Create all tables (including any new ones like notifications)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Parent Mentor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dummy project
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routers.router, prefix="/api")

class ChatRequest(BaseModel):
    message: str
    parent_id: int

class ChatResponse(BaseModel):
    reply: str

@app.post("/api/chat", response_model=ChatResponse)
def handle_chat(request: ChatRequest):
    reply = agent.process_chat(request.message, request.parent_id)
    return ChatResponse(reply=reply)

class TranslateRequest(BaseModel):
    email_text: str

class TranslateResponse(BaseModel):
    translated_summary: str

@app.post("/api/translate-email", response_model=TranslateResponse)
def translate_email(request: TranslateRequest):
    # Dummy implementation since full LLM pipeline isn't guaranteed to have keys
    mock_reply = "This is a mock simplified translation of the school email. It says: Important announcement regarding the new schedule."
    return TranslateResponse(translated_summary=mock_reply)

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Parent Mentor API"}
