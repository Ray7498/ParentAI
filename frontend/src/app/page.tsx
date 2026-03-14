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

      {/* 3-Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* Left Column: Timetable */}
        <div className="glass-card animate-fade-up delay-1" style={{ overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", background: "var(--violet-dim)", display: "flex", alignItems: "center", gap: "10px" }}>
            <CalendarDays size={16} className="text-violet" />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--violet)", letterSpacing: "0.02em" }}>DAILY TIMETABLE</span>
          </div>
          <div style={{ padding: "8px 0" }}>
            {data?.timetable?.map((slot, i) => (
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
            ))}
          </div>
        </div>

        {/* Center Column: Homework & Agenda */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Homework Tracker */}
          <div className="glass-card animate-fade-up delay-2">
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CheckSquare size={16} className="text-teal" />
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--teal)", letterSpacing: "0.02em" }}>HOMEWORK & TASKS</span>
              </div>
              <span className="badge-scheduled" style={{ background: "var(--teal)", color: "white", border: "none" }}>
                {data?.homework?.filter(h => !h.is_completed).length} Pending
              </span>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {data?.homework?.map(hw => (
                <div key={hw.id} style={{ 
                  padding: "16px", borderRadius: "12px", background: "var(--input)",
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
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--foreground)", textDecoration: hw.is_completed ? "line-through" : "none" }}>
                        {hw.subject}
                      </span>
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--rose)" }}>
                        Due {new Date(hw.due_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", margin: 0, lineHeight: 1.4 }}>{hw.description}</p>
                    <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                      <span style={{ fontSize: "0.65rem", padding: "2px 8px", background: "var(--card)", borderRadius: "100px", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                        {hw.submission_type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agenda / Upcoming Meetings */}
          <div className="glass-card animate-fade-up delay-3">
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
              <Clock size={16} className="text-gold" />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gold)", letterSpacing: "0.02em" }}>AGENDA & APPOINTMENTS</span>
            </div>
            <div style={{ padding: "20px" }}>
               {scheduled.length === 0 ? (
                  <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", textAlign: "center", margin: "20px 0" }}>No appointments scheduled.</p>
               ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {scheduled.map(m => (
                    <button key={m.id} onClick={() => setSelectedMeeting(m)} style={{
                      padding: "16px", borderRadius: "12px", background: "var(--input)",
                      border: "1px solid var(--border)", textAlign: "left", cursor: "pointer",
                      transition: "all 0.2s"
                    }} className="hover:border-gold/30">
                      <div style={{ fontSize: "0.65rem", color: "var(--gold)", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase" }}>Meeting</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--foreground)" }}>{m.teacher_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "4px" }}>
                        {new Date(m.date).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </button>
                  ))}
                </div>
               )}
            </div>
          </div>
        </div>

        {/* Right Column: Links, Surveys & Grades */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Grades Summary */}
          <div className="glass-card animate-fade-up delay-4">
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
              <TrendingUp size={16} className="text-violet" />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--violet)", letterSpacing: "0.02em" }}>PERFORMANCE OVERVIEW</span>
            </div>
            <div style={{ padding: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {data?.grades?.map(g => (
                  <div key={g.id} style={{ padding: "12px", background: "var(--input)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{g.subject}</span>
                    <span className={getGradeClass(g.score)} style={{ fontSize: "0.85rem" }}>{g.score}</span>
                  </div>
                ))}
              </div>
              <button style={{ width: "100%", marginTop: "16px", padding: "10px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", fontSize: "0.75rem", color: "var(--muted-foreground)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                View Full Gradebook <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Useful Links */}
          <div className="glass-card animate-fade-up delay-5">
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
              <ExternalLink size={16} className="text-emerald" />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--emerald)", letterSpacing: "0.02em" }}>USEFUL RESOURCES</span>
            </div>
            <div style={{ padding: "12px" }}>
              {data?.links?.map(link => (
                <a key={link.id} href={link.url} target="_blank" style={{ 
                  display: "flex", alignItems: "center", gap: "12px", padding: "12px",
                  borderRadius: "10px", textDecoration: "none", transition: "background 0.2s"
                }} className="hover:bg-muted/50">
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--emerald)", opacity: 0.1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--emerald)", flexShrink: 0 }}>
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)" }}>{link.title}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>{link.description}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Information & Surveys */}
          <div className="glass-card animate-fade-up delay-6" style={{ background: "linear-gradient(135deg, var(--card) 0%, var(--gold) 500%)" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
              <ClipboardList size={16} className="text-gold" />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gold)", letterSpacing: "0.02em" }}>SURVEYS & INFO</span>
            </div>
            <div style={{ padding: "20px" }}>
              {data?.surveys?.map(survey => (
                <div key={survey.id} style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--foreground)", marginBottom: "4px" }}>{survey.title}</div>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", margin: 0, marginBottom: "10px" }}>{survey.description}</p>
                  <button className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.75rem", background: "var(--gold)", color: "#000", boxShadow: "none" }}>Respond</button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Existing Modals */}
      <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
        <DialogContent style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", maxWidth: "420px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "var(--foreground)", fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} className="text-teal" /> Meeting Details
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
              <button onClick={() => { setShowEmail(true); setSelectedMeeting(null); }} style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "10px",
                background: "var(--violet-dim)", border: "1px solid var(--violet)",
                color: "var(--violet)", cursor: "pointer", fontSize: "0.84rem", fontWeight: 500, transition: "all 0.15s", justifyContent: "center",
              }}>
                <Mail size={14} /> Email This Teacher
              </button>
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
