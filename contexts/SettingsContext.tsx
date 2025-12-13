import React, { createContext, useState, useEffect, useMemo } from 'react';
import { translations, t as translate } from '../utils/i18n';

export type Theme = 'light' | 'dark';
export type Language = 'uz-Latn' | 'uz-Cyrl' | 'ru' | 'en';

interface SettingsContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string, options?: Record<string, string | number>) => string;
    isTelegramEnabled: boolean;
    setIsTelegramEnabled: (enabled: boolean) => void;
    telegramChatId: string;
    setTelegramChatId: (chatId: string) => void;
}

export const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>('light');
    const [language, setLanguageState] = useState<Language>('uz-Latn');
    const [isTelegramEnabled, setIsTelegramEnabled] = useState<boolean>(false);
    const [telegramChatId, setTelegramChatId] = useState<string>('');

    useEffect(() => {
        const savedTheme = localStorage.getItem('app-theme') as Theme;
        const savedLang = localStorage.getItem('app-language') as Language;
        const savedTelegramEnabled = localStorage.getItem('app-telegram-enabled');
        const savedTelegramChatId = localStorage.getItem('app-telegram-chat-id');
        
        if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
            setThemeState(savedTheme);
        }

        if (savedLang && Object.keys(translations).includes(savedLang)) {
            setLanguageState(savedLang);
        }

        setIsTelegramEnabled(savedTelegramEnabled === 'true');
        if (savedTelegramChatId) {
            setTelegramChatId(savedTelegramChatId);
        }

    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        // Remove all possible theme classes for clean switching and backward compatibility
        root.classList.remove('theme-light', 'theme-dark', 'theme-mint', 'theme-slate');
        root.classList.add(`theme-${theme}`);
        localStorage.setItem('app-theme', theme);
    }, [theme]);
    
    useEffect(() => {
        localStorage.setItem('app-language', language);
    }, [language]);

    useEffect(() => {
        localStorage.setItem('app-telegram-enabled', String(isTelegramEnabled));
    }, [isTelegramEnabled]);

    useEffect(() => {
        localStorage.setItem('app-telegram-chat-id', telegramChatId);
    }, [telegramChatId]);


    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };
    
    const setLanguage = (newLanguage: Language) => {
        setLanguageState(newLanguage);
    };

    const t = useMemo(() => {
        return (key: string, options?: Record<string, string | number>): string => {
            return translate(language, key, options);
        };
    }, [language]);


    const value = {
        theme,
        setTheme,
        language,
        setLanguage,
        t,
        isTelegramEnabled,
        setIsTelegramEnabled,
        telegramChatId,
        setTelegramChatId,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};