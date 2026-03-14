import os
from dotenv import load_dotenv
load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from database import SessionLocal
import crud
import models

def process_chat(message: str, parent_id: int) -> str:
    db = SessionLocal()
    try:
        # Fetch the student tied to this parent
        students = db.query(models.Student).filter(models.Student.parent_id == parent_id).all()
        student_id = students[0].id if students else None
        student_name = students[0].name if students else "your child"
        
        grades = crud.get_student_grades(db, student_id) if student_id else []
        meetings = crud.get_parent_meetings(db, parent_id)
        events = crud.get_events(db)
        
        grades_text = "None" if not grades else "\n".join([
            f"- {g.subject}: {g.score}" + (f" ({g.comments})" if g.comments else "")
            for g in grades
        ])
        meetings_text = "None" if not meetings else "\n".join([
            f"- {m.teacher_name} on {m.date.strftime('%Y-%m-%d %H:%M')} [{m.status}]"
            for m in meetings
        ])
        events_text = "None" if not events else "\n".join([
            f"- {e.title} at {e.location} on {e.date.strftime('%Y-%m-%d')} | {e.description}"
            for e in events
        ])
    finally:
        db.close()
        
    api_key = os.getenv("GOOGLE_API_KEY", "mock_key")
    if api_key == "mock_key":
        return f"(Mock AI Mode) I see your child's grades are: {grades_text}. You have meetings: {meetings_text}. Upcoming events: {events_text}. To answer your question: '{message}' - please provide a real API key!"
    
    try:
        @tool
        def schedule_meeting(teacher_name: str, date_str: str) -> str:
            """Schedule a meeting with a teacher. Use this when user wants to book a meeting/appointment with a teacher. date_str must be ISO format like 2026-03-20T14:30:00."""
            from datetime import datetime
            import models
            from database import SessionLocal
            
            try:
                mtg_date = datetime.fromisoformat(date_str)
            except:
                mtg_date = datetime.utcnow()
                
            db_mtg = SessionLocal()
            try:
                m = models.Meeting(parent_id=parent_id, teacher_name=teacher_name, date=mtg_date, status="scheduled")
                db_mtg.add(m)
                db_mtg.commit()
                return f"Successfully scheduled meeting with {teacher_name} on {mtg_date.strftime('%Y-%m-%d %H:%M')}."
            except Exception as e:
                return f"Failed to schedule meeting: {str(e)}"
            finally:
                db_mtg.close()

        @tool
        def send_email(teacher_email: str, subject: str, body: str) -> str:
            """Send an email to a teacher or school staff. Use when user wants to contact a teacher via email. Always sends from nazimabc1@gmail.com."""
            import smtplib
            import os
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            sender = "nazimabc1@gmail.com"
            app_password = os.getenv("GMAIL_APP_PASSWORD")
            try:
                if app_password:
                    msg = MIMEMultipart()
                    msg["From"] = sender
                    msg["To"] = teacher_email
                    msg["Subject"] = subject
                    msg.attach(MIMEText(body, "plain"))
                    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
                        smtp.login(sender, app_password)
                        smtp.sendmail(sender, teacher_email, msg.as_string())
                    return f"Email sent successfully from {sender} to {teacher_email}."
                else:
                    print(f"[MOCK EMAIL] From: {sender} → To: {teacher_email}\nSubject: {subject}\n{body}")
                    return f"Email (simulated) sent from {sender} to {teacher_email} with subject '{subject}'."
            except Exception as e:
                return f"Failed to send email: {str(e)}"

        @tool
        def search_database(query: str) -> str:
            """Search the school database for information about the child's grades, meetings, upcoming events, and school info. Use this for school-specific questions."""
            return f"""Database information for {student_name}:

GRADES:
{grades_text}

SCHEDULED/PAST MEETINGS:
{meetings_text}

UPCOMING EVENTS:
{events_text}"""

        @tool
        def search_internet(query: str) -> str:
            """Search the internet for general information, news, educational topics, parenting advice, or anything not found in the school database. Use DuckDuckGo to find answers."""
            try:
                from duckduckgo_search import DDGS
                with DDGS() as ddgs:
                    results = list(ddgs.text(query, max_results=4))
                if not results:
                    return "No results found on the internet for this query."
                formatted = "\n\n".join([
                    f"**{r['title']}**\n{r['body']}\nSource: {r['href']}"
                    for r in results
                ])
                return f"Internet search results for '{query}':\n\n{formatted}"
            except Exception as e:
                return f"Could not perform internet search: {str(e)}"

        @tool
        def delete_meeting(meeting_id: int) -> str:
            """Delete a meeting from the calendar. Use this when the user wants to cancel or remove an appointment. You must have the meeting_id."""
            db_del = SessionLocal()
            try:
                m = db_del.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
                if not m:
                    return f"Meeting with ID {meeting_id} not found."
                db_del.delete(m)
                db_del.commit()
                return f"Successfully deleted meeting {meeting_id} with {m.teacher_name}."
            except Exception as e:
                return f"Failed to delete meeting: {str(e)}"
            finally:
                db_del.close()

        @tool
        def search_community(query: str) -> str:
            """Search the community feed (posts and comments) for similar questions or topics discussed by other parents. Use this to find peer support or previous answers."""
            db_comm = SessionLocal()
            try:
                # Search posts
                posts = db_comm.query(models.Post).filter(
                    models.Post.title.ilike(f"%{query}%") | models.Post.content.ilike(f"%{query}%")
                ).limit(3).all()
                
                if not posts:
                    return "No similar questions found in the community feed."
                
                results = []
                for p in posts:
                    author = db_comm.query(models.User).filter(models.User.id == p.author_id).first()
                    author_name = author.name if author else "A user"
                    results.append(f"- User '{author_name}' asked: '{p.title}'. Content: '{p.content}'")
                
                formatted = "\n".join(results)
                return f"Similar discussions found in the community:\n{formatted}\n\nNote: If this helps, you can message these users directly."
            finally:
                db_comm.close()

        llm = ChatGoogleGenerativeAI(model="gemini-3.1-pro-preview", google_api_key=api_key)
        tools = [search_database, search_internet, schedule_meeting, delete_meeting, send_email, search_community]
        llm_with_tools = llm.bind_tools(tools)
        
        sys_msg = SystemMessage(content=f"""You are an AI Parent Coach helping parents navigate the school system.

## Core Behavior Rules
1. **Language**: Always respond in the same language the user writes in. Never switch to English unless the user asks you to translate.
2. **Conciseness**: Keep replies short and focused. Do NOT dump all available data—only include what is directly relevant to the question.
3. **Tool Selection**:
   - `search_database`: For school-specific info (grades, meetings, events).
   - `search_community`: Search the community feed for similar questions asked by other parents. If you find a match, mention it like: "User Y faced a similar issue and their answer was ABC. If that doesn't answer your question maybe you can send them a message."
   - `search_internet`: For general knowledge or advice not in the database.
   - `schedule_meeting` / `delete_meeting`: Manage teacher appointments.
   - `send_email`: Contact staff directly.
4. **Meeting Suggestions**: Suggest a meeting if the topic requires teacher involvement.
5. **RAG Relevance**: Only include data directly related to the user's inquiry.
6. **Interaction**: If you find a similar community post, encourage the user to reach out to that parent for more details.

## Context
Parent is asking about: {student_name}
Today's date: 2026-03-14""")
        
        user_msg = HumanMessage(content=message)
        messages = [sys_msg, user_msg]
        
        # Agentic loop - allow up to 5 tool call rounds
        for _ in range(5):
            response = llm_with_tools.invoke(messages)
            
            if not response.tool_calls:
                break
            
            messages.append(response)
            for tool_call in response.tool_calls:
                tool_name = tool_call['name']
                tool_func = {
                    'schedule_meeting': schedule_meeting,
                    'delete_meeting': delete_meeting,
                    'send_email': send_email,
                    'search_database': search_database,
                    'search_internet': search_internet,
                    'search_community': search_community,
                }.get(tool_name)
                
                if tool_func:
                    res = tool_func.invoke(tool_call['args'])
                else:
                    res = f"Unknown tool: {tool_name}"
                
                messages.append(ToolMessage(content=str(res), tool_call_id=tool_call['id']))
        
        # Handle cases where response.content is a list of dicts
        if isinstance(response.content, list) and len(response.content) > 0:
            if isinstance(response.content[0], dict) and 'text' in response.content[0]:
                return response.content[0]['text']
        
        return str(response.content)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return "I encountered an error connecting to the AI model."
