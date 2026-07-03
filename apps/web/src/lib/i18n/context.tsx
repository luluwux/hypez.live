"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";

export type Language = "en" | "tr" | "zh" | "hi" | "es" | "fr" | "ar" | "bn" | "ru" | "pt";

export interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>("en");

    // Load language from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("language") as Language | null;
        if (saved) {
            setLanguageState(saved);
        }
    }, []);

    // Save to localStorage when changed
    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("language", lang);

        // Set HTML dir attribute for RTL languages
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = lang;
    };

    const value = useMemo(() => ({ language, setLanguage }), [language]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguageContext() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguageContext must be used within LanguageProvider");
    }
    return context;
}
