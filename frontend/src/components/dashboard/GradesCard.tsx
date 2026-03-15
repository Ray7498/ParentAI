import { TrendingUp } from "lucide-react";
import { Grade } from "@/lib/types";
import { useLanguage } from "@/providers/language-provider";
import { useTranslateMany } from "@/lib/use-translate";

function getGradeClass(score: string) {
  const s = score.toUpperCase();
  if (s.startsWith("A")) return "grade-a";
  if (s.startsWith("B")) return "grade-b";
  if (s.startsWith("C")) return "grade-c";
  return "grade-d";
}

export function GradesCard({ grades }: { grades: Grade[] }) {
  const { t } = useLanguage();
  const translated = useTranslateMany(grades.map(g => g.subject));
  return (
    <div className="glass-card animate-fade-up delay-4">
      <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
        <TrendingUp size={16} className="text-violet" />
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--violet)", letterSpacing: "0.02em" }}>{t("academic_performance").toUpperCase()}</span>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {grades.map(g => (
            <div key={g.id} style={{ padding: "10px", background: "var(--input)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{translated[g.subject] || g.subject}</span>
              <span className={getGradeClass(g.score)} style={{ fontSize: "0.8rem", fontWeight: 700 }}>{g.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
