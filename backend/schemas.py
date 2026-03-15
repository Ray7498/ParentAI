from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AuthSyncRequest(BaseModel):
    email: str
    name: str

class AuthSyncResponse(BaseModel):
    user_id: int

class ChatRequest(BaseModel):
    message: str
    parent_id: int

class ChatResponse(BaseModel):
    reply: str

class TranslateRequest(BaseModel):
    email_text: str

class TranslateResponse(BaseModel):
    translated_summary: str

class RewriteRequest(BaseModel):
    text: str

class RewriteResponse(BaseModel):
    rewritten_text: str

class TranslationRequest(BaseModel):
    text: str
    target_language: str

class TranslationResponse(BaseModel):
    translated_text: str

class BatchTranslationRequest(BaseModel):
    texts: list[str]
    target_language: str

class SchoolBase(BaseModel):
    name: str
    city: str
    description: Optional[str] = None

class SchoolCreate(SchoolBase):
    pass

class School(SchoolBase):
    id: int
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    name: str
    email: str
    role: str = "parent"
    school_id: Optional[int] = None

class UserCreate(UserBase):
    pass

class UserPublic(BaseModel):
    id: int
    name: str
    email: str
    role: str
    class Config:
        from_attributes = True

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

class GradeBase(BaseModel):
    subject: str
    score: str
    comments: Optional[str] = None

class Grade(GradeBase):
    id: int
    student_id: int
    date_recorded: datetime
    class Config:
        from_attributes = True

class StudentBase(BaseModel):
    name: str
    grade_level: str
    school_id: Optional[int] = None

class Student(StudentBase):
    id: int
    parent_id: int
    grades: List[Grade] = []
    class Config:
        from_attributes = True

class EventBase(BaseModel):
    title: str
    description: str
    date: datetime
    location: str

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    class Config:
        from_attributes = True

class MeetingBase(BaseModel):
    teacher_name: str
    teacher_id: Optional[int] = None
    date: datetime
    status: str

class Meeting(MeetingBase):
    id: int
    parent_id: int
    class Config:
        from_attributes = True

class PostBase(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None

class UploadResponse(BaseModel):
    file_url: str
    file_name: str
    file_type: str

class PostCreate(PostBase):
    author_id: int

# Defined before Post to avoid forward reference issues
class CommentAuthor(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class Comment(BaseModel):
    id: int
    content: str
    post_id: int
    author_id: int
    created_at: datetime
    author: CommentAuthor
    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content: str
    author_id: int

class Post(PostBase):
    id: int
    author_id: int
    created_at: datetime
    author: User
    comments: List[Comment] = []
    image_url: Optional[str] = None
    class Config:
        from_attributes = True

class NotificationBase(BaseModel):
    message: str
    is_read: int = 0

class NotificationCreate(NotificationBase):
    user_id: int

class Notification(NotificationBase):
    id: int
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class EmailRequest(BaseModel):
    teacher_email: str
    subject: str
    message: str

class ProfileBase(BaseModel):
    profession: Optional[str] = None
    age: Optional[int] = None
    bio: Optional[str] = None
    preferred_language: Optional[str] = "en"

class ProfileUpdate(ProfileBase):
    pass

class Profile(ProfileBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class DirectMessageCreate(BaseModel):
    sender_id: int
    recipient_id: int
    content: str

class DirectMessage(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    content: str
    is_read: int
    created_at: datetime
    sender: CommentAuthor
    recipient: CommentAuthor
    class Config:
        from_attributes = True

# Assuming DirectMessageBase is intended to be a base for DirectMessageResponse
class DirectMessageBase(BaseModel):
    sender_id: int
    recipient_id: int
    content: str
    is_read: int = 0 # Default for new messages

class DirectMessageResponse(DirectMessageBase):
    id: int
    created_at: datetime
    sender: UserPublic
    recipient: UserPublic

    class Config:
        from_attributes = True

class DirectMessageConversation(BaseModel):
    partner: UserPublic
    last_message: DirectMessage
    unread_count: int

    class Config:
        from_attributes = True

# Pronote Features Schemas

class TimetableBase(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str
    subject: str
    teacher: str
    room: str

class TimetableCreate(TimetableBase):
    pass

class TimetableResponse(TimetableBase):
    id: int
    student_id: int
    
    class Config:
        from_attributes = True

class HomeworkBase(BaseModel):
    subject: str
    description: str
    due_date: datetime
    is_completed: int = 0
    requires_submission: int = 0

class HomeworkCreate(HomeworkBase):
    pass

class HomeworkResponse(HomeworkBase):
    id: int
    student_id: int

    class Config:
        from_attributes = True

class LinkBase(BaseModel):
    title: str
    description: str
    url: str

class LinkResponse(LinkBase):
    id: int

    class Config:
        from_attributes = True

class SurveyBase(BaseModel):
    title: str
    description: str

class SurveyResponse(SurveyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
