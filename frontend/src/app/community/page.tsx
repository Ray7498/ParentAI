"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { ChevronDown, ChevronUp, Send, MoreHorizontal, Heart, Share2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

const API = "http://127.0.0.1:8000/api";
type Comment = { id: number; content: string; author: { id: number; name: string }; created_at: string };
type Post = { id: number; title: string; content: string; created_at: string; author: { id: number; name: string; role: string }; comments: Comment[] };

function PostCard({ post, currentUserId }: { post: Post; currentUserId: number }) {
  const queryClient = useQueryClient();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["comments", post.id],
    queryFn: async () => (await axios.get(`${API}/community/posts/${post.id}/comments`)).data,
    enabled: commentsOpen,
  });

  const addComment = useMutation({
    mutationFn: async () => {
      await axios.post(`${API}/community/posts/${post.id}/comments`, { content: commentText.trim(), author_id: currentUserId });
    },
    onSuccess: () => { setCommentText(""); queryClient.invalidateQueries({ queryKey: ["comments", post.id] }); },
  });

  const initials = post.author.name.charAt(0).toUpperCase();
  const colors = ["#7c6bff", "#4ecdc4", "#ff6b9d", "#ffd97d"];
  const color = colors[post.author.id % colors.length];

  return (
    <div className="glass-card animate-fade-up" style={{ overflow: "hidden", borderRadius: "14px" }}>
      {/* Author */}
      <div style={{ padding: "18px 20px 14px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "38px", height: "38px", borderRadius: "100%", background: `${color}15`, border: `1.5px solid ${color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700, color, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--foreground)" }}>{post.author.name}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: "4px", opacity: 0.5 }}>
          <MoreHorizontal size={15} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "0 20px 16px" }}>
        {post.title !== "Update" && <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--foreground)", marginBottom: "6px", letterSpacing: "-0.02em" }}>{post.title}</div>}
        <p style={{ fontSize: "0.88rem", color: "var(--foreground)", opacity: 0.8, lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>{post.content}</p>
      </div>

      {/* Actions */}
      <div style={{ height: "1px", background: "var(--border)", margin: "0 20px", opacity: 0.5 }} />
      <div style={{ padding: "10px 16px", display: "flex", gap: "4px" }}>
        <button onClick={() => setLiked(l => !l)} style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "6px 12px", borderRadius: "8px",
          background: liked ? "rgba(255,107,157,0.1)" : "none",
          border: "none", cursor: "pointer", color: liked ? "#ff6b9d" : "var(--muted-foreground)",
          fontSize: "0.8rem", transition: "all 0.15s",
        }}>
          <Heart size={14} style={{ fill: liked ? "#ff6b9d" : "none" }} /> {liked ? "Liked" : "Like"}
        </button>
        <button onClick={() => setCommentsOpen(v => !v)} style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "6px 12px", borderRadius: "8px",
          background: commentsOpen ? "rgba(124,107,255,0.1)" : "none",
          border: "none", cursor: "pointer", color: commentsOpen ? "var(--primary)" : "var(--muted-foreground)",
          fontSize: "0.8rem", transition: "all 0.15s",
        }}>
          {commentsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Comment
        </button>
        <div style={{ marginLeft: "auto" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: "0.8rem", opacity: 0.6 }}>
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

      {/* Comments */}
      {commentsOpen && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "14px 20px 16px", background: "rgba(0,0,0,0.01)" }}>
          {comments.length === 0 ? (
            <div style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", marginBottom: "12px", opacity: 0.6 }}>No comments yet. Be the first!</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: "flex", gap: "10px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "100%", background: "rgba(124,107,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, color: "#7c6bff", flexShrink: 0 }}>
                    {c.author.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, background: "var(--background)", border: "1px solid var(--border)", borderRadius: "10px", padding: "8px 12px" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "2px" }}>{c.author.name}</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--muted-foreground)", lineHeight: 1.5 }}>{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Comment input */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "100%", background: "var(--background)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, color: "var(--muted-foreground)", flexShrink: 0, opacity: 0.5 }}>
              Me
            </div>
            <input
              placeholder="Write a comment…"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && commentText.trim() && addComment.mutate()}
              style={{ flex: 1, padding: "8px 12px", fontSize: "0.82rem", background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
            <button onClick={() => addComment.mutate()} disabled={!commentText.trim() || addComment.isPending} style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: "rgba(124,107,255,0.15)", border: "1px solid var(--primary-glow)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}>
              <Send size={13} color="var(--primary)" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState("");

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["community-posts"],
    queryFn: async () => (await axios.get(`${API}/community/posts`)).data,
  });

  const createPost = useMutation({
    mutationFn: async () => axios.post(`${API}/community/posts`, { title: "Update", content: newPost, author_id: user?.app_user_id || 1 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["community-posts"] }); setNewPost(""); },
  });

  const displayName = user?.user_metadata?.full_name || "Parent";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="page-bg" style={{ padding: "32px 36px", maxWidth: "760px", margin: "0 auto", position: "relative", zIndex: 1, overflowY: "auto", height: "100%" }}>
      <div className="animate-fade-up" style={{ marginBottom: "28px" }}>
        <p className="section-label" style={{ marginBottom: "6px" }}>Connect & Share</p>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.04em", color: "var(--foreground)" }}>
          Parent <span className="gradient-text">Community</span>
        </h1>
        <p style={{ color: "var(--muted-foreground)", marginTop: "6px", fontSize: "0.88rem" }}>
          Share experiences, ask questions, support other parents.
        </p>
      </div>

      {/* Compose */}
      <div className="glass-card animate-fade-up delay-1" style={{ padding: "18px 20px", marginBottom: "28px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--card)" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "100%", background: "linear-gradient(135deg, #7c6bff, #4ecdc4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "white", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <textarea
              placeholder={`What's on your mind, ${displayName.split(" ")[0]}?`}
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              rows={3}
              style={{ width: "100%", marginBottom: "10px", padding: "10px 14px", fontSize: "0.88rem", resize: "none", background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => createPost.mutate()} disabled={!newPost.trim() || createPost.isPending} className="btn-primary" style={{ padding: "8px 20px" }}>
                {createPost.isPending ? "Posting…" : "Post to Community"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div style={{ paddingBottom: "40px" }}>
        <div className="section-label" style={{ marginBottom: "14px" }}>Recent Discussions</div>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[1,2,3].map(i => <div key={i} className="animate-shimmer" style={{ height: "120px", borderRadius: "14px", background: "var(--card)", border: "1px solid var(--border)" }} />)}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: "var(--muted-foreground)", fontSize: "0.88rem", opacity: 0.5 }}>
            No posts yet. Be the first to start a discussion!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {posts.map(p => <PostCard key={p.id} post={p} currentUserId={user?.app_user_id || 1} />)}
          </div>
        )}
      </div>
    </div>
  );
}
