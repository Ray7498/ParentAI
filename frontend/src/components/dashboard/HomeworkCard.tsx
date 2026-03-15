import { CheckSquare, CheckCircle2, Square } from "lucide-react";
import { Homework } from "@/lib/types";
import { useToggleHomework } from "@/lib/hooks";
import { useLanguage } from "@/providers/language-provider";
import { useTranslateMany } from "@/lib/use-translate";

export function HomeworkCard({ homework }: { homework: Homework[] }) {
  const toggleHomeworkMutation = useToggleHomework();
  const { t } = useLanguage();
  const allStrings = homework.flatMap(h => [h.subject, h.description].filter(Boolean)) as string[];
  const translated = useTranslateMany(allStrings);

  return (
    <div className="glass-card animate-fade-up delay-2" style={{ height: "100%" }}>
      <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <CheckSquare size={16} className="text-teal" />
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--teal)", letterSpacing: "0.02em" }}>{t("homework_assignments").toUpperCase()}</span>
        </div>
        <span className="badge-scheduled" style={{ background: "var(--teal)", color: "white", border: "none" }}>
          {homework.filter(h => !h.is_completed).length} {t("pending")}
        </span>
      </div>
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {homework.length === 0 ? (
          <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", textAlign: "center", margin: "20px 0" }}>Enjoy your day! No homework pending.</p>
        ) : (
          homework.map(hw => (
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
                    {translated[hw.subject] || hw.subject}
                  </span>
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--rose)" }}>
                    {new Date(hw.due_date).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", margin: 0, lineHeight: 1.4 }}>{translated[hw.description] || hw.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
