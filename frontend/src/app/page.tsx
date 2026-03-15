"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { Bell, Mail, X, Info, User } from "lucide-react";

import { Meeting, Event, Link as SchoolLink, Notification } from "@/lib/types";
import { useDashboardData, useDeleteMeeting } from "@/lib/hooks";

import { TimetableCard } from "@/components/dashboard/TimetableCard";
import { HomeworkCard } from "@/components/dashboard/HomeworkCard";
import { GradesCard } from "@/components/dashboard/GradesCard";
import { ResourcesCard } from "@/components/dashboard/ResourcesCard";
import { CalendarView } from "@/components/dashboard/CalendarView";

const API = "http://127.0.0.1:8000/api";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedLink, setSelectedLink] = useState<SchoolLink | null>(null);
  
  const [showEmail, setShowEmail] = useState(false);
  const [emailTo, setEmailTo] = useState(""); 
  const [emailSubj, setEmailSubj] = useState(""); 
  const [emailBody, setEmailBody] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");

  const { data, isLoading } = useDashboardData(user?.app_user_id);
  const deleteMeetingMutation = useDeleteMeeting();

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

  const displayName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  if (isLoading || !data) {
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
            {t("dashboard")}
          </h1>
          <p style={{ color: "var(--muted-foreground)", marginTop: "4px", fontSize: "0.85rem" }}>
            {t("welcome_back")}, {displayName}. {t("overview_today")}
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
            <Mail size={13} /> {t("contact_staff")}
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
            <Bell size={13} /> {notifications.length > 0 ? `${notifications.length} ${t("alerts")}` : t("inbox")}
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
          
          <TimetableCard timetable={data.timetable} />
          
          <HomeworkCard homework={data.homework} />

          {/* Right Column: Resources & Performance */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <GradesCard grades={data.grades} />
            <ResourcesCard links={data.links} onSelectLink={setSelectedLink} />
          </div>

        </div>

        {/* Full Width Calendar Row */}
        <CalendarView 
          meetings={data.meetings} 
          events={data.events} 
          onSelectMeeting={setSelectedMeeting} 
          onSelectEvent={setSelectedEvent} 
        />

      </div>

      {/* --- Modals (Kept inline since they require local state tightly coupled to user interactions) --- */}
      
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
                  onClick={() => {
                    deleteMeetingMutation.mutate(selectedMeeting.id, {
                      onSuccess: () => setSelectedMeeting(null)
                    });
                  }}
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

      <Dialog open={!!selectedLink} onOpenChange={() => setSelectedLink(null)}>
        <DialogContent style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", maxWidth: "480px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "var(--foreground)", fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem" }}>📎</span> {selectedLink?.title}
            </DialogTitle>
            <DialogDescription style={{ color: "var(--muted-foreground)", fontSize: "0.82rem", marginTop: "4px" }}>
              {t("school_resource_description")}
            </DialogDescription>
          </DialogHeader>
          {selectedLink && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "4px" }}>
              <div style={{ padding: "14px", background: "var(--input)", borderRadius: "12px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>URL</div>
                <div style={{ fontSize: "0.82rem", color: "var(--primary)", wordBreak: "break-all", fontFamily: "monospace" }}>{selectedLink.url}</div>
              </div>
              <a
                href={selectedLink.url}
                target="_blank"
                rel="noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "12px", background: "var(--primary)", color: "white", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem", transition: "opacity 0.2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
              >
                🔗 {t("open_resource")}
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={showEmail} onOpenChange={o => { setShowEmail(o); if (!o) setEmailStatus("idle"); }}>
        <DialogContent style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", maxWidth: "440px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "var(--foreground)", fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Mail size={18} className="text-violet" /> {t("compose_email")}
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "4px" }}>
            {[{ label: t("to"), val: emailTo, set: setEmailTo, ph: "teacher@school.edu" }, { label: t("subject"), val: emailSubj, set: setEmailSubj, ph: t("email_subject_ph") }].map(({ label, val, set, ph }) => (
              <div key={label}>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "5px" }}>{label}</div>
                <input value={val} onChange={e => set(e.target.value)} placeholder={ph}
                  style={{ width: "100%", padding: "9px 12px", fontSize: "0.84rem", background: "var(--background)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--foreground)", outline: "none" }}
                />
              </div>
            ))}
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "5px" }}>{t("message")}</div>
              <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder={t("email_body_ph")} rows={5}
                style={{ width: "100%", padding: "9px 12px", fontSize: "0.84rem", background: "var(--background)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--foreground)", outline: "none", resize: "vertical", fontFamily: "inherit" }}
              />
            </div>
            <button onClick={sendEmail} disabled={emailStatus === "sending" || !emailTo || !emailSubj || !emailBody} style={{ padding: "11px", borderRadius: "10px", background: emailStatus === "sent" ? "#4ecdc4" : "var(--primary)", color: "white", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem", transition: "opacity 0.2s, background 0.3s" }}>
              {emailStatus === "sending" ? t("working_on_it") : emailStatus === "sent" ? "✓ Sent!" : `✉️ ${t("send_email")}`}
            </button>
            {emailStatus === "error" && <p style={{ color: "var(--destructive)", fontSize: "0.78rem", textAlign: "center", margin: 0 }}>Failed to send email. Try again.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
