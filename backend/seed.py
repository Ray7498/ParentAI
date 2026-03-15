import asyncio
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
from models import User, Student, Grade, Meeting, Event, Notification, Post, Profile, Comment, DirectMessage, Timetable, Homework, Link, Survey, School
import models
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

models.Base.metadata.create_all(bind=engine)

def seed_db():
    db = SessionLocal()
    
    # Check if schools already exist, if so skip seeding to avoid duplicates
    if db.query(School).count() > 0:
        print("Database already seeded with Schools!")
        db.close()
        return

    print("Seeding Schools...")
    schools = [
        School(name="Goethe-Gymnasium", city="Berlin", description="A historic gymnasium in Berlin with a focus on classical education."),
        School(name="Albert-Einstein-Schule", city="Munich", description="A modern school in Munich emphasizing STEM subjects."),
        School(name="Schiller-Gymnasium", city="Hamburg", description="A vibrant school in Hamburg with strong arts and humanities programs.")
    ]
    db.add_all(schools)
    db.commit()
    for s in schools:
        db.refresh(s)

    print("Seeding Teachers and Admin Staff...")
    teacher_data = {
        "Goethe-Gymnasium": [
            ("Mr. Klaus Schmidt", "administration"), # Principal
            ("Mrs. Heidi Müller", "administration"), # Secretary
            ("Ms. Anna Fischer", "teacher"), # Counselor/Teacher
            ("Mr. Thomas Bauer", "teacher"),
            ("Mrs. Sabine Richter", "teacher")
        ],
        "Albert-Einstein-Schule": [
            ("Dr. Hans Becker", "administration"), # Principal
            ("Mr. Jonas Weber", "administration"), # Vice Principal
            ("Mrs. Clara Hoffmann", "administration"), # Secretary
            ("Mr. Lukas Wagner", "teacher"),
            ("Dr. Angela Stein", "teacher")
        ],
        "Schiller-Gymnasium": [
            ("Mrs. Sabine Wagner", "administration"), # Principal
            ("Mr. Lukas Meyer", "administration"), # Vice Principal
            ("Mrs. Julia Koch", "administration"), # Secretary
            ("Mr. Felix Schulz", "teacher"),
            ("Mrs. Laura Neumann", "teacher")
        ]
    }
    
    db_teachers = []
    teachers_by_school = {}
    
    for school in schools:
        teachers_by_school[school.id] = []
        for name, role in teacher_data[school.name]:
            email = f"{name.split(' ')[-1].lower()}@{school.name.lower().replace('-', '')}.edu"
            u = User(name=name, email=email, role=role, school_id=school.id)
            db.add(u)
            db_teachers.append(u)
            if role == "teacher":
                teachers_by_school[school.id].append(u)
    
    db.commit()
    for t in db_teachers:
        db.refresh(t)

    # --- Ensure Primary User has Data ---
    print("Seeding Primary User...")
    primary_email = "rayyanahmed292001@gmail.com"
    user = db.query(User).filter(User.email == primary_email).first()
    
    goethe_school = db.query(School).filter(School.name == "Goethe-Gymnasium").first()
    
    if not user:
        user = User(name="Rayy", email=primary_email, role="parent", school_id=goethe_school.id)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.school_id = goethe_school.id
        db.commit()

    student = db.query(Student).filter(Student.parent_id == user.id).first()
    if not student:
        student = Student(name="Ayra", grade_level="4th Grade", parent_id=user.id, school_id=goethe_school.id)
        db.add(student)
        db.commit()
        db.refresh(student)

    # Clear existing timetable/homework for this student to avoid partial data
    db.query(Timetable).filter(Timetable.student_id == student.id).delete()
    db.query(Homework).filter(Homework.student_id == student.id).delete()

    tt = [
        Timetable(student_id=student.id, day_of_week=0, start_time="08:00", end_time="09:30", subject="Mathematics", teacher="Mr. Thomas Bauer", room="101"),
        Timetable(student_id=student.id, day_of_week=0, start_time="09:45", end_time="11:15", subject="Science", teacher="Mrs. Sabine Richter", room="Lab 2"),
        Timetable(student_id=student.id, day_of_week=0, start_time="11:30", end_time="13:00", subject="History", teacher="Ms. Anna Fischer", room="204"),
        Timetable(student_id=student.id, day_of_week=1, start_time="08:30", end_time="10:00", subject="English", teacher="Mr. Thomas Bauer", room="305"),
        Timetable(student_id=student.id, day_of_week=1, start_time="10:15", end_time="11:45", subject="Art", teacher="Mrs. Sabine Richter", room="Art Studio"),
        Timetable(student_id=student.id, day_of_week=2, start_time="09:00", end_time="10:30", subject="Physical Education", teacher="Ms. Anna Fischer", room="Gym"),
        Timetable(student_id=student.id, day_of_week=2, start_time="10:45", end_time="12:15", subject="Computer Science", teacher="Mr. Thomas Bauer", room="Comp Lab 1"),
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

    # Ensure some meetings exist for this user with real teachers
    existing_meetings = db.query(Meeting).filter(Meeting.parent_id == user.id).count()
    if existing_meetings < 3:
        ms = [
            Meeting(parent_id=user.id, teacher_id=teachers_by_school[goethe_school.id][0].id, teacher_name=teachers_by_school[goethe_school.id][0].name, date=base + timedelta(days=1, hours=10-base.hour), status="scheduled"),
            Meeting(parent_id=user.id, teacher_id=teachers_by_school[goethe_school.id][1].id, teacher_name=teachers_by_school[goethe_school.id][1].name, date=base + timedelta(days=3, hours=14-base.hour), status="scheduled"),
        ]
        db.add_all(ms)

    # --- Pronote Features Dummy Data ---
    print("Seeding Pronote Features data...")
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

    print("Seeding Parents & General Students...")
    subjects = ["Math", "Science", "English", "History", "Physical Education", "Art", "Computer Science"]
    grades_possible = ["1", "2", "3", "4", "5", "6"]
    
    events_data = [
        ("Parent-Teacher Conferences", "Quarterly conferences in the main hall.", "Main Hall"),
        ("Science Fair", "Annual school science fair. Parents welcome.", "Gymnasium"),
        ("Spring Concert", "The band will be performing their spring repertoire.", "Auditorium"),
        ("Book Fair", "Scholastic book fair will be open all week.", "Library"),
        ("PTA Meeting", "Monthly PTA meeting to discuss upcoming fundraisers.", "Cafeteria"),
        ("Field Day", "Annual games and sports day for all grades.", "Football Field")
    ]

    # Create 15 Parents with random schools
    parents = []
    for i in range(15):
        random_school = random.choice(schools)
        parent = models.User(name=f"Parent {i}", email=f"parent{i}@example.com", role="parent", school_id=random_school.id)
        db.add(parent)
        parents.append(parent)
    db.commit()
    for p in parents:
        db.refresh(p)

    # Create 20 Students linked to the parents and schools
    students = []
    for i in range(20):
        parent = random.choice(parents)
        student = models.Student(
            name=f"Student {i}",
            grade_level=f"{random.randint(5, 12)}th Grade",
            parent_id=parent.id,
            school_id=parent.school_id
        )
        db.add(student)
        students.append(student)
    db.commit()
    for st in students:
        db.refresh(st)

    # Generate random Grades
    for _ in range(60):
        student = random.choice(students)
        grade = models.Grade(
            subject=random.choice(subjects),
            score=random.choice(grades_possible),
            comments="Good effort overall." if random.random() > 0.5 else "Needs some improvement.",
            student_id=student.id
        )
        db.add(grade)

    # Generate random Meetings
    for _ in range(30):
        parent = random.choice(parents)
        teacher = random.choice(teachers_by_school[parent.school_id])
        date_offset = random.randint(-15, 15)
        
        meeting_time = datetime.utcnow() + timedelta(days=date_offset)
        meeting_time = meeting_time.replace(hour=random.randint(13, 16), minute=0, second=0, microsecond=0)
        
        meeting = models.Meeting(
            parent_id=parent.id,
            teacher_id=teacher.id,
            teacher_name=teacher.name,
            date=meeting_time,
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

    # Generate 15 Community Posts (Globally visible)
    example_images = [
        None, None, None,
        "/community/kids_crafts.png",
        "/community/school_bake_sale.png",
        "/community/playground_fun.png"
    ]
    for _ in range(15):
        author = random.choice(parents)
        post = models.Post(
            title=f"Question about {random.choice(['homework', 'field trip', 'school lunch', 'extracurriculars'])}",
            content="Does anyone have more info on this? I am trying to figure out the schedule.",
            image_url=random.choice(example_images),
            author_id=author.id
        )
        db.add(post)

    db.commit()
    db.close()
    print("Large dummy database with German schools seeded successfully!")

if __name__ == "__main__":
    seed_db()
