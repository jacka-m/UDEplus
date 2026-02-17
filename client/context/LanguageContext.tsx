import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { Language } from "@/utils/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>("en");

  // Initialize language from user preference or localStorage
  useEffect(() => {
    if (user?.language) {
      setLanguageState(user.language as Language);
      localStorage.setItem("ude_language", user.language);
    } else {
      const saved = localStorage.getItem("ude_language");
      if (saved && ["en", "es", "fr", "pt", "zh"].includes(saved)) {
        setLanguageState(saved as Language);
      }
    }
  }, [user]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("ude_language", lang);
  };

  // Import translations dynamically to avoid circular imports
  const t = (key: string): string => {
    // Lazy load translations
    const { translations } = require("@/utils/translations");
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
