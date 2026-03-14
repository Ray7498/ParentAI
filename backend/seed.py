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
    
    # Check if we already have a robust database
    if db.query(User).count() > 5:
        print("Database already seeded with multiple users")
        
        # --- Pronote Features Dummy Data ---
        print("Seeding Pronote Features data...")
        
        # Timetable for Emma (student_id = 1)
        timetable_entries = [
            Timetable(student_id=1, day_of_week=0, start_time="08:00", end_time="10:00", subject="Mathematics", teacher="Mr. Anderson", room="101"),
            Timetable(student_id=1, day_of_week=0, start_time="10:15", end_time="12:15", subject="History", teacher="Ms. Davis", room="204"),
            Timetable(student_id=1, day_of_week=0, start_time="13:00", end_time="15:00", subject="Science", teacher="Dr. Roberts", room="Lab 2"),
            Timetable(student_id=1, day_of_week=1, start_time="09:00", end_time="11:00", subject="English Literature", teacher="Mrs. Smith", room="305"),
            Timetable(student_id=1, day_of_week=1, start_time="11:15", end_time="13:15", subject="Art", teacher="Mr. Thompson", room="Art Studio"),
        ]
        db.add_all(timetable_entries)
        
        # Homework for Emma
        base_date = datetime.now()
        homeworks = [
            Homework(student_id=1, subject="Mathematics", description="Complete exercises 1-15 on page 42.", due_date=base_date + timedelta(days=1), is_completed=0, requires_submission=1),
            Homework(student_id=1, subject="History", description="Read chapter 4 and prepare for tomorrow's discussion.", due_date=base_date + timedelta(days=1), is_completed=1, requires_submission=0),
            Homework(student_id=1, subject="Science", description="Write lab report on the photosynthesis experiment.", due_date=base_date + timedelta(days=3), is_completed=0, requires_submission=1),
            Homework(student_id=1, subject="English Literature", description="Submit draft for the essay on 'To Kill a Mockingbird'.", due_date=base_date + timedelta(days=5), is_completed=0, requires_submission=1),
        ]
        db.add_all(homeworks)

        # Useful Links
        links = [
            Link(title="School Calendar", description="Official school calendar for the current academic year.", url="https://example.com/calendar"),
            Link(title="Canteen Menu", description="Weekly lunch menu and dietary information.", url="https://example.com/menu"),
            Link(title="Library Resources", description="Access the digital library and research databases.", url="https://example.com/library"),
        ]
        db.add_all(links)

        # Surveys and Information
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
