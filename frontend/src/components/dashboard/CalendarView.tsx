import { CalendarDays, X, ChevronRight } from "lucide-react";
import { Meeting, Event } from "@/lib/types";
import { useState } from "react";

interface CalendarViewProps {
  meetings: Meeting[];
  events: Event[];
  onSelectMeeting: (m: Meeting) => void;
  onSelectEvent: (e: Event) => void;
}

export function CalendarView({ meetings, events, onSelectMeeting, onSelectEvent }: CalendarViewProps) {
  const [calendarView, setCalendarView] = useState(new Date());

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
    const mtgs = meetings.filter((m: Meeting) => m.date.startsWith(dateStr));
    const evts = events.filter((e: Event) => e.date.startsWith(dateStr));
    return [...mtgs.map(m => ({ ...m, type: 'meeting' as const })), ...evts.map(e => ({ ...e, type: 'event' as const }))];
  };

  return (
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
                    onClick={() => item.type === 'meeting' ? onSelectMeeting(item as Meeting) : onSelectEvent(item as Event)}
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
  );
}
