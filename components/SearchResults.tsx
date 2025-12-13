import React, { useMemo } from 'react';
import type { SerperSearchResult } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { useSettings } from '../hooks/useSettings';


const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '-';
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', minimumFractionDigits: 0 }).format(amount);
};

const MarketResultItem: React.FC<{ result: SerperSearchResult }> = ({ result }) => {
    const { t } = useSettings();
    return (
    <div className="p-4 border border-white/20 rounded-2xl transition-shadow hover:shadow-2xl bg-white/10">
        <h4 className="font-bold text-primary">{result.title}</h4>
        <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-sm text-accent break-all hover:underline">{result.link}</a>
        <p className="text-sm text-textLight mt-1">{result.snippet}</p>
        <div className="mt-3 text-right font-bold">
            {result.isLoadingPrice ? (
                 <span className="text-sm text-textLight animate-pulse flex items-center justify-end"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-textLight" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{t('priceSearch.loadingPrice')}</span>
            ) : result.foundPrice && result.foundPrice > 0 ? (
                <span className="text-xl text-green-700 bg-green-500/10 px-3 py-1 rounded-lg">{formatCurrency(result.foundPrice)}</span>
            ) : (
                <span className="text-sm text-red-500 bg-red-500/10 px-3 py-1 rounded-lg">{t('priceSearch.priceNotFound')}</span>
            )}
        </div>
    </div>
)};

interface SearchResultsProps {
    results: Record<string, SerperSearchResult[]>;
    isLoading: boolean;
    error: string | null;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, isLoading, error }) => {
    const { t } = useSettings();
    const REGION_NAMES: { [key: string]: string } = useMemo(() => ({
        'uz': "O'zbekiston", 'kz': 'Qozog‘iston', 'kg': 'Qirg‘iziston',
        'tj': 'Tojikiston', 'tm': 'Turkmaniston', 'cn': 'Xitoy'
    }), []);

    
    if (isLoading) return <div className="mt-8"><LoadingSpinner /></div>;
    if (error) return <div className="mt-8"><ErrorMessage message={error} /></div>;
    if (Object.keys(results).length === 0) return null;

    const uzbekistanResults = results['uz'] || [];
    const internationalResults = Object.entries(results).filter(([key]) => key !== 'uz' && results[key].length > 0);

    return (
        <div className="mt-8 animate-fade-in glass-card p-6 rounded-3xl">
            <h3 className="text-xl font-bold text-textDark border-b-2 border-primary/50 pb-2 mb-4">
                {t('searchResults.title')}
            </h3>
            <div className="space-y-4">
                {uzbekistanResults.length > 0 ? uzbekistanResults.map((result, index) => (
                    <MarketResultItem key={result.link + index + '-uz'} result={result} />
                )) : <p className="text-textLight italic text-center p-4">{t('priceSearch.noSources')}</p>}
            </div>

            {internationalResults.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/20">
                    <h4 className="text-lg font-bold text-textDark mb-3">{t('priceSearch.internationalMarketTitle')}</h4>
                    <div className="space-y-4">
                        {internationalResults.map(([region, regionResults]) => (
                            <div key={region}>
                                <h5 className="font-bold text-textLight mb-2 pl-1">{REGION_NAMES[region] || region}</h5>
                                <div className="space-y-2 border-l-2 border-white/20 pl-4">
                                    {Array.isArray(regionResults) && regionResults.map((result, index) => (
                                        <MarketResultItem key={`${result.link}-${region}-${index}`} result={result} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};