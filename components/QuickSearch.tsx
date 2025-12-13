import React, { useState } from 'react';
import { useSettings } from '../hooks/useSettings';

interface QuickSearchProps {
    onSearch: (query: string) => void;
    isLoading: boolean;
}

const SearchIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
);

export const QuickSearch: React.FC<QuickSearchProps> = ({ onSearch, isLoading }) => {
    const { t } = useSettings();
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    return (
        <div className="mb-8">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                 <h1 className="text-4xl font-extrabold text-textDark">{t('quickSearch.title')}</h1>
            </div>
            <div className="glass-card p-6 md:p-8 rounded-3xl">
                <p className="text-textLight mb-6 text-center">
                    {t('quickSearch.subtitle')}
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col sm:flex-row items-stretch gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('quickSearch.marketPlaceholder')}
                            disabled={isLoading}
                            className="flex-grow w-full px-4 py-3 bg-white/20 text-textDark border border-transparent rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 disabled:bg-white/10"
                            required
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !query.trim()}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-lg font-extrabold rounded-xl hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-200 disabled:bg-primary/60 disabled:cursor-wait shadow-lg hover:shadow-primary/40"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    {t('quickSearch.loadingButton')}
                                </>
                            ) : (
                                <>
                                    <SearchIcon />
                                    {t('quickSearch.searchButton')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};