from datetime import datetime, timedelta
import random
from database import engine, Base, SessionLocal
from models import (
    User, Student, Grade, Meeting, Event, Notification,
    Post, Profile, Comment, DirectMessage, Timetable,
    Homework, Link, Survey, School
)
import models

models.Base.metadata.create_all(bind=engine)


def seed_db():

    db = SessionLocal()

    if db.query(School).count() > 0:
        print("Database already seeded!")
        return

    print("Seeding demo database...")

    # --------------------------------------------------
    # SCHOOLS
    # --------------------------------------------------

    schools = [

        School(
            name="Robert-Mayer-Gymnasium",
            city="Heilbronn",
            description="Science focused Gymnasium."
        ),

        School(
            name="Justinus-Kerner-Gymnasium",
            city="Heilbronn",
            description="Large language-focused Gymnasium."
        ),

        School(
            name="Elly-Heuss-Knapp-Gymnasium",
            city="Heilbronn",
            description="Arts and humanities Gymnasium."
        ),

        School(
            name="Dammrealschule",
            city="Heilbronn",
            description="Realschule with technical focus."
        ),

        School(
            name="Albert-Einstein-Gymnasium",
            city="Stuttgart",
            description="Modern STEM focused school."
        ),

        School(
            name="Geschwister-Scholl-Schule",
            city="Berlin",
            description="Comprehensive secondary school."
        )
    ]

    db.add_all(schools)
    db.commit()

    for s in schools:
        db.refresh(s)

    # --------------------------------------------------
    # TEACHERS
    # --------------------------------------------------

    teacher_names = [
        "Dr. Markus Schneider",
        "Claudia Becker",
        "Thomas Bauer",
        "Sabine Richter",
        "Ali Demir",
        "Julia Wagner",
        "Stefan Vogt",
        "Mehmet Kaya",
        "Lisa Braun",
        "Nina Hartmann"
    ]

    teachers_by_school = {s.id: [] for s in schools}

    for name in teacher_names:

        school = random.choice(schools)

        teacher = User(
            name=name,
            email=name.replace(" ", ".").lower() + "@school.de",
            role="teacher",
            school_id=school.id
        )

        db.add(teacher)
        teachers_by_school[school.id].append(teacher)

    db.commit()

    # --------------------------------------------------
    # PRIMARY DEMO USER
    # --------------------------------------------------

    demo_parent = User(
        name="Rayy Ahmed",
        email="rayyanahmed292001@gmail.com",
        role="parent",
        school_id=schools[0].id
    )

    db.add(demo_parent)
    db.commit()
    db.refresh(demo_parent)

    # --------------------------------------------------
    # DEMO STUDENT
    # --------------------------------------------------

    student = Student(
        name="Ayra Ahmed",
        grade_level="4th Grade",
        parent_id=demo_parent.id,
        school_id=schools[0].id
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    # --------------------------------------------------
    # TIMETABLE
    # --------------------------------------------------

    timetable = [

        Timetable(
            student_id=student.id,
            day_of_week=0,
            start_time="08:00",
            end_time="09:30",
            subject="Mathematics",
            teacher="Dr. Markus Schneider",
            room="101"
        ),

        Timetable(
            student_id=student.id,
            day_of_week=1,
            start_time="09:45",
            end_time="11:15",
            subject="Science",
            teacher="Sabine Richter",
            room="Lab 2"
        ),

        Timetable(
            student_id=student.id,
            day_of_week=2,
            start_time="11:30",
            end_time="13:00",
            subject="History",
            teacher="Thomas Bauer",
            room="204"
        )

    ]

    db.add_all(timetable)

    # --------------------------------------------------
    # HOMEWORK
    # --------------------------------------------------

    homework = [

        Homework(
            student_id=student.id,
            subject="Mathematics",
            description="Complete exercises 1–15 on fractions.",
            due_date=datetime.now() + timedelta(days=1),
            is_completed=0,
            requires_submission=1
        ),

        Homework(
            student_id=student.id,
            subject="Science",
            description="Prepare a small presentation about the solar system.",
            due_date=datetime.now() + timedelta(days=3),
            is_completed=0,
            requires_submission=0
        )
    ]

    db.add_all(homework)

    # --------------------------------------------------
    # EVENTS (LOCAL HEILBRONN)
    # --------------------------------------------------

    events = [

        Event(
            title="Experimenta Science Museum Trip",
            description="School trip to the Experimenta science center.",
            location="Experimenta Heilbronn",
            date=datetime.now() + timedelta(days=5)
        ),

        Event(
            title="Heilbronner Falken Hockey Game",
            description="Students attending local hockey match.",
            location="Kolbenschmidt Arena",
            date=datetime.now() + timedelta(days=8)
        ),

        Event(
            title="Theater Heilbronn Play",
            description="Class visit to children's theater play.",
            location="Theater Heilbronn",
            date=datetime.now() + timedelta(days=12)
        ),

        Event(
            title="City History Museum Visit",
            description="History class visit to Haus der Stadtgeschichte.",
            location="Haus der Stadtgeschichte Heilbronn",
            date=datetime.now() + timedelta(days=15)
        )

    ]

    db.add_all(events)

    # --------------------------------------------------
    # COMMUNITY PARENTS
    # --------------------------------------------------

    parent_names = [

        "Anna Müller",
        "Thomas Weber",
        "Julia Schneider",
        "Lukas Fischer",
        "Fatma Yılmaz",
        "Ahmet Kaya",
        "Mohamed Al-Hassan",
        "Layla Al-Hassan",
        "Ion Popescu",
        "Maria Popescu",
        "Elena Petrova",
        "Marco Rossi"
    ]

    parents = []

    for name in parent_names:

        parent = User(
            name=name,
            email=name.replace(" ", ".").lower() + "@example.com",
            role="parent",
            school_id=random.choice(schools).id
        )

        db.add(parent)
        parents.append(parent)

    db.commit()

    # --------------------------------------------------
    # COMMUNITY POSTS WITH IMAGES
    # --------------------------------------------------

# --------------------------------------------------
# COMMUNITY POSTS WITH IMAGES
# --------------------------------------------------

    parent_lookup = {p.name: p.id for p in parents}

    posts_data = [

            ("Experimenta museum trip",
            "My kids loved the experiments at Experimenta today!",
            "/community/experimenta_heilbronn.jpg",
            "Anna Müller"),

            ("Heilbronner Falken hockey game",
            "Great atmosphere at the Falken hockey game!",
            "/community/heilbronner_falken_game.jpg",
            "Thomas Weber"),

            # Spanish – asking about transferring a student
            (
                "Traslado escolar de Heilbronn a Múnich",
                "Nos mudaremos pronto de Heilbronn a Múnich. ¿Alguien sabe cuál es el procedimiento y los documentos necesarios para cambiar a mi hijo de escuela? ¿Cuánto tiempo suele tardar?",
                None,
                "Marco Rossi"
            ),

            ("Hockey game feedback",
            "The kids enjoyed the match but organization could be better.",
            "/community/heilbronner_falken_game.jpg",
            "Lukas Fischer"),

            ("Theater visit",
            "The children’s play at Theater Heilbronn was fantastic!",
            "/community/theater_heilbronn.jpg",
            "Julia Schneider"),

            ("Theater review",
            "Nice performance but maybe too long for younger kids.",
            "/community/theater_heilbronn.jpg",
            "Thomas Weber"),

            # Arabic – activities during holidays
            (
                "أنشطة للأطفال خلال العطلة",
                "هل يعرف أحد أنشطة أو أماكن جيدة للأطفال في هايلبرون خلال العطلة المدرسية؟ أبحث عن متاحف أو ورش عمل أو أنشطة ممتعة للأطفال.",
                None,
                "Mohamed Al-Hassan"
            ),

            ("Science project day",
            "Our kids built amazing science experiments this week.",
            "/community/kids_science_project.jpg",
            "Elena Petrova"),

            ("Playground fun",
            "Kids had a great time after school today.",
            "/community/playground_fun.png",
            "Maria Popescu"),

            ("Arts and crafts club",
            "My daughter made this craft in school club today.",
            "/community/kids_crafts.png",
            "Anna Müller"),

            # Turkish – school reviews
            (
                "Heilbronn'daki okul hakkında görüşler",
                "Heilbronn'daki Justinus-Kerner-Gymnasium hakkında deneyimi olan var mı? Eğitim kalitesi ve öğretmenler hakkında geri bildirim almak isterim.",
                None,
                "Fatma Yılmaz"
            ),

            ("Experimenta too crowded",
            "The museum was interesting but extremely crowded with school groups.",
            "/community/experimenta_heilbronn.jpg",
            "Lukas Fischer"),

        ]

    for title, content, image, author_name in posts_data:

        post = Post(
            title=title,
            content=content,
            image_url=image,
            author_id=parent_lookup[author_name]
        )

        db.add(post)

    db.commit()
    db.close()

    print("Demo database seeded successfully!")


if __name__ == "__main__":
    seed_db()