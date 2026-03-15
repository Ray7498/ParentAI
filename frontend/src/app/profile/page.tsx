"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { Search, MessageSquare, Save, CheckCircle2, User2, Pencil } from "lucide-react";
import Link from "next/link";

const API = "http://127.0.0.1:8000/api";
type Profile = { id: number; user_id: number; profession: string | null; age: number | null; bio: string | null; preferred_language: string };
type UserPublic = { id: number; name: string; email: string; role: string };

const avatarColors = ["#7c6bff", "#4ecdc4", "#ff6b9d", "#ffd97d", "#a598ff"];
function getColor(seed: number) { return avatarColors[seed % avatarColors.length]; }

export default function ProfilePage() {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserPublic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profession, setProfession] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("English");

  const { data: profile } = useQuery<Profile>({
    queryKey: ["profile", user?.app_user_id],
    queryFn: async () => {
      const d = (await axios.get(`${API}/profile/${user?.app_user_id}`)).data;
      if (!profession) setProfession(d.profession || "");
      if (!age) setAge(d.age ? String(d.age) : "");
      if (!bio) setBio(d.bio || "");
      if (d.preferred_language) {
        setPreferredLanguage(d.preferred_language);
        setLanguage(d.preferred_language);
      }
      return d;
    },
    enabled: !!user?.app_user_id,
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      await axios.put(`${API}/profile/${user?.app_user_id}`, { profession, age: age ? parseInt(age) : null, bio, preferred_language: preferredLanguage });
    },
    onSuccess: () => {
      setLanguage(preferredLanguage); // Instantly apply the language change app-wide
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSaveStatus("saved");
      setEditing(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const { data } = await axios.get(`${API}/users/search/query`, { params: { q: searchQuery, exclude: user?.app_user_id } });
      setSearchResults(data);
    } catch {}
    setIsSearching(false);
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Parent";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="page-bg" style={{ padding: "32px 36px", maxWidth: "760px", margin: "0 auto", position: "relative", zIndex: 1, height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: "28px" }}>
        <p className="section-label" style={{ marginBottom: "6px" }}>Account</p>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.04em", color: "var(--foreground)" }}>
          My <span className="gradient-text">{t("profile")}</span>
        </h1>
      </div>

      {/* Profile card */}
      <div className="glass-card animate-fade-up delay-1" style={{ borderRadius: "16px", overflow: "hidden", marginBottom: "20px", background: "var(--card)", border: "1px solid var(--border)" }}>
        {/* Banner */}
        <div style={{ height: "90px", background: "linear-gradient(135deg, rgba(124,107,255,0.1) 0%, rgba(78,205,196,0.05) 100%)", position: "relative" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "200px", height: "200px", borderRadius: "100%", background: "radial-gradient(circle, rgba(124,107,255,0.1), transparent)", pointerEvents: "none" }} />
        </div>

        {/* Avatar + info */}
        <div style={{ padding: "0 24px 24px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "-28px", marginBottom: "16px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "100%", background: "linear-gradient(135deg, #7c6bff 0%, #4ecdc4 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 700, color: "white", border: "3px solid var(--background)", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              {initials}
            </div>
            <button onClick={() => setEditing(e => !e)} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "7px 14px", borderRadius: "8px", cursor: "pointer",
              background: editing ? "rgba(124,107,255,0.1)" : "var(--background)",
              border: `1px solid ${editing ? "var(--primary-glow)" : "var(--border)"}`,
              color: editing ? "var(--primary)" : "var(--muted-foreground)",
              fontSize: "0.78rem", fontWeight: 500, transition: "all 0.15s",
            }}>
              <Pencil size={12} /> {editing ? "Cancel" : t("edit_profile")}
            </button>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--foreground)", marginBottom: "2px" }}>{displayName}</h2>
            <p style={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>{user?.email}</p>
            <div style={{ marginTop: "8px" }}>
              <span style={{ padding: "3px 10px", borderRadius: "100px", background: "rgba(124,107,255,0.08)", border: "1px solid var(--primary-glow)", fontSize: "0.7rem", fontWeight: 600, color: "var(--primary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Parent
              </span>
            </div>
          </div>

          {/* Editable or display */}
          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Profession", ph: "e.g. Nurse, Engineer", val: profession, set: setProfession, type: "text" },
                  { label: "Age", ph: "e.g. 35", val: age, set: setAge, type: "number" },
                ].map((f, i) => (
                  <div key={i}>
                    <div className="section-label" style={{ marginBottom: "4px" }}>{f.label}</div>
                    <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ width: "100%", padding: "9px 12px", fontSize: "0.84rem", background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                  </div>
                ))}
              </div>
            <div>
                <div className="section-label" style={{ marginBottom: "4px" }}>{t("preferred_language")}</div>
                <select
                  value={preferredLanguage}
                  onChange={e => setPreferredLanguage(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", fontSize: "0.84rem", background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }}
                >
                  <option value="English">English</option>
                  <option value="German">Deutsch (German)</option>
                  <option value="French">Français (French)</option>
                  <option value="Spanish">Español (Spanish)</option>
                  <option value="Arabic">العربية (Arabic)</option>
                  <option value="Turkish">Türkçe (Turkish)</option>
                </select>
              </div>
              <div>
                <div className="section-label" style={{ marginBottom: "4px" }}>Bio</div>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell the community about yourself…" rows={3} style={{ width: "100%", padding: "9px 12px", fontSize: "0.84rem", resize: "none", background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => { setSaveStatus("saving"); updateProfile.mutate(); }} disabled={saveStatus === "saving"} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 20px" }}>
                  {saveStatus === "saved" ? <CheckCircle2 size={15} /> : <Save size={15} />}
                  {saveStatus === "saving" ? t("working_on_it") : saveStatus === "saved" ? "✓" : t("save_changes")}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              {[
                { label: "Profession", value: profession || "—" },
                { label: "Age", value: age || "—" },
                { label: "Language", value: preferredLanguage },
                { label: "School", value: "Lincoln Elementary" },
              ].map((item, i) => (
                <div key={i} style={{ padding: "12px", borderRadius: "10px", background: "var(--background)", border: "1px solid var(--border)", opacity: 0.8 }}>
                  <div className="section-label" style={{ marginBottom: "4px" }}>{item.label}</div>
                  <div style={{ fontSize: "0.88rem", color: "var(--foreground)", fontWeight: 500 }}>{item.value}</div>
                </div>
              ))}
              {bio && (
                <div style={{ gridColumn: "1 / -1", padding: "12px", borderRadius: "10px", background: "var(--background)", border: "1px solid var(--border)", opacity: 0.8 }}>
                  <div className="section-label" style={{ marginBottom: "4px" }}>Bio</div>
                  <p style={{ fontSize: "0.84rem", color: "var(--muted-foreground)", lineHeight: 1.6, margin: 0 }}>{bio}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Child info chip */}
      <div className="glass-card animate-fade-up delay-2" style={{ borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", background: "var(--card)", border: "1px solid var(--border)" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(78,205,196,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User2 size={15} color="#4ecdc4" />
        </div>
        <div>
          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--foreground)" }}>Child's School</div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Linked from school records · Visit Dashboard to see current grades</div>
        </div>
      </div>

      {/* User Search */}
      <div className="glass-card animate-fade-up delay-3" style={{ borderRadius: "16px", padding: "20px", background: "var(--card)", border: "1px solid var(--border)" }}>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--foreground)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Search size={16} color="var(--primary)" /> Find Other Parents
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Connect and start private conversations</div>
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          <input
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            style={{ flex: 1, padding: "9px 14px", fontSize: "0.84rem", background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
          <button onClick={handleSearch} disabled={isSearching} className="btn-primary" style={{ padding: "9px 18px", fontSize: "0.84rem" }}>
            {isSearching ? "…" : "Search"}
          </button>
        </div>

        {searchResults.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {searchResults.map(u => {
              const col = getColor(u.id);
              return (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", background: "var(--background)", border: "1px solid var(--border)" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "100%", background: `${col}15`, border: `1.5px solid ${col}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.88rem", fontWeight: 700, color: col, flexShrink: 0 }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--foreground)" }}>{u.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                  </div>
                  <Link href={`/messages?with=${u.id}&name=${encodeURIComponent(u.name)}`} style={{ textDecoration: "none" }}>
                    <button style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "7px 14px", borderRadius: "8px",
                      background: "rgba(124,107,255,0.1)", border: "1px solid var(--primary-glow)",
                      color: "var(--primary)", fontSize: "0.78rem", fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                    }}>
                      <MessageSquare size={12} /> Message
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : searchQuery && !isSearching ? (
          <div style={{ textAlign: "center", padding: "16px", color: "var(--muted-foreground)", fontSize: "0.82rem", opacity: 0.6 }}>
            No parents found for "{searchQuery}"
          </div>
        ) : null}
      </div>
    </div>
  );
}
