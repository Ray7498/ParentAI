"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useSearchParams } from "next/navigation";
import { Send, MessageSquare } from "lucide-react";

const API = "http://127.0.0.1:8000/api";
type DM = { id: number; sender_id: number; recipient_id: number; content: string; is_read: number; created_at: string; sender: { id: number; name: string }; recipient: { id: number; name: string } };

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

  const { data: conversations = [] } = useQuery<DM[]>({
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

  const conversationPartners = conversations.reduce((acc: { id: number; name: string; lastMsg: DM }[], dm) => {
    const partnerId = dm.sender_id === userId ? dm.recipient_id : dm.sender_id;
    const partnerName = dm.sender_id === userId ? dm.recipient.name : dm.sender.name;
    if (!acc.find(c => c.id === partnerId)) acc.push({ id: partnerId, name: partnerName, lastMsg: dm });
    return acc;
  }, []);

  const hasNewPartner = withId && !conversationPartners.find(c => c.id === withId) && selectedPartner;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left — Conversations */}
      <div style={{ width: "280px", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <MessageSquare size={18} color="#7c6bff" />
            <h1 style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.03em", color: "#e8e8f0" }}>Messages</h1>
          </div>
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginTop: "3px" }}>
            Find parents via Profile → Search
          </p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
          {conversationPartners.length === 0 && !hasNewPartner && (
            <div style={{ padding: "20px 12px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "0.8rem", lineHeight: 1.6 }}>
              No conversations yet.<br />Search for a parent in your Profile to start chatting.
            </div>
          )}
          {hasNewPartner && (
            <ConvButton partner={selectedPartner!} active isNew lastMsg="Start a conversation…" onClick={() => setSelectedPartner(selectedPartner)} />
          )}
          {conversationPartners.map(p => (
            <ConvButton key={p.id} partner={p} active={selectedPartner?.id === p.id} lastMsg={p.lastMsg.content} onClick={() => setSelectedPartner({ id: p.id, name: p.name })} />
          ))}
        </div>
      </div>

      {/* Right — Thread */}
      {selectedPartner ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Thread header */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "10px" }}>
            <Avatar name={selectedPartner.name} size={34} />
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#e8e8f0" }}>{selectedPartner.name}</div>
              <div style={{ fontSize: "0.68rem", color: "#4ecdc4" }}>● Active</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {thread.length === 0 && (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "0.84rem", paddingTop: "32px" }}>
                No messages yet. Say hello! 👋
              </div>
            )}
            {thread.map(msg => {
              const isMe = msg.sender_id === userId;
              return (
                <div key={msg.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: "8px" }}>
                  {!isMe && <Avatar name={selectedPartner.name} size={28} />}
                  <div className={isMe ? "dm-me" : "dm-them"} style={{ maxWidth: "65%", fontSize: "0.875rem", lineHeight: 1.5 }}>
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
          <div style={{ padding: "14px 24px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <form onSubmit={e => { e.preventDefault(); if (messageInput.trim()) sendMutation.mutate(); }} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                placeholder={`Message ${selectedPartner.name}…`}
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                disabled={sendMutation.isPending}
                style={{ flex: 1, padding: "10px 16px", fontSize: "0.88rem" }}
              />
              <button type="submit" disabled={!messageInput.trim() || sendMutation.isPending} className="btn-primary" style={{ width: "40px", height: "40px", padding: 0, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
          <MessageSquare size={48} color="rgba(255,255,255,0.08)" />
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.88rem" }}>Select a conversation to start messaging</p>
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

function ConvButton({ partner, active, lastMsg, onClick, isNew }: { partner: { id: number; name: string }; active: boolean; lastMsg: string; onClick: () => void; isNew?: boolean }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", gap: "10px",
      padding: "10px 12px", borderRadius: "10px", border: "none", cursor: "pointer",
      background: active ? "rgba(124,107,255,0.1)" : "transparent",
      transition: "background 0.15s", textAlign: "left", marginBottom: "2px",
    }}
    onMouseEnter={e => !active && ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)")}
    onMouseLeave={e => !active && ((e.currentTarget as HTMLElement).style.background = "transparent")}
    >
      <Avatar name={partner.name} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: active ? "#a598ff" : "#e8e8f0" }}>{partner.name}</div>
        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isNew ? "New conversation" : lastMsg}</div>
      </div>
    </button>
  );
}

export default function MessagesPage() {
  return <Suspense><MessagesContent /></Suspense>;
}
