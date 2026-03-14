"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useSearchParams } from "next/navigation";
import { Send, MessageSquare } from "lucide-react";

type DM = { id: number; sender_id: number; recipient_id: number; content: string; is_read: number; created_at: string; sender: { id: number; name: string }; recipient: { id: number; name: string } };

type Conversation = {
  partner: { id: number; name: string };
  last_message: DM;
  unread_count: number;
};

const API = "http://127.0.0.1:8000/api";
const avatarColors = ["#7c6bff", "#4ecdc4", "#ff6b9d", "#ffd97d", "#a598ff"];

function MessagesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const withId = searchParams.get("with") ? parseInt(searchParams.get("with")!) : null;
  const withName = searchParams.get("name") || "User";
  const [selectedPartner, setSelectedPartner] = useState<{ id: number; name: string } | null>(
    withId ? { id: withId, name: withName } : null
  );
  const [messageInput, setMessageInput] = useState("");
  const userId = user?.app_user_id;

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["conversations", userId],
    queryFn: async () => (await axios.get(`${API}/messages/${userId}/conversations`)).data,
    enabled: !!userId, refetchInterval: 5000,
  });

  const { data: thread = [] } = useQuery<DM[]>({
    queryKey: ["thread", userId, selectedPartner?.id],
    queryFn: async () => (await axios.get(`${API}/messages/${userId}/thread/${selectedPartner?.id}`)).data,
    enabled: !!userId && !!selectedPartner, refetchInterval: 3000,
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`${API}/messages/send`, { sender_id: userId, recipient_id: selectedPartner!.id, content: messageInput.trim() });
    },
    onSuccess: () => { setMessageInput(""); queryClient.invalidateQueries({ queryKey: ["thread"] }); queryClient.invalidateQueries({ queryKey: ["conversations"] }); },
  });

  const hasNewPartner = withId && !conversations.find(c => c.partner.id === withId) && selectedPartner;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left — Conversations */}
      <div style={{ width: "300px", flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--card)" }}>
        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(124,107,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare size={16} color="#7c6bff" />
            </div>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--foreground)" }}>Messages</h1>
          </div>
          <p style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", marginTop: "3px" }}>
            Find parents via Profile → Search
          </p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
          {conversations.length === 0 && !hasNewPartner && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted-foreground)", fontSize: "0.82rem", lineHeight: 1.6 }}>
              No conversations yet.<br />Search for a parent to start chatting.
            </div>
          )}
          {hasNewPartner && (
            <ConvButton 
              partner={selectedPartner!} 
              active 
              isNew 
              lastMsg="Start a conversation…" 
              unreadCount={0}
              onClick={() => setSelectedPartner(selectedPartner)} 
            />
          )}
          {conversations.map(c => (
            <ConvButton 
              key={c.partner.id} 
              partner={c.partner} 
              active={selectedPartner?.id === c.partner.id} 
              lastMsg={c.last_message.content} 
              unreadCount={c.unread_count}
              onClick={() => setSelectedPartner({ id: c.partner.id, name: c.partner.name })} 
            />
          ))}
        </div>
      </div>

      {/* Right — Thread */}
      {selectedPartner ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--background)" }}>
          {/* Thread header */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px", background: "var(--card)" }}>
            <Avatar name={selectedPartner.name} size={36} />
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--foreground)" }}>{selectedPartner.name}</div>
              <div style={{ fontSize: "0.7rem", color: "#4ecdc4", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "100%", background: "#4ecdc4" }} />
                Online
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {thread.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--muted-foreground)", fontSize: "0.84rem", paddingTop: "32px" }}>
                No messages yet. Say hello! 👋
              </div>
            )}
            {thread.map(msg => {
              const isMe = msg.sender_id === userId;
              return (
                <div key={msg.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: "10px" }}>
                  {!isMe && <Avatar name={selectedPartner.name} size={28} />}
                  <div className={isMe ? "dm-me" : "dm-them"} style={{ 
                    maxWidth: "70%", 
                    fontSize: "0.88rem", 
                    lineHeight: 1.55,
                    position: "relative"
                  }}>
                    <div>{msg.content}</div>
                    <div style={{ fontSize: "0.65rem", marginTop: "4px", opacity: 0.5, textAlign: isMe ? "right" : "left" }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "16px 24px 24px", borderTop: "1px solid var(--border)", background: "var(--card)" }}>
            <form onSubmit={e => { e.preventDefault(); if (messageInput.trim()) sendMutation.mutate(); }} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                placeholder={`Message ${selectedPartner.name}…`}
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                disabled={sendMutation.isPending}
                style={{ flex: 1, padding: "12px 16px", fontSize: "0.9rem", borderRadius: "12px" }}
              />
              <button type="submit" disabled={!messageInput.trim() || sendMutation.isPending} className="btn-primary" style={{ width: "42px", height: "42px", padding: 0, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", background: "var(--background)" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
            <MessageSquare size={36} color="var(--muted-foreground)" style={{ opacity: 0.3 }} />
          </div>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem", fontWeight: 500 }}>Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  );
}

function Avatar({ name, size }: { name: string; size: number }) {
  const color = avatarColors[name.charCodeAt(0) % avatarColors.length];
  return (
    <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: "100%", background: `${color}22`, border: `1.5px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: `${size * 0.38}px`, fontWeight: 700, color, flexShrink: 0 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function ConvButton({ partner, active, lastMsg, onClick, isNew, unreadCount }: { partner: { id: number; name: string }; active: boolean; lastMsg: string; onClick: () => void; isNew?: boolean; unreadCount: number }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", gap: "12px",
      padding: "12px 14px", borderRadius: "12px", border: "none", cursor: "pointer",
      background: active ? "rgba(124,107,255,0.08)" : "transparent",
      transition: "all 0.2s ease", textAlign: "left", marginBottom: "4px",
      position: "relative"
    }}
    onMouseEnter={e => !active && ((e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.02)")}
    onMouseLeave={e => !active && ((e.currentTarget as HTMLElement).style.background = "transparent")}
    >
      <Avatar name={partner.name} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 700, color: active ? "var(--primary)" : "var(--foreground)" }}>{partner.name}</div>
          {!active && unreadCount > 0 && (
            <div style={{ 
              minWidth: "18px", height: "18px", borderRadius: "20px", background: "#ff4d4f", 
              color: "white", fontSize: "0.65rem", fontWeight: 700, display: "flex", 
              alignItems: "center", justifyContent: "center", padding: "0 5px",
              boxShadow: "0 2px 4px rgba(255,77,79,0.3)"
            }}>
              {unreadCount}
            </div>
          )}
        </div>
        <div style={{ fontSize: "0.75rem", color: unreadCount > 0 && !active ? "var(--foreground)" : "var(--muted-foreground)", fontWeight: unreadCount > 0 && !active ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {isNew ? "New conversation" : lastMsg}
        </div>
      </div>
    </button>
  );
}

export default function MessagesPage() {
  return <Suspense><MessagesContent /></Suspense>;
}
