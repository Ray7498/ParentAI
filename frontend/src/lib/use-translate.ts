import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useLanguage } from "@/providers/language-provider";

const API = "http://127.0.0.1:8000/api";

/**
 * Translates a single string to the user's preferred language.
 * Returns the original text immediately if language is English.
 */
export function useTranslate(text: string | null | undefined): string {
  const { language } = useLanguage();

  const { data } = useQuery<string>({
    queryKey: ["translate-data", text, language],
    queryFn: async () => {
      const res = await axios.post(`${API}/community/translate`, {
        text,
        target_language: language,
      });
      return res.data.translated_text || text || "";
    },
    enabled: !!text && text.trim() !== "" && language !== "English",
    staleTime: Infinity,
  });

  return (language !== "English" && data) ? data : (text || "");
}

/**
 * Translates multiple strings in a SINGLE batch LLM call (much faster than N individual calls).
 * Returns a map from original text → translated text. Falls back to originals when English.
 */
export function useTranslateMany(texts: (string | null | undefined)[]): Record<string, string> {
  const { language } = useLanguage();
  // Deduplicate and filter empty strings
  const validTexts = [...new Set(texts.filter(Boolean) as string[])];

  const { data } = useQuery<Record<string, string>>({
    queryKey: ["translate-batch", validTexts.sort().join("|"), language],
    queryFn: async () => {
      const res = await axios.post(`${API}/community/batch-translate`, {
        texts: validTexts,
        target_language: language,
      });
      return res.data.translations as Record<string, string>;
    },
    enabled: validTexts.length > 0 && language !== "English",
    staleTime: Infinity, // Cache translations forever — they don't change
  });

  // When we have results, return them; otherwise identity map (show original)
  if (language !== "English" && data) return data;
  return Object.fromEntries(validTexts.map(t => [t, t]));
}
