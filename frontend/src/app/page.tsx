"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/providers/auth-provider";
import {
  CalendarDays, BookOpen, Clock, Bell, Mail, X, CheckCircle2,
  MapPin, User, TrendingUp, Sparkles, ArrowRight, ExternalLink,
  ClipboardList, CheckSquare, Square, ChevronRight, Info
} from "lucide-react";

const API = "http://127.0.0.1:8000/api";

type Meeting = { id: number; teacher_name: string; date: string; status: string };
type Event = { id: number; title: string; description: string; date: string; location: string };
type Grade = { id: number; subject: string; score: string; comments?: string };
type Notification = { id: number; message: string; is_read: number; created_at: string };
type Timetable = { id: number; day: string; time: string; subject: string; teacher: string; room: string };
type Homework = { id: number; subject: string; description: string; due_date: string; is_completed: boolean; submission_type: string };
type Link = { id: number; title: string; description: string; url: string };
type Survey = { id: number; title: string; description: string };

function getGradeClass(score: string) {
  const s = score.toUpperCase();
  if (s.startsWith("A")) return "grade-a";
  if (s.startsWith("B")) return "grade-b";
  if (s.startsWith("C")) return "grade-c";
  return "grade-d";
}

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [emailTo, setEmailTo] = useState(""); const [emailSubj, setEmailSubj] = useState(""); const [emailBody, setEmailBody] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [calendarView, setCalendarView] = useState(new Date());

  const deleteMeetingMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`${API}/meetings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-full"] });
      setSelectedMeeting(null);
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-full", user?.app_user_id],
    queryFn: async () => {
      const [m, e, g, t, h, l, s] = await Promise.all([
        axios.get(`${API}/parents/${user?.app_user_id}/meetings`),
        axios.get(`${API}/events`),
        axios.get(`${API}/parents/${user?.app_user_id}/grades`),
        axios.get(`${API}/parents/${user?.app_user_id}/timetable`),
        axios.get(`${API}/parents/${user?.app_user_id}/homework`),
        axios.get(`${API}/links`),
        axios.get(`${API}/surveys`),
      ]);
      return { 
        meetings: m.data as Meeting[], 
        events: e.data as Event[], 
        grades: g.data as Grade[],
        timetable: t.data as Timetable[],
        homework: h.data as Homework[],
        links: l.data as Link[],
        surveys: s.data as Survey[]
      };
    },
    enabled: !!user?.app_user_id,
  });

  const toggleHomeworkMutation = useMutation({
    mutationFn: (hw: Homework) => axios.put(`${API}/homework/${hw.id}/status`, { is_completed: !hw.is_completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-full"] }),
  });

  useEffect(() => {
    if (user?.app_user_id) {
      axios.get(`${API}/notifications/${user.app_user_id}`).then(r => {
        setNotifications(r.data);
        if (r.data.length > 0) setShowNotif(true);
      }).catch(() => {});
    }
  }, [user?.app_user_id]);

  const dismissNotif = async (id: number) => {
    await axios.post(`${API}/notifications/${id}/read`).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const sendEmail = async () => {
    setEmailStatus("sending");
    try {
      await axios.post(`${API}/emails/send`, { teacher_email: emailTo, subject: emailSubj, message: emailBody });
      setEmailStatus("sent");
      setTimeout(() => { setShowEmail(false); setEmailStatus("idle"); setEmailTo(""); setEmailSubj(""); setEmailBody(""); }, 1500);
    } catch { setEmailStatus("error"); }
  };

  const scheduled = data?.meetings?.filter(m => m.status === "scheduled") ?? [];
  const displayName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  if (isLoading) {
    return (
      <div className="page-bg" style={{ padding: "32px 36px" }}>
        <div className="animate-shimmer" style={{ height: "40px", width: "200px", borderRadius: "8px", background: "var(--input)", marginBottom: "32px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: "24px" }}>
          <div className="animate-shimmer" style={{ height: "600px", borderRadius: "16px", background: "var(--input)" }} />
          <div className="animate-shimmer" style={{ height: "600px", borderRadius: "16px", background: "var(--input)" }} />
          <div className="animate-shimmer" style={{ height: "600px", borderRadius: "16px", background: "var(--input)" }} />
        </div>
      </div>
    );
  }

  // --- Calendar Logic ---
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const getCalendarDays = () => {
    const total = daysInMonth(calendarView);
    const start = firstDayOfMonth(calendarView);
    const arr = [];
    for (let i = 0; i < start; i++) arr.push(null);
    for (let i = 1; i <= total; i++) arr.push(i);
    return arr;
  };

  const getDayContent = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${calendarView.getFullYear()}-${String(calendarView.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const mtgs = data?.meetings?.filter(m => m.date.startsWith(dateStr)) || [];
    const evts = data?.events?.filter(e => e.date.startsWith(dateStr)) || [];
    return [...mtgs.map(m => ({ ...m, type: 'meeting' })), ...evts.map(e => ({ ...e, type: 'event' }))];
  };

  return (
    <div className="page-bg" style={{ padding: "32px 36px", position: "relative", zIndex: 1 }}>
      {/* Top Bar */}
      <div className="animate-fade-up" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--foreground)", lineHeight: 1.1 }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--muted-foreground)", marginTop: "4px", fontSize: "0.85rem" }}>
            Welcome back, {displayName}. Here is your overview for today.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
           <button
            onClick={() => setShowEmail(true)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 14px", borderRadius: "10px",
              background: "var(--card)", border: "1px solid var(--border)",
              color: "var(--foreground)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Mail size={13} /> Contact Staff
          </button>
          <button
            onClick={() => setShowNotif(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 14px", borderRadius: "10px",
              background: notifications.length > 0 ? "var(--violet-dim)" : "var(--card)",
              border: notifications.length > 0 ? "1px solid var(--violet)" : "1px solid var(--border)",
              color: notifications.length > 0 ? "var(--violet)" : "var(--foreground)",
              fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", position: "relative",
            }}
          >
            <Bell size={13} /> {notifications.length > 0 ? `${notifications.length} Alerts` : "Inbox"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {showNotif && notifications.length > 0 && (
        <div className="animate-fade-up notif-strip" style={{ marginBottom: "24px", padding: "14px" }}>
          {notifications.map(n => (
            <div key={n.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: "8px", marginBottom: "4px",
              fontSize: "0.82rem", color: "var(--foreground)", background: "var(--glass)"
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Info size={14} className="text-gold" />
                {n.message}
              </span>
              <button onClick={() => dismissNotif(n.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Top Grid (3 columns) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: "24px", alignItems: "start" }}>
          
          {/* Left Column: Timetable */}
          <div className="glass-card animate-fade-up delay-1" style={{ overflow: "hidden", height: "100%" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", background: "var(--violet-dim)", display: "flex", alignItems: "center", gap: "10px" }}>
              <CalendarDays size={16} className="text-violet" />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--violet)", letterSpacing: "0.02em" }}>DAILY TIMETABLE</span>
            </div>
            <div style={{ padding: "8px 0" }}>
              {data?.timetable?.length === 0 ? (
                <p style={{ padding: "20px", fontSize: "0.8rem", color: "var(--muted-foreground)", textAlign: "center" }}>No classes today.</p>
              ) : (
                data?.timetable?.map((slot, i) => (
                  <div key={slot.id} style={{ 
                    padding: "14px 20px", 
                    borderBottom: i === data.timetable.length - 1 ? "none" : "1px solid var(--border)",
                    display: "flex", gap: "16px", transition: "background 0.2s"
                  }} className="hover:bg-muted/30">
                    <div style={{ minWidth: "55px", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted-foreground)", paddingTop: "2px" }}>
                      {slot.time}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--foreground)" }}>{slot.subject}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "2px" }}>
                        {slot.teacher} • Room {slot.room}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Center Column: Homework Tracker */}
          <div className="glass-card animate-fade-up delay-2" style={{ height: "100%" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CheckSquare size={16} className="text-teal" />
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--teal)", letterSpacing: "0.02em" }}>HOMEWORK & TASKS</span>
              </div>
              <span className="badge-scheduled" style={{ background: "var(--teal)", color: "white", border: "none" }}>
                {data?.homework?.filter(h => !h.is_completed).length} Pending
              </span>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {data?.homework?.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", textAlign: "center", margin: "20px 0" }}>Enjoy your day! No homework pending.</p>
              ) : (
                data?.homework?.map(hw => (
                  <div key={hw.id} style={{ 
                    padding: "14px", borderRadius: "12px", background: "var(--input)",
                    border: "1px solid var(--border)", display: "flex", gap: "14px",
                    opacity: hw.is_completed ? 0.6 : 1, transition: "all 0.2s"
                  }}>
                    <button 
                      onClick={() => toggleHomeworkMutation.mutate(hw)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: hw.is_completed ? "var(--teal)" : "var(--muted-foreground)", paddingTop: "2px" }}
                    >
                      {hw.is_completed ? <CheckCircle2 size={18} /> : <Square size={18} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--foreground)", textDecoration: hw.is_completed ? "line-through" : "none" }}>
                          {hw.subject}
                        </span>
                        <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--rose)" }}>
                          {new Date(hw.due_date).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", margin: 0, lineHeight: 1.4 }}>{hw.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Resources & Performance */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="glass-card animate-fade-up delay-4">
              <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
                <TrendingUp size={16} className="text-violet" />
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--violet)", letterSpacing: "0.02em" }}>GRADES OVERVIEW</span>
              </div>
              <div style={{ padding: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {data?.grades?.map(g => (
                    <div key={g.id} style={{ padding: "10px", background: "var(--input)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{g.subject}</span>
                      <span className={getGradeClass(g.score)} style={{ fontSize: "0.8rem", fontWeight: 700 }}>{g.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card animate-fade-up delay-5">
              <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
                <ExternalLink size={16} className="text-emerald" />
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--emerald)", letterSpacing: "0.02em" }}>SCHOOL RESOURCES</span>
              </div>
              <div style={{ padding: "10px" }}>
                {data?.links?.map(link => (
                  <button key={link.id} onClick={() => setSelectedLink(link)} style={{ 
                    width: "100%", border: "none", background: "none", textAlign: "left",
                    display: "flex", alignItems: "center", gap: "12px", padding: "10px",
                    borderRadius: "10px", cursor: "pointer", transition: "background 0.2s"
                  }} className="hover:bg-muted/50">
                    <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "var(--emerald)", opacity: 0.1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--emerald)", flexShrink: 0 }}>
                      <BookOpen size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--foreground)" }}>{link.title}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--muted-foreground)" }}>Check details</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Calendar Row */}
        <div className="glass-card animate-fade-up delay-6" style={{ overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <CalendarDays size={18} className="text-violet" />
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--foreground)", letterSpacing: "0.01em" }}>PERSONAL & SCHOOL CALENDAR</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button 
                onClick={() => setCalendarView(new Date(calendarView.getFullYear(), calendarView.getMonth() - 1))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--foreground)" }}
              >
                <X size={16} /> {/* Should be ChevronLeft */}
              </button>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)", minWidth: "120px", textAlign: "center" }}>
                {calendarView.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={() => setCalendarView(new Date(calendarView.getFullYear(), calendarView.getMonth() + 1))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--foreground)" }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          
          <div style={{ padding: "0" }}>
            {/* Days Header */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "var(--violet-dim)", borderBottom: "1px solid var(--border)" }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} style={{ padding: "10px", textAlign: "center", fontSize: "0.65rem", fontWeight: 700, color: "var(--violet)", textTransform: "uppercase" }}>{d}</div>
              ))}
            </div>
            {/* Calendar Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "var(--border)" }}>
              {getCalendarDays().map((day, i) => {
                const dayContent = getDayContent(day);
                const isToday = day === new Date().getDate() && calendarView.getMonth() === new Date().getMonth();
                return (
                  <div key={i} style={{ 
                    minHeight: "120px", background: "var(--card)", padding: "10px",
                    display: "flex", flexDirection: "column", gap: "4px"
                  }}>
                    {day && (
                      <div style={{ 
                        fontSize: "0.8rem", fontWeight: isToday ? 800 : 500, 
                        color: isToday ? "var(--violet)" : "var(--foreground)",
                        display: "flex", justifyContent: "space-between", alignItems: "center"
                      }}>
                        {day}
                        {isToday && <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--violet)" }} />}
                      </div>
                    )}
                    {dayContent.map((item: any) => (
                      <button 
                        key={item.id + item.type}
                        onClick={() => item.type === 'meeting' ? setSelectedMeeting(item) : setSelectedEvent(item)}
                        style={{ 
                          padding: "4px 8px", borderRadius: "6px", fontSize: "0.65rem", textAlign: "left",
                          background: item.type === 'meeting' ? 'var(--gold)' : 'var(--violet-dim)',
                          color: item.type === 'meeting' ? '#000' : 'var(--violet)',
                          border: "none", cursor: "pointer", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"
                        }}
                      >
                        {item.type === 'meeting' ? `Meeting: ${item.teacher_name}` : item.title}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* --- Modals --- */}
      
      {/* Meeting Modal */}
      <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
        <DialogContent style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", maxWidth: "420px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "var(--foreground)", fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} className="text-gold" /> Meeting Details
            </DialogTitle>
          </DialogHeader>
          {selectedMeeting && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "4px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Teacher", value: selectedMeeting.teacher_name },
                  { label: "Status", value: <span className={`badge-${selectedMeeting.status}`}>{selectedMeeting.status}</span> },
                  { label: "Date", value: new Date(selectedMeeting.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) },
                  { label: "Time", value: new Date(selectedMeeting.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) },
                ].map((item, i) => (
                  <div key={i} style={{ padding: "12px", borderRadius: "10px", background: "var(--input)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{item.label}</div>
                    <div style={{ fontSize: "0.84rem", color: "var(--foreground)", fontWeight: 500 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => { setShowEmail(true); setSelectedMeeting(null); }} style={{
                  flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "10px", borderRadius: "10px",
                  background: "var(--violet-dim)", border: "1px solid var(--violet)", color: "var(--violet)", 
                  cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, justifyContent: "center",
                }}>
                  <Mail size={14} /> Email Teacher
                </button>
                <button 
                  onClick={() => deleteMeetingMutation.mutate(selectedMeeting.id)}
                  disabled={deleteMeetingMutation.isPending}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "10px", background: "var(--input)", border: "1px solid var(--destructive)", color: "var(--destructive)",
                    cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
                  }}>
                  {deleteMeetingMutation.isPending ? "Deleting..." : "Delete Meeting"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resource Link Modal */}
      <Dialog open={!!selectedLink} onOpenChange={() => setSelectedLink(null)}>
        <DialogContent style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", maxWidth: "480px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "var(--foreground)", fontSize: "1.1rem", fontWeight: 700 }}>
              {selectedLink?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedLink && (
            <div style={{ padding: "4px 0" }}>
              <p style={{ fontSize: "0.9rem", color: "var(--muted-foreground)", marginBottom: "20px" }}>{selectedLink.description}</p>
              
              {selectedLink.title.includes("Menu") ? (
                <div style={{ background: "var(--input)", padding: "16px", borderRadius: "12px" }}>
                  <h4 className="section-label" style={{ marginBottom: "12px" }}>Weekly Menu Highlights</h4>
                  {[
                    { day: "Monday", meal: "Spaghetti Bolognese, Fresh Salad" },
                    { day: "Tuesday", meal: "Roasted Chicken w/ Vegetables" },
                    { day: "Wednesday", meal: "Vegetarian Lasagna" },
                  ].map(m => (
                    <div key={m.day} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 600 }}>{m.day}</span>
                      <span style={{ color: "var(--muted-foreground)" }}>{m.meal}</span>
                    </div>
                  ))}
                </div>
              ) : selectedLink.title.includes("Calendar") ? (
                <div style={{ background: "var(--input)", padding: "16px", borderRadius: "12px" }}>
                  <h4 className="section-label" style={{ marginBottom: "12px" }}>Upcoming School Events</h4>
                  {data?.events?.slice(0, 3).map(e => (
                    <div key={e.id} style={{ marginBottom: "10px" }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{e.title}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{new Date(e.date).toLocaleDateString()} • {e.location}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: "var(--input)", padding: "16px", borderRadius: "12px" }}>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>Select a categorized library to browse books, research papers, and digital publications available to students.</p>
                </div>
              )}

              <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                <a href={selectedLink.url} target="_blank" className="btn-primary" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                  Open Full portal <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEmail} onOpenChange={o => { setShowEmail(o); if (!o) setEmailStatus("idle"); }}>
        <DialogContent style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", maxWidth: "440px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "var(--foreground)", fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Mail size={18} className="text-violet" /> Compose Email
            </DialogTitle>
            <DialogDescription style={{ color: "var(--muted-foreground)", fontSize: "0.8rem" }}>
              To: staff member • From: nazimabc1@gmail.com
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "4px" }}>
            {[
              { label: "To (Email)", ph: "teacher@school.edu", val: emailTo, set: setEmailTo },
              { label: "Subject", ph: "Re: My child's progress...", val: emailSubj, set: setEmailSubj },
            ].map((f, i) => (
              <div key={i}>
                <div className="section-label" style={{ marginBottom: "4px" }}>{f.label}</div>
                <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ width: "100%", padding: "10px 12px", fontSize: "0.84rem" }} />
              </div>
            ))}
            <div>
              <div className="section-label" style={{ marginBottom: "4px" }}>Message</div>
              <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="Write your message..." rows={5} style={{ width: "100%", padding: "10px 12px", fontSize: "0.84rem", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setShowEmail(false)} style={{ padding: "9px 18px", borderRadius: "10px", background: "var(--input)", border: "1px solid var(--border)", color: "var(--muted-foreground)", cursor: "pointer", fontSize: "0.84rem" }}>
                Cancel
              </button>
              <button onClick={sendEmail} disabled={!emailTo || !emailSubj || !emailBody || emailStatus === "sending" || emailStatus === "sent"} className="btn-primary">
                {emailStatus === "sent" ? "✓ Sent!" : emailStatus === "sending" ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
