from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timedelta
import models, schemas

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def sync_user(db: Session, email: str, name: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        return user
    
    # Create new user
    new_user = models.User(name=name, email=email, role="parent")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Auto-generate dummy data for this new user
    child_name = f"{name.split(' ')[0]}'s Child" if name else "Student"
    student = models.Student(name=child_name, grade_level="5th Grade", school_name="Lincoln Elementary", parent_id=new_user.id)
    db.add(student)
    db.commit()
    db.refresh(student)
    
    grades = [
        models.Grade(subject="Math", score="A-", comments="Doing great in fractions.", student_id=student.id),
        models.Grade(subject="Science", score="B+", comments="Good participation in lab.", student_id=student.id),
        models.Grade(subject="English", score="B", comments="Needs to read more at home.", student_id=student.id)
    ]
    db.add_all(grades)
    
    meetings = [
        models.Meeting(parent_id=new_user.id, teacher_name="Mr. Smith", date=datetime.utcnow() + timedelta(days=2), status="scheduled"),
        models.Meeting(parent_id=new_user.id, teacher_name="Mrs. Johnson", date=datetime.utcnow() - timedelta(days=10), status="completed")
    ]
    db.add_all(meetings)
    
    notifications = [
        models.Notification(user_id=new_user.id, message="New grade posted for Math: A-"),
        models.Notification(user_id=new_user.id, message="Meeting scheduled with Mr. Smith")
    ]
    db.add_all(notifications)
    
    # Auto-create empty profile
    profile = models.Profile(user_id=new_user.id, profession="Parent", age=None, bio=None)
    db.add(profile)
    
    db.commit()
    return new_user

def get_student(db: Session, student_id: int):
    return db.query(models.Student).filter(models.Student.id == student_id).first()

def get_student_grades(db: Session, student_id: int):
    return db.query(models.Grade).filter(models.Grade.student_id == student_id).all()

def get_parent_meetings(db: Session, parent_id: int):
    return db.query(models.Meeting).filter(models.Meeting.parent_id == parent_id).all()

def get_events(db: Session):
    return db.query(models.Event).all()

def get_posts(db: Session):
    return db.query(models.Post).order_by(models.Post.created_at.desc()).all()

def create_post(db: Session, post: schemas.PostCreate):
    db_post = models.Post(**post.model_dump())
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def get_user_notifications(db: Session, user_id: int):
    return db.query(models.Notification).filter(models.Notification.user_id == user_id, models.Notification.is_read == 0).all()

def mark_notification_read(db: Session, notification_id: int):
    notification = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if notification:
        notification.is_read = 1
        db.commit()
        db.refresh(notification)
    return notification

# --- Profile ---
def get_profile(db: Session, user_id: int):
    profile = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    if not profile:
        profile = models.Profile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

def update_profile(db: Session, user_id: int, data: schemas.ProfileUpdate):
    profile = get_profile(db, user_id)
    if data.profession is not None:
        profile.profession = data.profession
    if data.age is not None:
        profile.age = data.age
    if data.bio is not None:
        profile.bio = data.bio
    db.commit()
    db.refresh(profile)
    return profile

# --- User Search ---
def search_users(db: Session, query: str, exclude_id: int = None):
    q = db.query(models.User).filter(
        or_(
            models.User.name.ilike(f"%{query}%"),
            models.User.email.ilike(f"%{query}%")
        )
    )
    if exclude_id:
        q = q.filter(models.User.id != exclude_id)
    return q.limit(10).all()

# --- Comments ---
def get_post_comments(db: Session, post_id: int):
    return db.query(models.Comment).filter(models.Comment.post_id == post_id).order_by(models.Comment.created_at).all()

def create_comment(db: Session, post_id: int, comment: schemas.CommentCreate):
    db_comment = models.Comment(
        content=comment.content,
        post_id=post_id,
        author_id=comment.author_id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

# --- Direct Messages ---
def get_dm_conversations(db: Session, user_id: int):
    """Get list of unique conversation partners with their latest message."""
    messages = db.query(models.DirectMessage).filter(
        or_(
            models.DirectMessage.sender_id == user_id,
            models.DirectMessage.recipient_id == user_id
        )
    ).order_by(models.DirectMessage.created_at.desc()).all()
    
    # Group by conversation partner
    seen = set()
    conversations = []
    for msg in messages:
        partner_id = msg.recipient_id if msg.sender_id == user_id else msg.sender_id
        if partner_id not in seen:
            seen.add(partner_id)
            conversations.append(msg)
    return conversations

def get_dm_thread(db: Session, user_id: int, partner_id: int):
    """Get all messages between two users."""
    return db.query(models.DirectMessage).filter(
        or_(
            (models.DirectMessage.sender_id == user_id) & (models.DirectMessage.recipient_id == partner_id),
            (models.DirectMessage.sender_id == partner_id) & (models.DirectMessage.recipient_id == user_id)
        )
    ).order_by(models.DirectMessage.created_at).all()

def send_dm(db: Session, dm: schemas.DirectMessageCreate):
    db_msg = models.DirectMessage(
        sender_id=dm.sender_id,
        recipient_id=dm.recipient_id,
        content=dm.content
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg

def mark_dms_read(db: Session, user_id: int, partner_id: int):
    db.query(models.DirectMessage).filter(
        models.DirectMessage.sender_id == partner_id,
        models.DirectMessage.recipient_id == user_id,
        models.DirectMessage.is_read == 0
    ).update({"is_read": 1})
    db.commit()
