import React from 'react';
import type { User } from '../types';
import { Settings } from './Settings';
import { useSettings } from '../hooks/useSettings';


const DocumentIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

interface HeaderProps {
    user: User | null;
    onLogout: () => void;
    onBuyTokens: () => void;
}


export const Header: React.FC<HeaderProps> = ({ user, onLogout, onBuyTokens }) => {
  const { t } = useSettings();
  return (
    <header className="sticky top-0 z-40 p-4">
      <div className="px-4 md:px-8 py-3 flex items-center justify-between glass-card rounded-2xl">
        <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
                <DocumentIcon />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-textDark">
              {t('main.title')}
            </h1>
        </div>
        {user && (
            <div className="flex items-center gap-2 sm:gap-4">
                 <Settings />
            </div>
        )}
      </div>
    </header>
  );
};