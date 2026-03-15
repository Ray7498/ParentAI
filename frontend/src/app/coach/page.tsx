"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Send, Mic, Bot, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from "@/providers/language-provider";

type Message = { role: "user" | "assistant"; content: string };

const suggestions = [
  "How is my child doing in Math?",
  "What events are coming up this week?",
  "Can you schedule a meeting with Mr. Smith?",
  "Give me tips to help with homework",
];

export default function CoachPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    try {
      const r = await axios.post("http://127.0.0.1:8000/api/chat", {
        message: text,
        parent_id: user?.app_user_id || 1,
      });
      setMessages(prev => [...prev, { role: "assistant", content: r.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please ensure the backend is running with a valid GOOGLE_API_KEY." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) { setIsRecording(false); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported in this browser."); return; }
    setIsRecording(true);
    const rec = new SR();
    rec.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsRecording(false); };
    rec.onerror = rec.onend = () => setIsRecording(false);
    rec.start();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="page-bg" style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div style={{ padding: "24px 32px 20px", borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #7c6bff 0%, #6c5ce7 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(124,107,255,0.3)" }}>
            <Sparkles size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--foreground)", lineHeight: 1 }}>
              {t("ai_parent_coach")}
            </h1>
            <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "3px" }}>
              {t("powered_by")}
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "100%", background: "#4ecdc4", boxShadow: "0 0 8px rgba(78,205,196,0.8)" }} />
            <span style={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{t("online")}</span>
          </div>
        </div>
      </div>

      {/* Messages / Empty state */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
        {isEmpty ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "24px" }}>
            {/* Avatar */}
            <div style={{ width: "72px", height: "72px", borderRadius: "20px", background: "linear-gradient(135deg, rgba(124,107,255,0.1) 0%, rgba(78,205,196,0.05) 100%)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px rgba(124,107,255,0.1)" }}>
              <Bot size={36} color="#7c6bff" />
            </div>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--foreground)", marginBottom: "8px" }}>
                {t("how_can_i_help")}
              </h2>
              <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem", maxWidth: "380px", lineHeight: 1.6 }}>
                {t("coach_description")}
              </p>
            </div>
            {/* Suggestions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxWidth: "520px", width: "100%" }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)} style={{
                  padding: "12px 16px", borderRadius: "10px", textAlign: "left",
                  background: "var(--card)", border: "1px solid var(--border)",
                  color: "var(--foreground)", fontSize: "0.82rem", cursor: "pointer", lineHeight: 1.4,
                  transition: "all 0.15s ease", opacity: 0.8
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(124,107,255,0.08)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-glow)"; (e.currentTarget as HTMLElement).style.color = "var(--primary)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--card)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "720px", margin: "0 auto" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-end", gap: "10px" }}>
                {msg.role === "assistant" && (
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg, rgba(124,107,255,0.1), rgba(124,107,255,0.05))", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Bot size={15} color="#7c6bff" />
                  </div>
                )}
                <div className={msg.role === "user" ? "bubble-user" : "bubble-assistant"} style={{ maxWidth: "75%" }}>
                  {msg.role === "assistant" ? (
                    <div className="prose-chat">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(124,107,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={15} color="#7c6bff" />
                </div>
                <div className="bubble-assistant" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Loader2 size={14} color="#7c6bff" style={{ animation: "spin 1s linear infinite" }} />
                  <span style={{ color: "var(--muted-foreground)", fontSize: "0.82rem" }}>{t("thinking")}</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "16px 32px 24px", borderTop: "1px solid var(--border)", background: "var(--card)" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button type="button" onClick={toggleRecording} style={{
              width: "42px", height: "42px", borderRadius: "12px", border: "1px solid var(--border)",
              background: isRecording ? "rgba(255,107,157,0.1)" : "var(--background)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
            }}>
              <Mic size={16} color={isRecording ? "#ff6b9d" : "var(--muted-foreground)"} style={{ animation: isRecording ? "shimmer 1s ease infinite" : "none" }} />
            </button>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t("ask_placeholder")}
                disabled={isLoading}
                style={{ width: "100%", padding: "12px 16px", fontSize: "0.88rem", background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
            </div>
            <button type="submit" disabled={!input.trim() || isLoading} className="btn-primary" style={{ width: "42px", height: "42px", padding: 0, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Send size={16} />
            </button>
          </form>
          <p style={{ textAlign: "center", fontSize: "0.68rem", color: "var(--muted-foreground)", marginTop: "12px", opacity: 0.6 }}>
            {t("disclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
}
