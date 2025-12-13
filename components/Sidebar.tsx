import React from 'react';
import type { User } from '../types';
import { useSettings } from '../hooks/useSettings';
import { Settings } from './Settings';
import { useAuth } from '../App';

type Page = 'dashboard' | 'tender' | 'contract' | 'search' | 'users' | 'admin';

interface SidebarProps {
    page: Page;
    setPage: (page: Page) => void;
    user: User | null;
    onLogout: () => void;
    onBuyTokens: () => void;
    onNewAnalysis: () => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-center lg:justify-start w-full px-2 lg:px-4 py-2.5 text-left rounded-xl transition-all duration-200 ${
                isActive
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-textDark hover:bg-white/20'
            }`}
            title={label}
        >
            <span className={isActive ? 'text-white' : 'text-primary'}>{icon}</span>
            <span className="lg:ml-3 font-bold hidden lg:inline">{label}</span>
        </button>
    );
};


export const Sidebar: React.FC<SidebarProps> = ({ page, setPage, user, onLogout, onBuyTokens, onNewAnalysis }) => {
    const { t } = useSettings();
    const { getEffectiveTokens } = useAuth();
    const tokens = getEffectiveTokens();

    const navItems: { id: Page; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
         {
            id: 'dashboard',
            label: t('dashboard.title'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>,
        },
        {
            id: 'tender',
            label: t('tabs.tenderAnalysis'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        },
        {
            id: 'contract',
            label: t('tabs.contractAnalysis'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        },
        {
            id: 'search',
            label: t('tabs.search'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
        },
        {
            id: 'users',
            label: t('tabs.users'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
            adminOnly: true,
        },
        {
            id: 'admin',
            label: 'Admin',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
            adminOnly: true,
        },
    ];

    return (
        <aside className="fixed top-0 left-0 h-full w-20 lg:w-72 p-2 transition-all duration-300 z-30">
            <div className="glass-card rounded-3xl h-full w-full flex flex-col p-2 lg:p-3">
                 <div className="flex items-center justify-center lg:justify-start lg:space-x-3 p-2 mb-3 w-full">
                    <div className="p-2 bg-primary/10 rounded-lg">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <h1 className="text-2xl font-extrabold text-textDark hidden lg:block">{t('main.title')}</h1>
                </div>

                <button 
                    onClick={onNewAnalysis}
                    className="w-full mb-3 flex items-center justify-center lg:justify-start gap-2 px-3 py-3 text-sm font-extrabold text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors shadow-lg hover:shadow-primary/40"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    <span className="hidden lg:inline">{t('sidebar.newAnalysis')}</span>
                </button>
                
                <nav className="flex-grow space-y-1.5">
                    {navItems.map(item => {
                        if (item.adminOnly && user?.role !== 'admin') {
                            return null;
                        }
                        return (
                            <NavItem
                                key={item.id}
                                label={item.label}
                                icon={item.icon}
                                isActive={page === item.id}
                                onClick={() => setPage(item.id)}
                            />
                        )
                    })}
                </nav>

                <div className="mt-auto">
                    <div className="p-2 lg:p-3 bg-white/10 rounded-xl space-y-1.5 border border-white/20">
                        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-baseline" title="XT-Xarid tokenlari">
                            <span className="font-semibold text-textLight text-xs hidden lg:inline">XT-Xarid:</span>
                            <span className="font-extrabold text-textDark text-base">{tokens.xtTokens}</span>
                        </div>
                        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-baseline" title="Tender-UZEX tokenlari">
                            <span className="font-semibold text-textLight text-xs hidden lg:inline">Tender-UZEX:</span>
                            <span className="font-extrabold text-textDark text-base">{tokens.uzexTokens}</span>
                        </div>
                         <button onClick={onBuyTokens} className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                            <span className="hidden lg:inline">{t('header.buyTokens')}</span>
                        </button>
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between mt-3 gap-2 lg:p-2">
                        <span className="text-textDark font-bold hidden lg:block">{user?.name}</span>
                        <div className="flex items-center gap-1">
                            <Settings />
                            <button onClick={onLogout} className="p-2 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors" title={t('header.logout')}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
