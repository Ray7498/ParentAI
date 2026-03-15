import { ExternalLink, BookOpen } from "lucide-react";
import { Link as SchoolLink } from "@/lib/types";
import { useLanguage } from "@/providers/language-provider";
import { useTranslateMany } from "@/lib/use-translate";

export function ResourcesCard({ links, onSelectLink }: { links: SchoolLink[], onSelectLink: (l: SchoolLink) => void }) {
  const { t } = useLanguage();
  const translated = useTranslateMany(links.map(l => l.title));
  return (
    <div className="glass-card animate-fade-up delay-5">
      <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
        <ExternalLink size={16} className="text-emerald" />
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--emerald)", letterSpacing: "0.02em" }}>SCHOOL RESOURCES</span>
      </div>
      <div style={{ padding: "10px" }}>
        {links.map(link => (
          <button key={link.id} onClick={() => onSelectLink(link)} style={{ 
            width: "100%", border: "none", background: "none", textAlign: "left",
            display: "flex", alignItems: "center", gap: "12px", padding: "10px",
            borderRadius: "10px", cursor: "pointer", transition: "background 0.2s"
          }} className="hover:bg-muted/50">
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "var(--emerald)", opacity: 0.1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--emerald)", flexShrink: 0 }}>
              <BookOpen size={14} />
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--foreground)" }}>{translated[link.title] || link.title}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--muted-foreground)" }}>{t("view_details")}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
