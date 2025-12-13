import React from 'react';
import { useSettings } from '../hooks/useSettings';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  const { t } = useSettings();
  const loadingMessage = message || t('loader.message');

  return (
    <div className="flex flex-col items-center justify-center p-10 glass-card rounded-2xl">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
      <p className="mt-4 text-lg text-textLight">{loadingMessage}</p>
    </div>
  );
};