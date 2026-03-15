import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import React from "react";
import { SidebarWrapper } from "@/components/layout/sidebar-wrapper";
import AuthProvider from "@/providers/auth-provider";
import QueryProvider from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import LanguageProvider from "@/providers/language-provider";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: ["400"], variable: "--font-dm-serif" });

export const metadata: Metadata = {
  title: "AI Parent Mentor",
  description: "Navigate the school system with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${dmSerif.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <QueryProvider>
            <AuthProvider>
              <LanguageProvider>
                <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
                  <div style={{ position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
                    <SidebarWrapper />
                  </div>
                  <main style={{ flex: 1, padding: "24px", minWidth: 0, overflowY: "auto", height: "100vh" }}>
                    {children}
                  </main>
                </div>
              </LanguageProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
