import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from '../hooks/useSettings';
import type { Theme, Language } from '../contexts/SettingsContext';
import { toast } from 'react-hot-toast';
import { sendTelegramMessage } from '../services/geminiService';

const THEMES: { id: Theme; name: string }[] = [
    { id: 'light', name: 'Oq' },
    { id: 'dark', name: 'Qora' },
];

const LANGUAGES: { id: Language; name: string }[] = [
    { id: 'uz-Latn', name: "O'zbekcha" },
    { id: 'uz-Cyrl', name: 'Ўзбекча' },
    { id: 'ru', name: 'Русский' },
    { id: 'en', name: 'English' },
];

export const Settings: React.FC = () => {
    const { theme, setTheme, language, setLanguage, t, isTelegramEnabled, setIsTelegramEnabled, telegramChatId, setTelegramChatId } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [localChatId, setLocalChatId] = useState(telegramChatId);

    useEffect(() => {
        setLocalChatId(telegramChatId);
    }, [telegramChatId]);


    const calculatePosition = useCallback(() => {
        if (buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const popoverHeight = 350; // Estimated height increased for new section
            const popoverWidth = 256; // w-64
            const margin = 8;

            const newStyle: React.CSSProperties = {
                position: 'fixed',
                zIndex: 50,
                width: `${popoverWidth}px`,
            };

            // Vertical positioning
            const spaceBelow = window.innerHeight - buttonRect.bottom;
            if (spaceBelow >= popoverHeight + margin) {
                newStyle.top = `${buttonRect.bottom + margin}px`;
            } else {
                newStyle.bottom = `${window.innerHeight - buttonRect.top + margin}px`;
            }

            // Horizontal positioning
            const spaceRight = window.innerWidth - buttonRect.right;
            if (spaceRight >= 0) {
                 newStyle.right = `${spaceRight}px`;
            } else {
                 newStyle.right = `${margin}px`;
            }
            
            // Prevent overflow on the left
            if (buttonRect.right < popoverWidth) {
                 newStyle.left = `${margin}px`;
                 newStyle.right = 'auto';
            }


            setPopoverStyle(newStyle);
        }
    }, []);

    const togglePopover = useCallback(() => {
        const nextIsOpen = !isOpen;
        if (nextIsOpen) {
            calculatePosition();
        }
        setIsOpen(nextIsOpen);
    }, [isOpen, calculatePosition]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Recalculate on window resize if open
    useEffect(() => {
        if (isOpen) {
            window.addEventListener('resize', calculatePosition);
            return () => window.removeEventListener('resize', calculatePosition);
        }
    }, [isOpen, calculatePosition]);
    
    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        toast.success("Til o'zgartirildi!");
    }
    
    const handleSetTheme = (th: Theme) => {
        setTheme(th);
        toast.success("Mavzu o'zgartirildi!");
    }

    const handleSaveChatId = () => {
        setTelegramChatId(localChatId);
        toast.success(t('settings.chatIdSaved'));
    };

    const handleTestTelegram = async () => {
        if (!localChatId.trim()) {
            toast.error(t('settings.telegramChatIdPlaceholder'));
            return;
        }
        const toastId = toast.loading('Yuborilmoqda...');
        try {
            await sendTelegramMessage(localChatId, t('settings.testMessageContent'));
            toast.success(t('settings.testMessageSent'), { id: toastId });
        } catch (error) {
            toast.error(t('settings.testMessageError'), { id: toastId });
            console.error("Telegram test failed:", error);
        }
    };


    return (
        <div>
            <button
                ref={buttonRef}
                onClick={togglePopover}
                className="p-2 rounded-lg transition-colors text-textLight hover:text-textDark hover:bg-white/20"
                title={t('settings.title')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            {isOpen && (
                <div
                    ref={popoverRef}
                    style={popoverStyle}
                    className="glass-card rounded-2xl animate-fade-in p-4"
                >
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-bold text-textLight mb-2">{t('settings.theme')}</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {THEMES.map((th) => (
                                    <button
                                        key={th.id}
                                        onClick={() => handleSetTheme(th.id)}
                                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                            theme === th.id
                                                ? 'bg-primary text-white font-bold shadow-lg'
                                                : 'bg-white/20 hover:bg-white/40 text-textDark'
                                        }`}
                                    >
                                        {th.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-textLight mb-2">{t('settings.language')}</h4>
                            <div className="space-y-1">
                                {LANGUAGES.map((lang) => (
                                     <button
                                        key={lang.id}
                                        onClick={() => handleSetLanguage(lang.id)}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                                            language === lang.id
                                                ? 'bg-primary/10 text-primary font-bold'
                                                : 'hover:bg-white/20 text-textDark'
                                        }`}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-white/20 pt-4 mt-4">
                            <h4 className="text-sm font-bold text-textLight mb-2">{t('settings.integrations')}</h4>
                            <div className="p-2 bg-white/10 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="telegram-toggle" className="font-semibold text-textDark text-sm cursor-pointer">{t('settings.telegram')}</label>
                                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input
                                            type="checkbox"
                                            name="telegram-toggle"
                                            id="telegram-toggle"
                                            checked={isTelegramEnabled}
                                            onChange={(e) => setIsTelegramEnabled(e.target.checked)}
                                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer peer"
                                        />
                                        <label htmlFor="telegram-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                                    </div>
                                    <style>{`.toggle-checkbox:checked { right: 0; border-color: rgb(var(--color-primary-default)); } .toggle-checkbox:checked + .toggle-label { background-color: rgb(var(--color-primary-default)); }`}</style>
                                </div>
                                {isTelegramEnabled && (
                                    <div className="mt-3 animate-fade-in">
                                        <label htmlFor="telegram-chat-id" className="block text-xs font-semibold text-textLight mb-1">{t('settings.telegramChatId')}</label>
                                        <div className="flex items-stretch gap-2">
                                            <input
                                                id="telegram-chat-id"
                                                type="text"
                                                value={localChatId}
                                                onChange={(e) => setLocalChatId(e.target.value)}
                                                placeholder={t('settings.telegramChatIdPlaceholder')}
                                                className="flex-grow w-full px-3 py-2 text-sm bg-white/20 text-textDark border border-transparent rounded-lg focus:ring-1 focus:ring-primary"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleTestTelegram}
                                                disabled={!localChatId.trim()}
                                                className="px-3 py-1 text-sm font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                                                title={t('settings.testTelegram')}
                                            >
                                                {t('settings.testTelegram')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSaveChatId}
                                                disabled={localChatId === telegramChatId}
                                                className="px-3 py-1 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 whitespace-nowrap"
                                            >
                                                {t('settings.saveChatId')}
                                            </button>
                                        </div>
                                        <p className="text-xs text-textLight mt-2 whitespace-pre-line">{t('settings.telegramInstructions')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};