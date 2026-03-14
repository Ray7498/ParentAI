"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

// Extend User to allow custom sync'd user ID
export type AppUser = User & { app_user_id?: number };

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (mounted) {
        if (error) {
          console.error("Error getting session:", error.message);
        }
        setSession(session);
        if (session) {
          // Sync with backend to get the app_user_id mapping
          // Using try-catch to not break if backend is down immediately
          try {
            const res = await fetch("http://127.0.0.1:8000/api/auth/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: session.user.email,
                name: session.user.user_metadata?.full_name || "Parent User",
              })
            });
            if (res.ok) {
              const data = await res.json();
              setUser({ ...session.user, app_user_id: data.user_id });
            } else {
               setUser(session.user);
            }
          } catch (e) {
            setUser(session.user);
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
          try {
            const res = await fetch("http://127.0.0.1:8000/api/auth/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: session.user.email,
                name: session.user.user_metadata?.full_name || "Parent User",
              })
            });
            if (res.ok) {
              const data = await res.json();
              setUser({ ...session.user, app_user_id: data.user_id });
            } else {
               setUser(session.user);
            }
          } catch (e) {
            setUser(session.user);
          }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Protect routes
    if (!isLoading) {
      const publicRoutes = ['/login', '/register'];
      if (!user && !publicRoutes.includes(pathname)) {
        router.push('/login');
      } else if (user && publicRoutes.includes(pathname)) {
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
