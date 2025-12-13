import React, { useState, useEffect, useCallback } from 'react';
import { fetchPageContent } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../hooks/useSettings';
import { savePageBackup } from '../utils/pageDownloader';

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    onConfirmDownload: (htmlContent: string) => void;
}

const LoadingComponent: React.FC = () => {
  const { t } = useSettings();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary"></div>
      <p className="mt-4 text-lg text-textLight">{t('preview.loading')}</p>
      <p className="mt-2 text-sm text-textLight">{t('preview.loadingHint')}</p>
    </div>
  );
};

const ErrorComponent: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => {
  const { t } = useSettings();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-4 text-lg text-red-700">{t('errors.title')}</p>
        <pre className="mt-2 text-sm text-textLight max-w-md whitespace-pre-wrap text-left bg-red-500/10 p-2 rounded-md">{message}</pre>
        <div className="mt-4 text-sm text-textLight max-w-md text-center">
            <p className="mb-2">Agar "Access Denied" yoki "Error loading data" xatosini ko'rsangiz:</p>
            <ol className="list-decimal list-inside text-left space-y-1">
                <li>Sahifani brauzeringizda oching</li>
                <li>Ctrl+S tugmalarini bosib sahifani kompyuteringizga saqlang</li>
                <li>Shu faylni "Hujjatlarni yuklash" qismida tanlang</li>
            </ol>
        </div>
        <button onClick={onRetry} className="mt-4 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors">
            {t('preview.retry')}
        </button>
    </div>
  );
};

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, url, onConfirmDownload }) => {
    const { t } = useSettings();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [htmlContent, setHtmlContent] = useState<string | null>(null);

    const fetchAndSetContent = useCallback(async () => {
        if (!url) {
            setError(t('preview.noUrlError'));
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setHtmlContent(null);

        try {
            const html = await fetchPageContent(url);
            setHtmlContent(html);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [url, t]);


    useEffect(() => {
        if (isOpen) {
            fetchAndSetContent();
        }
    }, [isOpen, fetchAndSetContent]);


    const handleConfirm = () => {
        if (htmlContent) {
            onConfirmDownload(htmlContent);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 grid place-items-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-card rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col"
                        aria-modal="true" role="dialog"
                    >
                        <header className="flex justify-between items-center p-4 border-b border-white/20 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-textDark truncate pr-4">
                                {t('preview.title')}: <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{url}</a>
                            </h3>
                            <button onClick={onClose} className="text-textLight hover:text-textDark text-2xl font-bold p-1 rounded-full">&times;</button>
                        </header>
                        
                        <main className="flex-grow overflow-hidden bg-secondary relative">
                           {isLoading && <LoadingComponent />}
                           {error && !isLoading && <ErrorComponent message={error} onRetry={fetchAndSetContent} />}
                           {htmlContent && !isLoading && !error && (
                               <iframe
                                   srcDoc={htmlContent}
                                   title={t('preview.iframeTitle')}
                                   className="w-full h-full border-none bg-white"
                                   sandbox="allow-same-origin" // More restrictive sandbox for security
                               />
                           )}
                        </main>
                        
                        <footer className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-white/20 bg-secondary rounded-b-xl flex-shrink-0 gap-3">
                            <p className="text-xs text-textLight text-center sm:text-left">
                                {t('preview.footerNote')}
                            </p>
                            <div className="flex gap-3 ml-auto">
                                <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-textDark bg-white/20 rounded-md hover:bg-white/40 transition-colors">
                                    {t('common.close')}
                                </button>
                                {htmlContent && !isLoading && (
                                    <button
                                        onClick={() => savePageBackup(htmlContent, url)}
                                        className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                                    >
                                        {t('preview.downloadButton')}
                                    </button>
                                )}
                                <button
                                    onClick={handleConfirm}
                                    disabled={!htmlContent || isLoading}
                                    className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary-dark transition-colors disabled:bg-primary/60 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                   {t('preview.confirmButton')}
                                </button>
                            </div>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};