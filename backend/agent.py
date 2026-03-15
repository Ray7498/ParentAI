import os
from dotenv import load_dotenv
load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from sqlalchemy.orm import Session
import crud
import models
import yaml
import rag

# Load Agent Config
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "configs", "agent_config.yaml")
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    AGENT_CONFIG = yaml.safe_load(f)

def process_chat(message: str, parent_id: int, db: Session) -> str:
    try:
        # Fetch the parent and school
        parent = db.query(models.User).filter(models.User.id == parent_id).first()
        school_id = parent.school_id if parent else None
        school = db.query(models.School).filter(models.School.id == school_id).first() if school_id else None
        school_name = school.name if school else "an unknown school"

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
    except Exception as e:
        print(f"Error fetching parent context: {e}")
        return "Internal Error"
        
    api_key = os.getenv("GOOGLE_API_KEY", "mock_key")
    if api_key == "mock_key":
        return f"(Mock AI Mode) I see your child's grades are: {grades_text}. You have meetings: {meetings_text}. Upcoming events: {events_text}. To answer your question: '{message}' - please provide a real API key!"
    
    try:
        @tool
        def check_teacher_schedule(teacher_name: str, date_str: str) -> str:
            """Check a specific teacher's availability for a given date in the parent's school (format YYYY-MM-DD). Use this before scheduling a meeting."""
            from datetime import datetime
            import crud
            from database import SessionLocal
            
            try:
                check_date = datetime.strptime(date_str.split('T')[0], "%Y-%m-%d")
            except:
                return "Invalid date format. Use YYYY-MM-DD."
                
            try:
                teachers = crud.get_teachers_by_school(db, school_id) if school_id else []
                teacher = next((t for t in teachers if teacher_name.lower() in t.name.lower()), None)
                if not teacher:
                    return f"Teacher {teacher_name} not found in this school ({school_name})."
                
                # Assume working hours 13:00 to 17:00
                working_hours = [13, 14, 15, 16]
                booked_meetings = crud.check_teacher_availability(db, teacher.id, check_date)
                booked_hours = [m.date.hour for m in booked_meetings]
                
                free_slots = []
                for h in working_hours:
                    if h not in booked_hours:
                        t = check_date.replace(hour=h, minute=0).strftime('%Y-%m-%d %H:%M')
                        free_slots.append(t)
                
                if not free_slots:
                    return f"{teacher.name} has no available slots on {date_str}."
                return f"{teacher.name} is available on these slots: {', '.join(free_slots)}. Use schedule_meeting to book one."
            except Exception as e:
                return f"Error checking schedule: {str(e)}"

        @tool
        def schedule_meeting(teacher_name: str, date_str: str) -> str:
            """Schedule a meeting with a teacher. Use the full date-time string like 2026-03-20T14:00:00."""
            from datetime import datetime
            import models
            from database import SessionLocal
            import crud
            
            try:
                mtg_date = datetime.fromisoformat(date_str)
            except:
                mtg_date = datetime.utcnow()
                
            try:
                teachers = crud.get_teachers_by_school(db, school_id) if school_id else []
                teacher = next((t for t in teachers if teacher_name.lower() in t.name.lower()), None)
                if not teacher:
                    return f"Cannot schedule. Teacher {teacher_name} not found in this school ({school_name})."

                m = models.Meeting(parent_id=parent_id, teacher_id=teacher.id, teacher_name=teacher.name, date=mtg_date, status="scheduled")
                db.add(m)
                db.commit()
                return f"Successfully scheduled meeting with {teacher.name} on {mtg_date.strftime('%Y-%m-%d %H:%M')}."
            except Exception as e:
                return f"Failed to schedule meeting: {str(e)}"

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
                    return f"Email (simulated) sent from {sender} to {teacher_email} with subject '{subject}'."
            except Exception as e:
                return f"Failed to send email: {str(e)}"

        @tool
        def search_database(query: str) -> str:
            """Search the school database for information about the child's grades, meetings, upcoming events, and school info. Use this for school-specific questions."""
            return f"""Database information for {student_name} enrolled at {school_name}:

GRADES:
{grades_text}

SCHEDULED/PAST MEETINGS:
{meetings_text}

UPCOMING EVENTS:
{events_text}"""

        @tool
        def search_internet(query: str) -> str:
            """Search the internet for general information, advice, or news not found in the school database.
            Returns results with titles, summaries, and clickable source URLs.
            Always use this for questions about external topics, general parenting advice, local services, etc."""
            try:
                from duckduckgo_search import DDGS
                with DDGS() as ddgs:
                    results = list(ddgs.text(query, max_results=5))
                if not results:
                    return "No internet results found for this query."
                # Build a clearly structured response the LLM can cite
                lines = [f"Web search results for: '{query}'\n"]
                for i, r in enumerate(results, 1):
                    title = r.get('title', 'Untitled')
                    body  = r.get('body', '').strip()
                    url   = r.get('href', '')
                    lines.append(
                        f"[{i}] **{title}**\n"
                        f"{body}\n"
                        f"Source: [{title}]({url})\n"
                    )
                lines.append(
                    "\nIMPORTANT: In your response you MUST include a '## Sources' section at the end "
                    "listing every source you used as a numbered markdown hyperlink: [Title](URL)."
                )
                return "\n".join(lines)
            except Exception as e:
                return f"Internet search failed: {str(e)}"

        @tool
        def delete_meeting(meeting_id: int) -> str:
            """Delete a meeting from the calendar. Use this when the user wants to cancel or remove an appointment. You must have the meeting_id."""
            try:
                m = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
                if not m:
                    return f"Meeting with ID {meeting_id} not found."
                db.delete(m)
                db.commit()
                return f"Successfully deleted meeting {meeting_id} with {m.teacher_name}."
            except Exception as e:
                return f"Failed to delete meeting: {str(e)}"

        @tool
        def search_community(query: str) -> str:
            """Search the global community feed (posts and comments) across all schools for similar questions or topics discussed by other parents. Use this to find peer support or previous answers."""
            try:
                # Search posts
                posts = db.query(models.Post).filter(
                    models.Post.title.ilike(f"%{query}%") | models.Post.content.ilike(f"%{query}%")
                ).limit(3).all()
                
                if not posts:
                    return "No similar questions found in the community feed."
                
                results = []
                for p in posts:
                    author = db.query(models.User).filter(models.User.id == p.author_id).first()
                    author_name = author.name if author else "A user"
                    results.append(f"- User '{author_name}' asked: '{p.title}'. Content: '{p.content}'")
                
                formatted = "\n".join(results)
                return f"Similar discussions found in the global community:\n{formatted}\n\nNote: If this helps, you can message these users directly."
            except Exception as e:
                return f"Failed to search community: {str(e)}"

        @tool
        def search_school_info(query: str) -> str:
            """Search the school handbook, parent guides, and general German school system documentation for official rules, protocols, or advice.
            Use this for questions about grades, transfers, extracurriculars, or school policies."""
            try:
                retriever = rag.get_rag_retriever()
                if not retriever:
                    return "RAG system is currently unavailable (check API keys)."
                docs = retriever.get_relevant_documents(query)
                if not docs:
                    return "No specific information found in the school handbook."
                return "\n\n---\n\n".join([d.page_content for d in docs])
            except Exception as e:
                return f"Error searching school info: {str(e)}"

        llm = ChatGoogleGenerativeAI(model=AGENT_CONFIG.get("model", "gemini-3.1-pro-preview"), google_api_key=api_key)
        tools = [search_database, search_internet, check_teacher_schedule, schedule_meeting, delete_meeting, send_email, search_community, search_school_info]
        llm_with_tools = llm.bind_tools(tools)
        
        # Format the system prompt from config
        today_date = "2026-03-14"
        formatted_prompt = AGENT_CONFIG.get("system_prompt", "").format(
            school_name=school_name,
            student_name=student_name,
            today_date=today_date
        )
        sys_msg = SystemMessage(content=formatted_prompt)
        
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
                    'check_teacher_schedule': check_teacher_schedule,
                    'delete_meeting': delete_meeting,
                    'send_email': send_email,
                    'search_database': search_database,
                    'search_internet': search_internet,
                    'search_community': search_community,
                    'search_school_info': search_school_info,
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

def rewrite_post(text: str) -> str:
    try:
        api_key = os.getenv("GOOGLE_API_KEY", "mock_key")
        if api_key == "mock_key":
            return "This is a mock rewritten post since you don't have a Google API Key."
            
        llm = ChatGoogleGenerativeAI(model=AGENT_CONFIG.get("model", "gemini-3.1-pro-preview"), google_api_key=api_key)
        
        sys_msg = SystemMessage(content="You are a helpful assistant for a parent community. Your task is to rewrite the parent's post to make it more clear, warm, empathetic, and grammatically correct. Keep the core message but improve the tone. Do not add any conversational filler, just return the rewritten text.")
        user_msg = HumanMessage(content=text)
        
        response = llm.invoke([sys_msg, user_msg])
        
        content = response.content
        if isinstance(content, list) and len(content) > 0:
            if isinstance(content[0], dict) and 'text' in content[0]:
                return content[0]['text']
        
        return str(content)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return "Ah, I ran into an error trying to rewrite this post."

def translate_text(text: str, target_language: str) -> str:
    try:
        api_key = os.getenv("GOOGLE_API_KEY", "mock_key")
        if api_key == "mock_key":
            return f"[Translated to {target_language}]: {text}"
            
        llm = ChatGoogleGenerativeAI(model=AGENT_CONFIG.get("model", "gemini-3.1-pro-preview"), google_api_key=api_key)
        
        sys_msg = SystemMessage(content=f"You are a professional translator. Translate the following text completely and accurately into {target_language}. Do not include any explanations or conversational text, just the raw translated string. Maintain the original tone.")
        user_msg = HumanMessage(content=text)
        
        response = llm.invoke([sys_msg, user_msg])
        
        content = response.content
        if isinstance(content, list) and len(content) > 0:
            if isinstance(content[0], dict) and 'text' in content[0]:
                return content[0]['text']
        
        return str(content).strip()
    except Exception as e:
        import traceback
        traceback.print_exc()
        return text # Fallback to original text on failure


def batch_translate_texts(texts: list[str], target_language: str) -> dict[str, str]:
    """Translate multiple strings in a single LLM call. Returns {original: translated} dict."""
    if not texts:
        return {}
    try:
        api_key = os.getenv("GOOGLE_API_KEY", "mock_key")
        if api_key == "mock_key":
            return {t: f"[{target_language}] {t}" for t in texts}

        llm = ChatGoogleGenerativeAI(model=AGENT_CONFIG.get("model", "gemini-3.1-pro-preview"), google_api_key=api_key)

        numbered = "\n".join(f"{i+1}. {t}" for i, t in enumerate(texts))
        sys_msg = SystemMessage(content=(
            f"You are a professional translator. Translate every numbered item below into {target_language}. "
            "Return ONLY a JSON object where each key is the original text and each value is its translation. "
            "Do NOT add any commentary, markdown formatting, or extra keys. Example format: "
            '{"Hello": "Bonjour", "Goodbye": "Au revoir"}'
        ))
        user_msg = HumanMessage(content=numbered)

        response = llm.invoke([sys_msg, user_msg])
        content = response.content
        if isinstance(content, list):
            content = content[0].get('text', '') if content and isinstance(content[0], dict) else str(content[0])

        import json, re
        # Strip potential markdown code fences
        clean = re.sub(r'^```json\s*|^```\s*|```$', '', str(content).strip(), flags=re.MULTILINE).strip()
        result = json.loads(clean)
        # Ensure all originals are present (fallback to original on missing key)
        return {t: result.get(t, t) for t in texts}
    except Exception:
        import traceback
        traceback.print_exc()
        return {t: t for t in texts} # Fallback to original text on failure
