"use client";

import { useAuth } from "@/providers/auth-provider";
import { Sidebar } from "./sidebar";

export function SidebarWrapper() {
  const { user, isLoading } = useAuth();
  
  if (isLoading || !user) {
    return null; // Don't show sidebar when logged out or loading
  }

  return <Sidebar />;
}
