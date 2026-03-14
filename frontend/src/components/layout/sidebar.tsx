"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, MessageSquare, Users, GraduationCap, LogOut,
  UserCircle, Mail, Sparkles, Sun, Moon
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useTheme } from "next-themes";

const routes = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coach", label: "AI Coach", icon: Sparkles },
  { href: "/community", label: "Community", icon: Users },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/profile", label: "My Profile", icon: UserCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Parent";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        width: "240px",
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "0",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "-60px", left: "-60px",
        width: "200px", height: "200px",
        background: `radial-gradient(circle, ${theme === 'dark' ? 'rgba(124,107,255,0.08)' : 'rgba(124,107,255,0.05)'} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--sidebar-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px",
            background: "linear-gradient(135deg, #7c6bff 0%, #6c5ce7 100%)",
            borderRadius: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: theme === 'dark' ? "0 4px 12px rgba(124,107,255,0.35)" : "0 2px 8px rgba(124,107,255,0.2)",
          }}>
            <GraduationCap size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", letterSpacing: "-0.02em", color: "var(--sidebar-foreground)" }}>
              ParentMentor
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--muted-foreground)", letterSpacing: "0.05em", opacity: 0.7 }}>
              AI-POWERED
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px", position: "relative", zIndex: 1 }}>
        <div className="section-label" style={{ padding: "0 8px 8px" }}>Navigation</div>
        {routes.map((route) => {
          const isActive = pathname === route.href;
          const Icon = route.icon;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={isActive ? "nav-active" : "nav-inactive"}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 12px", borderRadius: "10px",
                fontSize: "0.845rem", fontWeight: isActive ? 600 : 400,
                textDecoration: "none", transition: "all 0.15s ease",
                letterSpacing: "-0.01em",
                border: isActive ? "1px solid var(--primary-glow)" : "1px solid transparent",
              }}
            >
              <Icon size={16} style={{ opacity: isActive ? 1 : 0.6 }} />
              {route.label}
              {isActive && (
                <div style={{
                  marginLeft: "auto", width: "6px", height: "6px",
                  borderRadius: "100%",
                  background: "var(--primary)",
                  boxShadow: "0 0 8px var(--primary-glow)",
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{
        padding: "16px 12px",
        borderTop: "1px solid var(--sidebar-border)",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Avatar + name */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "10px 12px", borderRadius: "10px",
          background: "var(--background)",
          border: "1px solid var(--sidebar-border)",
          marginBottom: "8px",
        }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "100%",
            background: "linear-gradient(135deg, #7c6bff, #4ecdc4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 700, color: "white",
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--sidebar-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayName}
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.7 }}>
              {user?.email}
            </div>
          </div>
        </div>
        
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 12px", borderRadius: "8px", width: "100%",
            background: "none", border: "none", cursor: "pointer",
            fontSize: "0.8rem", color: "var(--muted-foreground)",
            transition: "all 0.15s ease", textAlign: "left", marginBottom: "4px"
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--sidebar-foreground)";
            (e.currentTarget as HTMLElement).style.background = "var(--sidebar-accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
            (e.currentTarget as HTMLElement).style.background = "none";
          }}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 12px", borderRadius: "8px", width: "100%",
            background: "none", border: "none", cursor: "pointer",
            fontSize: "0.8rem", color: "var(--muted-foreground)",
            transition: "all 0.15s ease", textAlign: "left",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--destructive)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,107,157,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
            (e.currentTarget as HTMLElement).style.background = "none";
          }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );
}
