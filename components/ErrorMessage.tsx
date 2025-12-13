import React from 'react';
import { useSettings } from '../hooks/useSettings';

interface ErrorMessageProps {
  message: string;
}

const AlertIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);


export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  const { t } = useSettings();
  return (
    <div className="bg-red-500/20 border border-red-500/30 text-red-800 p-4 rounded-xl shadow-lg flex items-start space-x-3" role="alert">
      <AlertIcon />
      <div>
        <p className="font-bold text-textDark">{t('errors.title')}</p>
        <p className="text-textDark">{message}</p>
      </div>
    </div>
  );
};