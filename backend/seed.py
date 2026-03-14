import asyncio
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
from models import User, Student, Grade, Meeting, Event, Notification, Post, Profile, Comment, DirectMessage, Timetable, Homework, Link, Survey
import models
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

models.Base.metadata.create_all(bind=engine)

def seed_db():
    db = SessionLocal()
    
    # --- Ensure Primary User has Data ---
    primary_email = "rayyanahmed292001@gmail.com"
    user = db.query(User).filter(User.email == primary_email).first()
    if not user:
        user = User(name="Rayy", email=primary_email, role="parent")
        db.add(user)
        db.commit()
        db.refresh(user)

    student = db.query(Student).filter(Student.parent_id == user.id).first()
    if not student:
        student = Student(name="Ayra", grade_level="4th Grade", school_name="Lincoln Elementary", parent_id=user.id)
        db.add(student)
        db.commit()
        db.refresh(student)

    # Clear existing timetable/homework for this student to avoid partial data
    db.query(Timetable).filter(Timetable.student_id == student.id).delete()
    db.query(Homework).filter(Homework.student_id == student.id).delete()

    tt = [
        Timetable(student_id=student.id, day_of_week=0, start_time="08:00", end_time="09:30", subject="Mathematics", teacher="Mr. Anderson", room="101"),
        Timetable(student_id=student.id, day_of_week=0, start_time="09:45", end_time="11:15", subject="Science", teacher="Dr. Roberts", room="Lab 2"),
        Timetable(student_id=student.id, day_of_week=0, start_time="11:30", end_time="13:00", subject="History", teacher="Ms. Davis", room="204"),
        Timetable(student_id=student.id, day_of_week=1, start_time="08:30", end_time="10:00", subject="English", teacher="Mrs. Smith", room="305"),
        Timetable(student_id=student.id, day_of_week=1, start_time="10:15", end_time="11:45", subject="Art", teacher="Mr. Thompson", room="Art Studio"),
        Timetable(student_id=student.id, day_of_week=2, start_time="09:00", end_time="10:30", subject="Physical Education", teacher="Coach Miller", room="Gym"),
        Timetable(student_id=student.id, day_of_week=2, start_time="10:45", end_time="12:15", subject="Computer Science", teacher="Mr. Wilson", room="Comp Lab 1"),
    ]
    db.add_all(tt)

    base = datetime.now()
    hw = [
        Homework(student_id=student.id, subject="Mathematics", description="Algebra worksheet - Equations 1 to 20.", due_date=base + timedelta(days=1), is_completed=0, requires_submission=1),
        Homework(student_id=student.id, subject="Science", description="Draw a diagram of the human heart and label it.", due_date=base + timedelta(days=2), is_completed=0, requires_submission=0),
        Homework(student_id=student.id, subject="English", description="Read 'Chapter 5' and write a 200-word summary.", due_date=base + timedelta(days=3), is_completed=1, requires_submission=1),
        Homework(student_id=student.id, subject="Computer Science", description="Basic Python script to print Fibonacci sequence.", due_date=base + timedelta(days=5), is_completed=0, requires_submission=1),
    ]
    db.add_all(hw)

    # Ensure some meetings exist for this user
    existing_meetings = db.query(Meeting).filter(Meeting.parent_id == user.id).count()
    if existing_meetings < 3:
        ms = [
            Meeting(parent_id=user.id, teacher_name="Mr. Anderson", date=base + timedelta(days=2, hours=4), status="scheduled"),
            Meeting(parent_id=user.id, teacher_name="Mrs. Smith", date=base + timedelta(days=4, hours=-2), status="scheduled"),
            Meeting(parent_id=user.id, teacher_name="Dr. Roberts", date=base + timedelta(days=7, hours=1), status="scheduled"),
        ]
        db.add_all(ms)

    # --- Pronote Features Dummy Data ---
    print("Seeding Pronote Features data...")
    
    # Check if links already exist
    if db.query(Link).count() == 0:
        links = [
            Link(title="School Calendar", description="Official school calendar for the current academic year.", url="https://example.com/calendar"),
            Link(title="Canteen Menu", description="Weekly lunch menu and dietary information.", url="https://example.com/menu"),
            Link(title="Library Resources", description="Access the digital library and research databases.", url="https://example.com/library"),
        ]
        db.add_all(links)

    if db.query(Survey).count() == 0:
        surveys = [
            Survey(title="End of Year Trip Preference", description="Please vote for the destination of the 5th-grade class trip."),
            Survey(title="New Extracurricular Activities", description="Let us know which new clubs you would like to see next semester."),
        ]
        db.add_all(surveys)

    db.commit()
    print("Database seeding completed.")
    return

    first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
    subjects = ["Math", "Science", "English", "History", "Physical Education", "Art", "Computer Science"]
    grades_possible = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"]
    teachers = ["Mr. Smith", "Mrs. Johnson", "Ms. Davis", "Mr. Wilson", "Mrs. Moore", "Mr. Taylor", "Ms. Anderson", "Mr. Thomas"]
    events_data = [
        ("Parent-Teacher Conferences", "Quarterly conferences in the main hall.", "Main Hall"),
        ("Science Fair", "Annual school science fair. Parents welcome.", "Gymnasium"),
        ("Spring Concert", "The middle school band will be performing their spring repertoire.", "Auditorium"),
        ("Book Fair", "Scholastic book fair will be open all week.", "Library"),
        ("PTA Meeting", "Monthly PTA meeting to discuss upcoming fundraisers.", "Cafeteria"),
        ("Field Day", "Annual games and sports day for all grades.", "Football Field")
    ]

    # Create 10 Parents
    parents = []
    for i in range(10):
        parent = models.User(name=f"{random.choice(first_names)} {random.choice(last_names)}", email=f"parent{i}@example.com", role="parent")
        db.add(parent)
        parents.append(parent)
    db.commit()

    # Create 15 Students linked to the parents
    students = []
    for i in range(15):
        parent = random.choice(parents)
        student = models.Student(
            name=f"{random.choice(first_names)} {parent.name.split(' ')[1]}",
            grade_level=f"{random.randint(1, 12)}th Grade",
            school_name="Lincoln Schools",
            parent_id=parent.id
        )
        db.add(student)
        students.append(student)
    db.commit()

    # Generate 50 random Grades
    for _ in range(50):
        student = random.choice(students)
        grade = models.Grade(
            subject=random.choice(subjects),
            score=random.choice(grades_possible),
            comments="Good effort overall." if random.random() > 0.5 else "Needs some improvement.",
            student_id=student.id
        )
        db.add(grade)

    # Generate 20 Meetings
    for _ in range(20):
        parent = random.choice(parents)
        date_offset = random.randint(-15, 15)
        meeting = models.Meeting(
            parent_id=parent.id,
            teacher_name=random.choice(teachers),
            date=datetime.utcnow() + timedelta(days=date_offset),
            status="scheduled" if date_offset > 0 else "completed"
        )
        db.add(meeting)

    # Generate Events
    for e in events_data:
        event = models.Event(
            title=e[0],
            description=e[1],
            location=e[2],
            date=datetime.utcnow() + timedelta(days=random.randint(2, 30))
        )
        db.add(event)

    # Generate 10 Community Posts
    for _ in range(10):
        author = random.choice(parents)
        post = models.Post(
            title=f"Question about {random.choice(['homework', 'field trip', 'school lunch', 'extracurriculars'])}",
            content="Does anyone have more info on this? I am trying to figure out the schedule.",
            author_id=author.id
        )
        db.add(post)

    db.commit()
    db.close()
    print("Large dummy database seeded successfully!")

if __name__ == "__main__":
    seed_db()
