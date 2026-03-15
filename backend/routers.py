from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
import crud, models, schemas, agent
from database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/chat", response_model=schemas.ChatResponse)
def handle_chat(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    reply = agent.process_chat(request.message, request.parent_id, db)
    return schemas.ChatResponse(reply=reply)

@router.post("/translate-email", response_model=schemas.TranslateResponse)
def translate_email(request: schemas.TranslateRequest):
    mock_reply = "This is a mock simplified translation of the school email. It says: Important announcement regarding the new schedule."
    return schemas.TranslateResponse(translated_summary=mock_reply)

@router.post("/auth/sync", response_model=schemas.AuthSyncResponse)
def auth_sync(req: schemas.AuthSyncRequest, db: Session = Depends(get_db)):
    db_user = crud.sync_user(db, email=req.email, name=req.name)
    return schemas.AuthSyncResponse(user_id=db_user.id)

@router.get("/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.get("/users/search/query", response_model=list[schemas.UserPublic])
def search_users(q: str = Query(..., min_length=1), exclude: int = None, db: Session = Depends(get_db)):
    return crud.search_users(db, query=q, exclude_id=exclude)

@router.get("/students/{student_id}", response_model=schemas.Student)
def read_student(student_id: int, db: Session = Depends(get_db)):
    db_student = crud.get_student(db, student_id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    return db_student

@router.get("/students/{student_id}/grades", response_model=list[schemas.Grade])
def read_student_grades(student_id: int, db: Session = Depends(get_db)):
    return crud.get_student_grades(db, student_id=student_id)

@router.get("/parents/{parent_id}/meetings", response_model=list[schemas.Meeting])
def read_parent_meetings(parent_id: int, db: Session = Depends(get_db)):
    return crud.get_parent_meetings(db, parent_id=parent_id)

@router.get("/parents/{parent_id}/grades", response_model=list[schemas.Grade])
def read_parent_grades(parent_id: int, db: Session = Depends(get_db)):
    students = db.query(models.Student).filter(models.Student.parent_id == parent_id).all()
    if not students: return []
    return crud.get_student_grades(db, student_id=students[0].id)

@router.get("/events", response_model=list[schemas.Event])
def read_events(db: Session = Depends(get_db)):
    return crud.get_events(db)

@router.post("/events", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db)):
    return crud.create_event(db=db, event=event)

@router.get("/community/posts", response_model=list[schemas.Post])
def read_posts(db: Session = Depends(get_db)):
    return crud.get_posts(db)

@router.post("/upload", response_model=schemas.UploadResponse)
def upload_file(file: UploadFile = File(...)):
    import os, uuid, shutil
    os.makedirs("uploads", exist_ok=True)
    ext = file.filename.split('.')[-1] if '.' in file.filename else ''
    filename = f"{uuid.uuid4()}.{ext}" if ext else str(uuid.uuid4())
    filepath = os.path.join("uploads", filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {
        "file_url": f"http://127.0.0.1:8000/uploads/{filename}",
        "file_name": file.filename,
        "file_type": file.content_type or ""
    }

@router.post("/community/posts", response_model=schemas.Post)
def create_post(post: schemas.PostCreate, db: Session = Depends(get_db)):
    return crud.create_post(db=db, post=post)

@router.post("/community/rewrite", response_model=schemas.RewriteResponse)
def rewrite_community_post(request: schemas.RewriteRequest):
    rewritten_text = agent.rewrite_post(request.text)
    return schemas.RewriteResponse(rewritten_text=rewritten_text)

@router.post("/community/translate", response_model=schemas.TranslationResponse)
def translate_community_post(request: schemas.TranslationRequest):
    translated_text = agent.translate_text(request.text, request.target_language)
    return schemas.TranslationResponse(translated_text=translated_text)

@router.post("/community/batch-translate")
def batch_translate_posts(request: schemas.BatchTranslationRequest):
    results = agent.batch_translate_texts(request.texts, request.target_language)
    return {"translations": results}

@router.get("/community/posts/{post_id}/comments", response_model=list[schemas.Comment])
def read_comments(post_id: int, db: Session = Depends(get_db)):
    return crud.get_post_comments(db, post_id=post_id)

@router.post("/community/posts/{post_id}/comments", response_model=schemas.Comment)
def add_comment(post_id: int, comment: schemas.CommentCreate, db: Session = Depends(get_db)):
    return crud.create_comment(db=db, post_id=post_id, comment=comment)

@router.get("/notifications/{user_id}", response_model=list[schemas.Notification])
def read_user_notifications(user_id: int, db: Session = Depends(get_db)):
    return crud.get_user_notifications(db, user_id=user_id)

@router.post("/notifications/{notification_id}/read", response_model=schemas.Notification)
def mark_notification_as_read(notification_id: int, db: Session = Depends(get_db)):
    notification = crud.mark_notification_read(db, notification_id=notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

@router.post("/emails/send")
def send_email_endpoint(req: schemas.EmailRequest):
    import smtplib
    import os
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    sender = "nazimabc1@gmail.com"
    app_password = os.getenv("GMAIL_APP_PASSWORD")

    if app_password:
        try:
            msg = MIMEMultipart()
            msg["From"] = sender
            msg["To"] = req.teacher_email
            msg["Subject"] = req.subject
            msg.attach(MIMEText(req.message, "plain"))
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
                smtp.login(sender, app_password)
                smtp.sendmail(sender, req.teacher_email, msg.as_string())
            return {"status": "success", "message": f"Email sent to {req.teacher_email}"}
        except Exception as e:
            print(f"SMTP error: {e}")
            return {"status": "simulated", "message": f"Email (simulated) to {req.teacher_email}"}
    else:
        print(f"[MOCK EMAIL] From: {sender} | To: {req.teacher_email} | Subject: {req.subject}\n{req.message}")
        return {"status": "simulated", "message": f"Email simulated to {req.teacher_email} (add GMAIL_APP_PASSWORD to .env for real sending)"}

@router.get("/profile/{user_id}", response_model=schemas.Profile)
def read_profile(user_id: int, db: Session = Depends(get_db)):
    return crud.get_profile(db, user_id=user_id)

@router.put("/profile/{user_id}", response_model=schemas.Profile)
def update_profile(user_id: int, profile: schemas.ProfileUpdate, db: Session = Depends(get_db)):
    return crud.update_profile(db, user_id=user_id, data=profile)

@router.get("/messages/{user_id}/conversations", response_model=list[schemas.DirectMessageConversation])
def get_conversations(user_id: int, db: Session = Depends(get_db)):
    return crud.get_dm_conversations(db, user_id=user_id)

@router.get("/messages/{user_id}/thread/{partner_id}", response_model=list[schemas.DirectMessage])
def get_thread(user_id: int, partner_id: int, db: Session = Depends(get_db)):
    crud.mark_dms_read(db, user_id=user_id, partner_id=partner_id)
    return crud.get_dm_thread(db, user_id=user_id, partner_id=partner_id)

@router.post("/messages/send", response_model=schemas.DirectMessageResponse)
def send_dm(message: schemas.DirectMessageCreate, db: Session = Depends(get_db)):
    return crud.send_dm(db, message)

# --- Pronote Features Endpoints ---

@router.get("/parents/{parent_id}/timetable", response_model=list[schemas.TimetableResponse])
def get_parent_timetable(parent_id: int, db: Session = Depends(get_db)):
    students = crud.get_students_by_parent(db, parent_id)
    if not students:
        return []
    # Assuming the first student for simplicity
    return crud.get_timetable(db, students[0].id)

@router.get("/parents/{parent_id}/homework", response_model=list[schemas.HomeworkResponse])
def get_parent_homework(parent_id: int, db: Session = Depends(get_db)):
    students = crud.get_students_by_parent(db, parent_id)
    if not students:
        return []
    return crud.get_homework(db, students[0].id)

@router.put("/homework/{homework_id}/status", response_model=schemas.HomeworkResponse)
def update_homework_status(homework_id: int, status: dict, db: Session = Depends(get_db)):
    # Expects {"is_completed": 1} or {"is_completed": 0}
    is_completed = status.get("is_completed", 0)
    hw = crud.update_homework_status(db, homework_id, is_completed)
    if not hw:
        raise HTTPException(status_code=404, detail="Homework not found")
    return hw

@router.get("/links", response_model=list[schemas.LinkResponse])
def get_links(db: Session = Depends(get_db)):
    return crud.get_links(db)

@router.get("/surveys", response_model=list[schemas.SurveyResponse])
def get_surveys(db: Session = Depends(get_db)):
    return crud.get_surveys(db)
@router.delete("/meetings/{meeting_id}")
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    success = crud.delete_meeting(db, meeting_id)
    if not success:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {"status": "success"}
