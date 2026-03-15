import { CalendarDays } from "lucide-react";
import { Timetable } from "@/lib/types";
import { useLanguage } from "@/providers/language-provider";
import { useTranslateMany } from "@/lib/use-translate";

export function TimetableCard({ timetable }: { timetable: Timetable[] }) {
  const { t } = useLanguage();
  const allStrings = timetable.flatMap(s => [s.subject, s.teacher]);
  const translated = useTranslateMany(allStrings);
  return (
    <div className="glass-card animate-fade-up delay-1" style={{ overflow: "hidden", height: "100%" }}>
      <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", background: "var(--violet-dim)", display: "flex", alignItems: "center", gap: "10px" }}>
        <CalendarDays size={16} className="text-violet" />
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--violet)", letterSpacing: "0.02em" }}>{t("timetable").toUpperCase()}</span>
      </div>
      <div style={{ padding: "8px 0" }}>
        {timetable.length === 0 ? (
          <p style={{ padding: "20px", fontSize: "0.8rem", color: "var(--muted-foreground)", textAlign: "center" }}>No classes today.</p>
        ) : (
          timetable.map((slot, i) => (
            <div key={slot.id} style={{ 
              padding: "14px 20px", 
              borderBottom: i === timetable.length - 1 ? "none" : "1px solid var(--border)",
              display: "flex", gap: "16px", transition: "background 0.2s"
            }} className="hover:bg-muted/30">
              <div style={{ minWidth: "55px", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted-foreground)", paddingTop: "2px" }}>
                {slot.time}
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--foreground)" }}>{translated[slot.subject] || slot.subject}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "2px" }}>
                  {translated[slot.teacher] || slot.teacher} • Room {slot.room}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
