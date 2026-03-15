export type Meeting = { id: number; teacher_name: string; date: string; status: string };
export type Event = { id: number; title: string; description: string; date: string; location: string };
export type Grade = { id: number; subject: string; score: string; comments?: string };
export type Notification = { id: number; message: string; is_read: number; created_at: string };
export type Timetable = { id: number; day: string; time: string; subject: string; teacher: string; room: string };
export type Homework = { id: number; subject: string; description: string; due_date: string; is_completed: boolean; submission_type: string };
export type Link = { id: number; title: string; description: string; url: string };
export type Survey = { id: number; title: string; description: string };
