"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/providers/auth-provider";
import { translations } from "@/lib/translations";

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  isLoadingLanguage: boolean;
};

const LanguageContext = createContext<LanguageContextType>({
  language: "English",
  setLanguage: () => {},
  t: (key) => key,
  isLoadingLanguage: true,
});

export const useLanguage = () => useContext(LanguageContext);

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguage] = useState("English");
  const [isLoadingLanguage, setIsLoadingLanguage] = useState(true);

  useEffect(() => {
    async function fetchUserLanguage() {
      if (!user?.app_user_id) {
        setIsLoadingLanguage(false);
        return;
      }
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/profile/${user.app_user_id}`);
        if (res.data?.preferred_language) {
          setLanguage(res.data.preferred_language);
        }
      } catch (err) {
        console.error("Failed to load preferred language:", err);
      } finally {
        setIsLoadingLanguage(false);
      }
    }
    fetchUserLanguage();
  }, [user?.app_user_id]);

  const t = (key: string) => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    return translations["English"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoadingLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
