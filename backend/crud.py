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
    school = db.query(models.School).first()
    if school:
        new_user.school_id = school.id
        
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Auto-generate dummy data for this new user
    child_name = f"{name.split(' ')[0]}'s Child" if name else "Student"
    student = models.Student(name=child_name, grade_level="5th Grade", parent_id=new_user.id)
    if school:
        student.school_id = school.id
        
    db.add(student)
    db.commit()
    db.refresh(student)
    
    grades = [
        models.Grade(subject="Math", score="A-", comments="Doing great in fractions.", student_id=student.id),
        models.Grade(subject="Science", score="B+", comments="Good participation in lab.", student_id=student.id),
        models.Grade(subject="English", score="B", comments="Needs to read more at home.", student_id=student.id)
    ]
    db.add_all(grades)
    
    teachers = db.query(models.User).filter(models.User.role == "teacher").limit(2).all()
    teacher1_id = teachers[0].id if teachers else None
    teacher1_name = teachers[0].name if teachers else "Mr. Smith"
    teacher2_id = teachers[1].id if len(teachers) > 1 else None
    teacher2_name = teachers[1].name if len(teachers) > 1 else "Mrs. Johnson"

    meetings = [
        models.Meeting(parent_id=new_user.id, teacher_id=teacher1_id, teacher_name=teacher1_name, date=datetime.utcnow() + timedelta(days=2), status="scheduled"),
        models.Meeting(parent_id=new_user.id, teacher_id=teacher2_id, teacher_name=teacher2_name, date=datetime.utcnow() - timedelta(days=10), status="completed")
    ]
    db.add_all(meetings)
    
    notifications = [
        models.Notification(user_id=new_user.id, message="New grade posted for Math: A-"),
        models.Notification(user_id=new_user.id, message="Meeting scheduled with Mr. Smith")
    ]
    db.add_all(notifications)
    
    # Seeding Timetable
    timetable_data = [
        {"day_of_week": 0, "start_time": "08:30", "end_time": "09:30", "subject": "Mathematics", "teacher": "Mr. Anderson", "room": "Room 101"},
        {"day_of_week": 0, "start_time": "09:45", "end_time": "10:45", "subject": "Science", "teacher": "Dr. Roberts", "room": "Lab 2"},
        {"day_of_week": 0, "start_time": "11:00", "end_time": "12:00", "subject": "History", "teacher": "Ms. Davis", "room": "Room 205"},
    ]
    for tt in timetable_data:
        db.add(models.Timetable(student_id=student.id, **tt))

    # Seeding Homework
    homework_data = [
        {"subject": "Mathematics", "description": "Algebra worksheet - Equations 1 to 20", "due_date": datetime.utcnow() + timedelta(days=2)},
        {"subject": "English", "description": "Read Chapter 4 of 'The Giver' and write a summary.", "due_date": datetime.utcnow() + timedelta(days=3)},
    ]
    for hw in homework_data:
        db.add(models.Homework(student_id=student.id, **hw))
    
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

def create_event(db: Session, event: schemas.EventCreate):
    db_event = models.Event(**event.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

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
    if data.preferred_language is not None:
        profile.preferred_language = data.preferred_language
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
    """Get list of unique conversation partners with their latest message and unread count."""
    messages = db.query(models.DirectMessage).filter(
        or_(
            models.DirectMessage.sender_id == user_id,
            models.DirectMessage.recipient_id == user_id
        )
    ).order_by(models.DirectMessage.created_at.desc()).all()
    
    seen = set()
    conversations = []
    for msg in messages:
        partner_id = msg.recipient_id if msg.sender_id == user_id else msg.sender_id
        if partner_id not in seen:
            seen.add(partner_id)
            
            # Fetch partner user object
            partner = db.query(models.User).filter(models.User.id == partner_id).first()
            
            # Count unread messages from this partner
            unread_count = db.query(models.DirectMessage).filter(
                models.DirectMessage.sender_id == partner_id,
                models.DirectMessage.recipient_id == user_id,
                models.DirectMessage.is_read == 0
            ).count()
            
            conversations.append({
                "partner": partner,
                "last_message": msg,
                "unread_count": unread_count
            })
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
def delete_meeting(db: Session, meeting_id: int):
    db_meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if db_meeting:
        db.delete(db_meeting)
        db.commit()
        return True
    return False

# --- Pronote CRUD ---

def get_students_by_parent(db: Session, parent_id: int):
    return db.query(models.Student).filter(models.Student.parent_id == parent_id).all()

def get_timetable(db: Session, student_id: int):
    return db.query(models.Timetable).filter(models.Timetable.student_id == student_id).order_by(models.Timetable.day_of_week, models.Timetable.start_time).all()

def get_homework(db: Session, student_id: int):
    return db.query(models.Homework).filter(models.Homework.student_id == student_id).order_by(models.Homework.due_date).all()

def update_homework_status(db: Session, homework_id: int, is_completed: int):
    hw = db.query(models.Homework).filter(models.Homework.id == homework_id).first()
    if hw:
        hw.is_completed = is_completed
        db.commit()
        db.refresh(hw)
    return hw

def get_links(db: Session):
    return db.query(models.Link).all()

def get_surveys(db: Session):
    return db.query(models.Survey).order_by(models.Survey.created_at.desc()).all()

# --- Schools and Schedules ---

def get_school_by_id(db: Session, school_id: int):
    return db.query(models.School).filter(models.School.id == school_id).first()

def get_teachers_by_school(db: Session, school_id: int):
    return db.query(models.User).filter(
        models.User.school_id == school_id,
        models.User.role.in_(["teacher", "administration"])
    ).all()

def check_teacher_availability(db: Session, teacher_id: int, date: datetime):
    start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    
    meetings = db.query(models.Meeting).filter(
        models.Meeting.teacher_id == teacher_id,
        models.Meeting.date >= start_of_day,
        models.Meeting.date < end_of_day,
        models.Meeting.status == "scheduled"
    ).all()
    
    # Basic logic: Return booked slots for the day
    return meetings
