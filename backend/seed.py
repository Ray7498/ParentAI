import asyncio
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)

def seed_db():
    db = SessionLocal()
    
    # Check if we already have a robust database
    if db.query(models.User).count() > 5:
        print("Database already seeded with multiple users")
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
