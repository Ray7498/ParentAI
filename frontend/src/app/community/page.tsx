"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Send, MoreHorizontal, Heart, Share2, MessageCircle, ImageIcon, Sparkles, Calendar, Award, Plus, Smile, Loader2, X, Paperclip } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import Image from "next/image";

const API = "http://127.0.0.1:8000/api";
type Comment = { id: number; content: string; author: { id: number; name: string }; created_at: string };
type Post = { id: number; title: string; content: string; image_url?: string | null; file_url?: string | null; file_name?: string | null; file_type?: string | null; created_at: string; author: { id: number; name: string; role: string }; comments: Comment[] };

function PostCard({ post, currentUserId, targetLanguage, enableTranslation, isPinned, onTogglePin }: { post: Post; currentUserId: number, targetLanguage: string, enableTranslation: boolean, isPinned: boolean, onTogglePin: () => void }) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showMenu]);

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

  const { data: translatedContent, isFetching: isTranslating } = useQuery<{text: string, title: string}>({
    queryKey: ["translate", post.id, targetLanguage],
    queryFn: async () => {
      const resText = await axios.post(`${API}/community/translate`, { text: post.content, target_language: targetLanguage });
      let resTitle = null;
      if (post.title !== "Update") {
        const titlePost = await axios.post(`${API}/community/translate`, { text: post.title, target_language: targetLanguage });
        resTitle = titlePost.data.translated_text;
      }
      return { text: resText.data.translated_text, title: resTitle || "Update" };
    },
    enabled: enableTranslation && targetLanguage !== "English" && targetLanguage.trim() !== "",
    staleTime: Infinity, // Cache translation forever per language
  });

  const displayTitle = (enableTranslation && !showOriginal && targetLanguage !== "English" && translatedContent && post.title !== "Update") ? translatedContent.title : post.title;
  const displayContent = (enableTranslation && !showOriginal && targetLanguage !== "English" && translatedContent) ? translatedContent.text : post.content;

  const initials = post.author.name.charAt(0).toUpperCase();
  const colors = ["#7c6bff", "#4ecdc4", "#ff6b9d", "#ffd97d"];
  const color = colors[post.author.id % colors.length];

  return (
    <div
      className="glass-card animate-fade-up"
      style={{
        overflow: "hidden",
        borderRadius: "20px",
        border: isPinned ? "1.5px solid var(--primary-glow)" : "1px solid rgba(0,0,0,0.04)",
        boxShadow: isPinned ? "0 8px 24px rgba(124,107,255,0.12)" : "0 8px 24px rgba(0,0,0,0.03)",
        background: "var(--card)",
        marginBottom: "20px",
        breakInside: "avoid",
        position: "relative",
        order: isPinned ? -1 : 0,
      }}
    >
      {/* Pinned badge */}
      {isPinned && (
        <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", alignItems: "center", gap: "4px", background: "var(--primary)", color: "white", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", padding: "2px 8px", borderRadius: "100px", textTransform: "uppercase", zIndex: 2 }}>
          📌 Pinned
        </div>
      )}
      {/* Author Header */}
      <div style={{ padding: "20px 24px 14px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "100%", background: `${color}15`, border: `1px solid ${color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", fontWeight: 700, color, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--foreground)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{post.author.name}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", fontWeight: 500 }}>
            {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} • {post.author.role === "parent" ? "Parent" : "Staff"}
          </div>
        </div>
        <div ref={menuRef as React.RefObject<HTMLDivElement>} style={{ position: "relative" }}>
          <button
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: "4px", opacity: 0.6, borderRadius: "50%", transition: "background 0.2s" }}
            onClick={() => setShowMenu(m => !m)}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            <MoreHorizontal size={18} />
          </button>
          {showMenu && (
            <div
              style={{
                position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 100,
                background: "var(--card)", border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "14px", boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
                padding: "6px", minWidth: "200px", textAlign: "left"
              }}
              onMouseDown={e => e.stopPropagation()}
            >
              {/* Show Original / Translated */}
              <button
                onClick={() => { setShowOriginal(o => !o); setShowMenu(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "10px", width: "100%",
                  padding: "10px 14px", borderRadius: "10px", border: "none",
                  background: showOriginal ? "rgba(124,107,255,0.08)" : "none",
                  color: showOriginal ? "var(--primary)" : "var(--foreground)",
                  cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, textAlign: "left",
                  transition: "background 0.15s"
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.03)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = showOriginal ? "rgba(124,107,255,0.08)" : "none"}
              >
                <span style={{ fontSize: "1rem" }}>{showOriginal ? "🌐" : "📄"}</span>
                {showOriginal ? "Show Translated" : "Show in Original"}
              </button>
              {/* Pin / Unpin */}
              <button
                onClick={() => { onTogglePin(); setShowMenu(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "10px", width: "100%",
                  padding: "10px 14px", borderRadius: "10px", border: "none",
                  background: isPinned ? "rgba(255,107,157,0.08)" : "none",
                  color: isPinned ? "#ff6b9d" : "var(--foreground)",
                  cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, textAlign: "left",
                  transition: "background 0.15s"
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.03)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isPinned ? "rgba(255,107,157,0.08)" : "none"}
              >
                <span style={{ fontSize: "1rem" }}>📌</span>
                {isPinned ? "Unpin Post" : "Pin Post"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div style={{ padding: "0 24px 18px" }}>
        {post.title !== "Update" && (
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--foreground)", marginBottom: "8px", letterSpacing: "-0.01em", lineHeight: 1.3, display: "flex", alignItems: "center", gap: "8px" }}>
            {displayTitle} {isTranslating && <Loader2 size={14} className="animate-spin" style={{opacity: 0.5}} />}
          </div>
        )}
        <p style={{ fontSize: "0.95rem", color: "var(--foreground)", opacity: 0.85, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap", display: "flex", flexDirection: "column", gap: "4px" }}>
          {displayContent}
          {isTranslating && post.title === "Update" && <span style={{display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--primary)", opacity: 0.8}}><Loader2 size={12} className="animate-spin" /> Translating...</span>}
        </p>
      </div>

      {(post.image_url || post.file_url) && (
        <div style={{ padding: "0 16px 16px" }}>
           {post.file_url && (!post.file_type?.startsWith("image/")) ? (
             <a href={post.file_url} download target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "rgba(124,107,255,0.05)", border: "1px solid rgba(124,107,255,0.1)", borderRadius: "12px", textDecoration: "none", color: "var(--foreground)", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(124,107,255,0.1)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(124,107,255,0.05)"}>
               <div style={{ width: "36px", height: "36px", background: "rgba(124,107,255,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                 <Paperclip size={18} />
               </div>
               <div style={{ flex: 1, overflow: "hidden" }}>
                 <div style={{ fontSize: "0.9rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{post.file_name || "Attachment"}</div>
                 <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Click to view / download</div>
               </div>
             </a>
           ) : (
             <div style={{ width: "100%", height: "auto", position: "relative", borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.03)" }}>
                <img src={post.file_url || post.image_url || ""} alt="Community Media" style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }} />
             </div>
           )}
        </div>
      )}

      {/* Action Bar */}
      <div style={{ padding: "12px 20px", display: "flex", gap: "6px", borderTop: "1px solid rgba(0,0,0,0.03)", background: "rgba(0,0,0,0.01)" }}>
        <button onClick={() => setLiked(l => !l)} style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "8px 14px", borderRadius: "12px",
          background: liked ? "rgba(255,107,157,0.1)" : "transparent",
          border: "none", cursor: "pointer", color: liked ? "#ff6b9d" : "var(--muted-foreground)",
          fontSize: "0.85rem", fontWeight: 600, transition: "all 0.2s",
        }} onMouseEnter={(e) => !liked && (e.currentTarget.style.background = "rgba(0,0,0,0.03)")} onMouseLeave={(e) => !liked && (e.currentTarget.style.background = "transparent")}>
          <Heart size={16} style={{ fill: liked ? "#ff6b9d" : "none" }} /> {liked ? "Liked" : "Like"}
        </button>
        <button onClick={() => setCommentsOpen(v => !v)} style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "8px 14px", borderRadius: "12px",
          background: commentsOpen ? "rgba(124,107,255,0.08)" : "transparent",
          border: "none", cursor: "pointer", color: commentsOpen ? "var(--primary)" : "var(--muted-foreground)",
          fontSize: "0.85rem", fontWeight: 600, transition: "all 0.2s",
        }} onMouseEnter={(e) => !commentsOpen && (e.currentTarget.style.background = "rgba(0,0,0,0.03)")} onMouseLeave={(e) => !commentsOpen && (e.currentTarget.style.background = "transparent")}>
          <MessageCircle size={16} /> Comment
        </button>
        <div style={{ marginLeft: "auto" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "12px", background: "transparent", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: "0.85rem", fontWeight: 600, opacity: 0.8, transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.03)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>

      {/* Expanded Comments Section */}
      {commentsOpen && (
        <div className="animate-fade-up" style={{ padding: "0 20px 20px", background: "rgba(0,0,0,0.01)" }}>
          <div style={{ height: "1px", background: "rgba(0,0,0,0.03)", margin: "0 0 16px 0" }} />

          {comments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "10px 0 20px", fontSize: "0.85rem", color: "var(--muted-foreground)", opacity: 0.7 }}>
              No comments yet. Start the conversation!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: "flex", gap: "10px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "100%", background: "rgba(124,107,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#7c6bff", flexShrink: 0, marginTop: "2px" }}>
                    {c.author.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, background: "rgba(0,0,0,0.03)", borderRadius: "12px 12px 12px 4px", padding: "10px 14px", border: "1px solid rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "3px" }}>{c.author.name}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--foreground)", opacity: 0.9, lineHeight: 1.5 }}>{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment Input */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "100%", background: "var(--card)", border: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted-foreground)", flexShrink: 0, opacity: 0.7 }}>
              Me
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                placeholder={t("warm_reply")}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && commentText.trim() && addComment.mutate()}
                style={{ width: "100%", padding: "10px 42px 10px 16px", fontSize: "0.85rem", background: "var(--background)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "20px", color: "var(--foreground)", outline: "none", transition: "border-color 0.2s", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.02)" }}
                onFocus={(e) => e.target.style.borderColor = "var(--primary-glow)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(0,0,0,0.08)"}
              />
              <button
                onClick={() => addComment.mutate()}
                disabled={!commentText.trim() || addComment.isPending}
                style={{
                  position: "absolute", right: "6px", top: "6px",
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: commentText.trim() ? "var(--primary)" : "transparent",
                  border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: commentText.trim() ? "pointer" : "default",
                  transition: "all 0.2s"
                }}
              >
                <Send size={14} color={commentText.trim() ? "white" : "var(--muted-foreground)"} style={{ marginLeft: "-2px", opacity: commentText.trim() ? 1 : 0.5 }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Composer States
  const [newPost, setNewPost] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // New Feature States
  const [isRewriteLoading, setIsRewriteLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [eventData, setEventData] = useState<{ title: string, date: string, location: string } | null>(null);
  const [surveyOptions, setSurveyOptions] = useState<string[] | null>(null);

  // Translation States
  const [pinnedPostIds, setPinnedPostIds] = useState<Set<number>>(new Set());
  const [enableTranslation, setEnableTranslation] = useState(true);
  const [targetLanguage, setTargetLanguage] = useState("English");
  
  // Fetch user profile to get preferred language
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.app_user_id],
    queryFn: async () => {
      if (!user?.app_user_id) return { preferred_language: "English" };
      try {
        const d = (await axios.get(`${API}/profile/${user.app_user_id}`)).data;
        return { preferred_language: d.preferred_language || "English" };
      } catch (e) {
        return { preferred_language: "English" };
      }
    },
    enabled: !!user?.app_user_id
  });

  useEffect(() => {
    if (userProfile?.preferred_language) {
       setTargetLanguage(userProfile.preferred_language);
    }
  }, [userProfile?.preferred_language]);

  const example_images = [
    "/community/kids_crafts.png",
    "/community/school_bake_sale.png",
    "/community/playground_fun.png"
  ];

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["community-posts"],
    queryFn: async () => (await axios.get(`${API}/community/posts`)).data,
  });  const createPost = useMutation({
    mutationFn: async () => {
      let fileUrl = null;
      let fileName = null;
      let fileType = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await axios.post(`${API}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        fileUrl = uploadRes.data.file_url;
        fileName = uploadRes.data.file_name;
        fileType = uploadRes.data.file_type;
      }

      const payload = {
        title: "Update", 
        content: newPost + 
          (eventData ? `\n\n📅 Event: ${eventData.title}\n📍 Location: ${eventData.location}\n⏰ Date: ${eventData.date}` : "") + 
          (surveyOptions ? `\n\n📊 Poll:\n${surveyOptions.map(o => `- ${o}`).join('\n')}` : ""), 
        author_id: user?.app_user_id || 1,
        image_url: null,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType
      };
      
      const postPromise = axios.post(`${API}/community/posts`, payload);
      let eventPromise = Promise.resolve() as any;
      if (eventData && eventData.title && eventData.date) {
        let dateIso = new Date().toISOString();
        try { dateIso = new Date(eventData.date).toISOString(); } catch (e) { }
        eventPromise = axios.post(`${API}/events`, {
          title: eventData.title,
          description: "Community Event posted by a parent",
          date: dateIso,
          location: eventData.location || "TBD"
        });
      }
      await Promise.all([postPromise, eventPromise]);
      return postPromise;
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["community-posts"] }); 
      setNewPost(""); 
      setSelectedFile(null);
      setEventData(null);
      setSurveyOptions(null);
      setShowEmojiPicker(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeAttachment = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const emojis = ['😀', '😂', '🥰', '🙏', '👍', '🎉', '✨', '❤️', '👶', '🍼'];

  const displayName = user?.user_metadata?.full_name || "Parent";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="page-bg" style={{ padding: "36px 40px", maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 1, overflowY: "auto", height: "100%" }}>
      {/* Soft Header */}
      <div className="animate-fade-up" style={{ marginBottom: "36px", textAlign: "center", position: "relative" }}>
        {/* Soft background blob */}
        <div style={{ position: "absolute", top: "-20px", left: "50%", transform: "translateX(-50%)", width: "120px", height: "120px", background: "var(--primary)", filter: "blur(60px)", opacity: 0.15, borderRadius: "50%", zIndex: -1 }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <p className="section-label" style={{ margin: 0 }}>{t("theVillage")}</p>

            {/* Translation Toggle Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--card)", padding: "6px 12px", borderRadius: "100px", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }} onClick={() => setEnableTranslation(!enableTranslation)}>
                 <div style={{ width: "32px", height: "18px", background: enableTranslation ? "var(--primary)" : "rgba(0,0,0,0.1)", borderRadius: "100px", position: "relative", transition: "all 0.3s" }}>
                    <div style={{ width: "14px", height: "14px", background: "white", borderRadius: "50%", position: "absolute", top: "2px", left: enableTranslation ? "16px" : "2px", transition: "all 0.3s", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} />
                 </div>
                 <span style={{ fontSize: "0.8rem", fontWeight: 600, color: enableTranslation ? "var(--primary)" : "var(--muted-foreground)" }}>{t("translateBtn")}</span>
              </div>
              
              <div style={{ width: "1px", height: "14px", background: "rgba(0,0,0,0.1)" }} />
              
              <select 
                value={targetLanguage} 
                onChange={e => setTargetLanguage(e.target.value)}
                style={{ background: "none", border: "none", fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)", outline: "none", cursor: "pointer", appearance: "none", paddingRight: "16px", backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>')", backgroundRepeat: "no-repeat", backgroundPosition: "right center" }}
              >
                <option value="English">English</option>
                <option value="German">Deutsch (German)</option>
                <option value="French">Français (French)</option>
                <option value="Spanish">Español (Spanish)</option>
                <option value="Arabic">العربية (Arabic)</option>
                <option value="Turkish">Türkçe (Turkish)</option>
              </select>
            </div>
        </div>
        
        <h1 style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--foreground)", textShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          {t("parentH")} <span className="gradient-text">{t("communityH")}</span>
        </h1>
        <p style={{ color: "var(--muted-foreground)", marginTop: "10px", fontSize: "1rem", maxWidth: "420px", margin: "10px auto 0", lineHeight: 1.5 }}>
          {t("subH")}
        </p>
      </div>

      {/* New Post Composer - Lighter, more welcoming */}
      <div className="glass-card animate-fade-up delay-1" style={{ padding: "20px 24px", marginBottom: "36px", borderRadius: "24px", border: "1px solid rgba(0,0,0,0.04)", background: "var(--card)", boxShadow: "0 10px 30px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "100%", background: "linear-gradient(135deg, #7c6bff, #4ecdc4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", fontWeight: 700, color: "white", flexShrink: 0, boxShadow: "0 4px 12px rgba(124,107,255,0.2)" }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                borderBottom: newPost.trim() ? "1px solid var(--primary-glow)" : "1px solid rgba(0,0,0,0.05)",
                transition: "border-color 0.3s",
                paddingBottom: "8px",
                position: "relative"
              }}
            >
              {showEmojiPicker && (
                <div style={{ position: "absolute", bottom: "40px", right: "0", background: "var(--card)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "12px", padding: "8px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", zIndex: 10 }}>
                  {emojis.map(emoji => (
                    <button key={emoji} onClick={() => { setNewPost(p => p + emoji); setShowEmojiPicker(false); }} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", padding: "4px", borderRadius: "8px", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.04)"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                placeholder={`${t("placeholder")}, ${displayName.split(" ")[0]}...`}
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                rows={2}
                style={{
                  width: "100%", padding: "12px 40px 8px 12px", fontSize: "1rem", resize: "none",
                  background: "transparent", border: "none",
                  color: "var(--foreground)", outline: "none",
                  minHeight: "44px", lineHeight: 1.5
                }}
              />
              <button onClick={() => setShowEmojiPicker(p => !p)} style={{ position: "absolute", bottom: "8px", right: "0", background: showEmojiPicker ? "rgba(0,0,0,0.04)" : "none", border: "none", color: "var(--foreground)", opacity: showEmojiPicker ? 1 : 0.4, cursor: "pointer", display: "flex", alignItems: "center", padding: "4px", borderRadius: "8px", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "1"} onMouseLeave={(e) => !showEmojiPicker && (e.currentTarget.style.opacity = "0.4")}>
                <Smile size={20} />
              </button>
            </div>

            {selectedFile && (
              <div style={{ marginTop: "12px" }}>
                {selectedFile.type.startsWith("image/") ? (
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)", display: "flex", height: "80px" }}>
                      <img src={URL.createObjectURL(selectedFile)} alt="Preview" style={{ height: "100%", width: "auto", objectFit: "cover" }} />
                    </div>
                    <button 
                      onClick={() => removeAttachment()} 
                      style={{ position: "absolute", top: "-8px", right: "-8px", background: "var(--foreground)", color: "var(--background)", border: "none", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "14px", fontWeight: "bold", boxShadow: "0 2px 4px rgba(0,0,0,0.2)", transition: "transform 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", padding: "6px 12px", borderRadius: "16px", fontSize: "0.85rem", color: "var(--foreground)" }}>
                    <Paperclip size={14} style={{ opacity: 0.8 }} />
                    <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{selectedFile.name}</span>
                    <button onClick={() => removeAttachment()} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", marginLeft: "4px", opacity: 0.6, display: "flex", alignItems: "center" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "1"} onMouseLeave={(e) => e.currentTarget.style.opacity = "0.6"}>
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {eventData && (
              <div style={{ marginTop: "12px", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: "12px", padding: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)", display: "flex", alignItems: "center", gap: "6px" }}><Calendar size={14} color="var(--primary)" /> {t("schedule")}</span>
                  <button onClick={() => setEventData(null)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5 }}><X size={14} /></button>
                </div>
                <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                  <input type="text" placeholder={t("eventTitle")} value={eventData.title} onChange={e => setEventData({ ...eventData, title: e.target.value })} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", fontSize: "0.9rem", width: "100%" }} />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input type="date" value={eventData.date} onChange={e => setEventData({ ...eventData, date: e.target.value })} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", fontSize: "0.9rem", flex: 1 }} />
                    <input type="text" placeholder={t("location")} value={eventData.location} onChange={e => setEventData({ ...eventData, location: e.target.value })} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", fontSize: "0.9rem", flex: 1 }} />
                  </div>
                </div>
              </div>
            )}

            {surveyOptions && (
              <div style={{ marginTop: "12px", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: "12px", padding: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)", display: "flex", alignItems: "center", gap: "6px" }}><Award size={14} color="var(--primary)" /> {t("poll")}</span>
                  <button onClick={() => setSurveyOptions(null)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5 }}><X size={14} /></button>
                </div>
                <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                  {surveyOptions.map((opt, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "8px" }}>
                      <input type="text" placeholder={`${t("option")} ${idx + 1}`} value={opt} onChange={e => { const newOpts = [...surveyOptions]; newOpts[idx] = e.target.value; setSurveyOptions(newOpts); }} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", fontSize: "0.9rem", width: "100%" }} />
                      {surveyOptions.length > 2 && (
                        <button onClick={() => setSurveyOptions(surveyOptions.filter((_, i) => i !== idx))} style={{ background: "rgba(0,0,0,0.05)", border: "none", borderRadius: "8px", padding: "0 10px", cursor: "pointer" }}><X size={14} /></button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setSurveyOptions([...surveyOptions, ""])} style={{ alignSelf: "flex-start", marginTop: "4px", background: "none", border: "none", color: "var(--primary)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Plus size={14} /> {t("addOption")}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  style={{ display: 'none' }}
                  accept="image/*,audio/*,.pdf,.doc,.docx"
                />

                <button
                  onClick={async () => {
                    if (!newPost.trim()) return;
                    setIsRewriteLoading(true);
                    try {
                      const res = await axios.post(`${API}/community/rewrite`, { text: newPost });
                      setNewPost(res.data.rewritten_text);
                    } catch (e) {
                      console.error("Rewrite failed", e);
                    } finally {
                      setIsRewriteLoading(false);
                    }
                  }}
                  disabled={isRewriteLoading || !newPost.trim()}
                  style={{ display: "flex", alignItems: "center", gap: "8px", background: isRewriteLoading ? "rgba(0,0,0,0.02)" : "transparent", border: "1px solid rgba(0,0,0,0.15)", borderRadius: "20px", padding: "6px 14px", fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)", cursor: isRewriteLoading ? "wait" : "pointer", opacity: isRewriteLoading ? 0.7 : 1, transition: "all 0.2s" }}
                  onMouseEnter={(e) => { !isRewriteLoading && (e.currentTarget.style.background = "rgba(0,0,0,0.04)"); e.currentTarget.style.borderColor = "rgba(0,0,0,0.25)"; }}
                  onMouseLeave={(e) => { !isRewriteLoading && (e.currentTarget.style.background = "transparent"); e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)"; }}
                >
                  {isRewriteLoading ? <Loader2 size={16} className="animate-spin" color="#d97706" /> : <Sparkles size={16} color="#d97706" />}
                  {isRewriteLoading ? t("rewriting") : t("rewrite")}
                </button>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", display: "flex", alignItems: "center", transition: "color 0.2s", padding: 0 }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--foreground)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted-foreground)"}
                    title="Attach File or Media"
                  >
                    <Paperclip size={20} />
                  </button>

                  {/* Duplicate calendar removed */}

                  <button
                    onClick={() => setEventData(prev => prev ? null : { title: "", date: "", location: "" })}
                    style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", display: "flex", alignItems: "center", transition: "color 0.2s", padding: 0 }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--foreground)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted-foreground)"}
                    title="Schedule Event"
                  >
                    <Calendar size={20} />
                  </button>

                  <button
                    onClick={() => setSurveyOptions(prev => prev ? null : ["", ""])}
                    style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", display: "flex", alignItems: "center", transition: "color 0.2s", padding: 0 }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--foreground)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted-foreground)"}
                    title="Create Poll"
                  >
                    <Award size={22} />
                  </button>

                  {/* Removing duplicated plus button that does nothing */}
                </div>
              </div>

              <button
                onClick={() => createPost.mutate()}
                disabled={!newPost.trim() || createPost.isPending}
                className="btn-primary"
                style={{
                  padding: "8px 20px", borderRadius: "20px", fontSize: "0.9rem", fontWeight: 600,
                  opacity: (!newPost.trim() || createPost.isPending) ? 0.6 : 1,
                  transition: "all 0.2s",
                  boxShadow: newPost.trim() ? "0 4px 12px rgba(124,107,255,0.3)" : "none"
                }}
              >
                {createPost.isPending ? t("posting") : t("post")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Masonry Feed */}
      <div style={{ paddingBottom: "60px" }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[1, 2, 3].map(i => <div key={i} className="animate-shimmer" style={{ height: "180px", borderRadius: "20px", background: "var(--card)", border: "1px solid rgba(0,0,0,0.03)" }} />)}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 40px", background: "var(--card)", borderRadius: "24px", border: "1px dashed rgba(0,0,0,0.08)", boxShadow: "0 10px 30px rgba(0,0,0,0.02)" }}>
            <div style={{ width: "64px", height: "64px", background: "rgba(124,107,255,0.08)", color: "var(--primary)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <MessageCircle size={32} />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--foreground)", marginBottom: "8px" }}>{t("quiet")}</h3>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.95rem", lineHeight: 1.5, maxWidth: "300px", margin: "0 auto" }}>
              {t("beFirst")}
            </p>
          </div>
        ) : (
          <div
            style={{
              columnCount: window.innerWidth > 768 ? 2 : 1,
              columnGap: "20px",
              marginTop: "10px"
            }}
          /* A simple CSS resize listener could be used, but CSS media queries or React state generally handles this better in a real layout. Since this is injected inline React styles, a simple width check works on load, but in globals.css you may map this. For robustness, we fallback to 1 or 2 columns via CSS if possible, but the inline style suffices for pure structure now. */
          >
            {/* Adding inline CSS media query approach logic for safety on resize */}
            <style jsx>{`
              @media (max-width: 768px) {
                div[style*="columnCount"] {
                  column-count: 1 !important;
                }
              }
              @media (min-width: 1100px) {
                div[style*="columnCount"] {
                  column-count: 2 !important; 
                  /* Can set to 3 if user explicitly wanted it, but 2 feels best scaled */
                }
              }
            `}</style>

          {posts
            .slice()
            .sort((a, b) => {
              const aPinned = pinnedPostIds.has(a.id) ? -1 : 0;
              const bPinned = pinnedPostIds.has(b.id) ? -1 : 0;
              return aPinned - bPinned;
            })
            .map((p, i) => (
              <div key={p.id} style={{ animationDelay: `${i * 0.05}s` }}>
                <PostCard
                  post={p}
                  currentUserId={user?.app_user_id || 1}
                  targetLanguage={targetLanguage}
                  enableTranslation={enableTranslation}
                  isPinned={pinnedPostIds.has(p.id)}
                  onTogglePin={() => setPinnedPostIds(prev => {
                    const next = new Set(prev);
                    if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                    return next;
                  })}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
