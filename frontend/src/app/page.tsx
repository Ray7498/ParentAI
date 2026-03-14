"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/providers/auth-provider";
import {
  CalendarDays, BookOpen, Clock, Bell, Mail, X, CheckCircle2,
  MapPin, User, TrendingUp, Sparkles, ArrowRight
} from "lucide-react";

const API = "http://127.0.0.1:8000/api";

type Meeting = { id: number; teacher_name: string; date: string; status: string };
type Event = { id: number; title: string; description: string; date: string; location: string };
type Grade = { id: number; subject: string; score: string; comments?: string };
type Notification = { id: number; message: string; is_read: number; created_at: string };

function getGradeClass(score: string) {
  const s = score.toUpperCase();
  if (s.startsWith("A")) return "grade-a";
  if (s.startsWith("B")) return "grade-b";
  if (s.startsWith("C")) return "grade-c";
  return "grade-d";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [emailTo, setEmailTo] = useState(""); const [emailSubj, setEmailSubj] = useState(""); const [emailBody, setEmailBody] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.app_user_id],
    queryFn: async () => {
      const [m, e, g] = await Promise.all([
        axios.get(`${API}/parents/${user?.app_user_id}/meetings`),
        axios.get(`${API}/events`),
        axios.get(`${API}/parents/${user?.app_user_id}/grades`),
      ]);
      return { meetings: m.data as Meeting[], events: e.data as Event[], grades: g.data as Grade[] };
    },
    enabled: !!user?.app_user_id,
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
  const grades = data?.grades ?? [];
  const events = data?.events ?? [];
  const displayName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <div className="page-bg" style={{ padding: "32px 36px", position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>
            Welcome back
          </p>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.04em", color: "#e8e8f0", lineHeight: 1.1 }}>
            Hello, {displayName} 👋
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", marginTop: "6px", fontSize: "0.9rem" }}>
            Here's what's happening at school today.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
          <button
            onClick={() => setShowEmail(true)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 16px", borderRadius: "10px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(232,232,240,0.7)", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(124,107,255,0.1)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,107,255,0.25)"; (e.currentTarget as HTMLElement).style.color = "#a598ff"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(232,232,240,0.7)"; }}
          >
            <Mail size={14} /> Email Teacher
          </button>
          <button
            onClick={() => setShowNotif(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 16px", borderRadius: "10px",
              background: notifications.length > 0 ? "rgba(255,217,125,0.08)" : "rgba(255,255,255,0.04)",
              border: notifications.length > 0 ? "1px solid rgba(255,217,125,0.2)" : "1px solid rgba(255,255,255,0.08)",
              color: notifications.length > 0 ? "#ffd97d" : "rgba(232,232,240,0.7)",
              fontSize: "0.8rem", fontWeight: 500, cursor: "pointer", position: "relative", transition: "all 0.15s ease",
            }}
          >
            <Bell size={14} /> Notifications
            {notifications.length > 0 && (
              <span style={{
                background: "#ff6b9d", color: "white", borderRadius: "100%",
                width: "18px", height: "18px", fontSize: "0.65rem", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {notifications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notification strip */}
      {showNotif && notifications.length > 0 && (
        <div className="animate-fade-up notif-strip" style={{ marginBottom: "24px", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <Bell size={13} color="#ffd97d" />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#ffd97d", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Unread Notifications
            </span>
          </div>
          {notifications.map(n => (
            <div key={n.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: "8px",
              background: "rgba(255,255,255,0.03)", marginBottom: "6px",
              fontSize: "0.84rem", color: "rgba(232,232,240,0.8)",
            }}>
              <span>{n.message}</span>
              <button onClick={() => dismissNotif(n.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", margin: 0, padding: "2px" }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {showNotif && notifications.length === 0 && (
        <div className="animate-fade-up" style={{ marginBottom: "24px", padding: "12px 16px", borderRadius: "10px", background: "rgba(78,205,196,0.05)", border: "1px solid rgba(78,205,196,0.15)", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.84rem", color: "#4ecdc4" }}>
          <CheckCircle2 size={15} /> All caught up — no unread notifications!
        </div>
      )}

      {/* Stats Row */}
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
          {[1,2,3].map(i => <div key={i} className="animate-shimmer" style={{ height: "160px", borderRadius: "14px", background: "rgba(255,255,255,0.03)" }} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
          {/* Grades */}
          <div className="glass-card stat-card-violet animate-fade-up delay-1" style={{ padding: "22px", borderRadius: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div className="section-label" style={{ marginBottom: "4px" }}>Recent Grades</div>
                <div style={{ fontSize: "2.2rem", fontWeight: 700, letterSpacing: "-0.04em", color: "#e8e8f0" }}>{grades.length}</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>subjects tracked</div>
              </div>
              <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(124,107,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookOpen size={17} color="#7c6bff" />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {grades.map(g => (
                <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.03)" }}>
                  <span style={{ fontSize: "0.82rem", color: "rgba(232,232,240,0.7)" }}>{g.subject}</span>
                  <span className={getGradeClass(g.score)} style={{ fontSize: "0.82rem" }}>{g.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Meetings */}
          <div className="glass-card stat-card-teal animate-fade-up delay-2" style={{ padding: "22px", borderRadius: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div className="section-label" style={{ marginBottom: "4px" }}>Upcoming Meetings</div>
                <div style={{ fontSize: "2.2rem", fontWeight: 700, letterSpacing: "-0.04em", color: "#e8e8f0" }}>{scheduled.length}</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>scheduled</div>
              </div>
              <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(78,205,196,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={17} color="#4ecdc4" />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {scheduled.length === 0 && (
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "8px" }}>
                  No upcoming meetings. Ask the AI Coach to schedule one!
                </div>
              )}
              {scheduled.map(m => (
                <button key={m.id} onClick={() => setSelectedMeeting(m)} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 10px", borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)", cursor: "pointer",
                  border: "none", transition: "background 0.15s", textAlign: "left",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(78,205,196,0.08)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <User size={13} color="#4ecdc4" />
                    <span style={{ fontSize: "0.82rem", color: "rgba(232,232,240,0.8)", fontWeight: 500 }}>{m.teacher_name}</span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>{new Date(m.date).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Events */}
          <div className="glass-card stat-card-rose animate-fade-up delay-3" style={{ padding: "22px", borderRadius: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div className="section-label" style={{ marginBottom: "4px" }}>School Events</div>
                <div style={{ fontSize: "2.2rem", fontWeight: 700, letterSpacing: "-0.04em", color: "#e8e8f0" }}>{events.length}</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>upcoming</div>
              </div>
              <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,107,157,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarDays size={17} color="#ff6b9d" />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "130px", overflowY: "auto" }}>
              {events.map(e => (
                <button key={e.id} onClick={() => setSelectedEvent(e)} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 10px", borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)", cursor: "pointer",
                  border: "none", transition: "background 0.15s", textAlign: "left",
                }}
                onMouseEnter={el => (el.currentTarget as HTMLElement).style.background = "rgba(255,107,157,0.08)"}
                onMouseLeave={el => (el.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"}
                >
                  <span style={{ fontSize: "0.82rem", color: "rgba(232,232,240,0.8)", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{e.title}</span>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>{new Date(e.date).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="animate-fade-up delay-4">
        <div className="section-label" style={{ marginBottom: "12px" }}>Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          {[
            { icon: <Sparkles size={16} color="#7c6bff" />, label: "Ask AI Coach", sub: "Get school guidance", href: "/coach", color: "rgba(124,107,255,0.1)", borderColor: "rgba(124,107,255,0.18)" },
            { icon: <TrendingUp size={16} color="#4ecdc4" />, label: "View Full Report", sub: "Grades & performance", href: "/", color: "rgba(78,205,196,0.08)", borderColor: "rgba(78,205,196,0.15)" },
          ].map((item, i) => (
            <a key={i} href={item.href} style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "14px 18px", borderRadius: "12px",
              background: item.color, border: `1px solid ${item.borderColor}`,
              textDecoration: "none", transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e8e8f0", letterSpacing: "-0.01em" }}>{item.label}</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>{item.sub}</div>
              </div>
              <ArrowRight size={14} color="rgba(255,255,255,0.25)" />
            </a>
          ))}
        </div>
      </div>

      {/* Meeting Detail Modal */}
      <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
        <DialogContent style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", maxWidth: "420px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#e8e8f0", fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} color="#4ecdc4" /> Meeting Details
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
                  <div key={i} style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{item.label}</div>
                    <div style={{ fontSize: "0.84rem", color: "#e8e8f0", fontWeight: 500 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => { setShowEmail(true); setSelectedMeeting(null); }} style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "10px",
                background: "rgba(124,107,255,0.1)", border: "1px solid rgba(124,107,255,0.22)",
                color: "#a598ff", cursor: "pointer", fontSize: "0.84rem", fontWeight: 500, transition: "all 0.15s", justifyContent: "center",
              }}>
                <Mail size={14} /> Email This Teacher
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", maxWidth: "420px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#e8e8f0", fontSize: "1.1rem", fontWeight: 700 }}>{selectedEvent?.title}</DialogTitle>
            <DialogDescription style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ff6b9d", fontSize: "0.8rem" }}>
              <MapPin size={13} /> {selectedEvent?.location}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "4px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Date", value: new Date(selectedEvent.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) },
                  { label: "Time", value: new Date(selectedEvent.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) },
                ].map((item, i) => (
                  <div key={i} style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{item.label}</div>
                    <div style={{ fontSize: "0.84rem", color: "#e8e8f0", fontWeight: 500 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="section-label" style={{ marginBottom: "6px" }}>Description</div>
                <p style={{ color: "rgba(232,232,240,0.75)", fontSize: "0.84rem", lineHeight: 1.6, margin: 0 }}>{selectedEvent.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={showEmail} onOpenChange={o => { setShowEmail(o); if (!o) setEmailStatus("idle"); }}>
        <DialogContent style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", maxWidth: "440px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#e8e8f0", fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Mail size={18} color="#7c6bff" /> Compose Email
            </DialogTitle>
            <DialogDescription style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem" }}>
              Sends from nazimabc1@gmail.com
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "4px" }}>
            {[
              { label: "To (Teacher Email)", ph: "teacher@school.edu", val: emailTo, set: setEmailTo },
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
              <button onClick={() => setShowEmail(false)} style={{ padding: "9px 18px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(232,232,240,0.6)", cursor: "pointer", fontSize: "0.84rem" }}>
                Cancel
              </button>
              <button onClick={sendEmail} disabled={!emailTo || !emailSubj || !emailBody || emailStatus === "sending" || emailStatus === "sent"} className="btn-primary">
                {emailStatus === "sent" ? "✓ Sent!" : emailStatus === "sending" ? "Sending..." : "Send Email"}
              </button>
            </div>
            {emailStatus === "error" && <div style={{ fontSize: "0.78rem", color: "#ff6b9d", textAlign: "right" }}>Failed to send. Please try again.</div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
