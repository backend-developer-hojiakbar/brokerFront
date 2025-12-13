import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../hooks/useSettings';
import { toast } from 'react-hot-toast';

export const Monitoring: React.FC = () => {
    const { t } = useSettings();
    const [keywords, setKeywords] = useState<string[]>([]);
    const [newKeyword, setNewKeyword] = useState('');

    useEffect(() => {
        const savedKeywords = localStorage.getItem('monitoring-keywords');
        if (savedKeywords) {
            setKeywords(JSON.parse(savedKeywords));
        }
    }, []);

    const saveKeywords = (newKeywords: string[]) => {
        setKeywords(newKeywords);
        localStorage.setItem('monitoring-keywords', JSON.stringify(newKeywords));
    };

    const handleAddKeyword = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedKeyword = newKeyword.trim();
        if (trimmedKeyword && !keywords.includes(trimmedKeyword)) {
            saveKeywords([...keywords, trimmedKeyword]);
            setNewKeyword('');
            toast.success(`'${trimmedKeyword}' so'zi qo'shildi.`);
        }
    };

    const handleRemoveKeyword = (keywordToRemove: string) => {
        saveKeywords(keywords.filter(kw => kw !== keywordToRemove));
        toast.error(`'${keywordToRemove}' so'zi o'chirildi.`);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h1 className="text-4xl font-extrabold text-textDark">{t('monitoring.title')}</h1>
            <p className="text-lg text-textLight">{t('monitoring.subtitle')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Keywords Management */}
                <div className="glass-card p-6 md:p-8 rounded-3xl">
                    <h2 className="text-2xl font-bold text-textDark mb-4">{t('monitoring.keywords.title')}</h2>
                    <form onSubmit={handleAddKeyword} className="flex items-stretch gap-2 mb-4">
                        <input
                            type="text"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            placeholder={t('monitoring.keywords.addPlaceholder')}
                            className="flex-grow w-full px-4 py-2 bg-white/20 text-textDark border border-transparent rounded-lg"
                        />
                        <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition">
                            {t('monitoring.keywords.addButton')}
                        </button>
                    </form>
                    <div className="flex flex-wrap gap-2">
                        {keywords.length > 0 ? (
                            keywords.map(kw => (
                                <span key={kw} className="flex items-center gap-2 bg-primary/10 text-primary font-semibold px-3 py-1.5 rounded-full text-sm">
                                    {kw}
                                    <button onClick={() => handleRemoveKeyword(kw)} className="text-primary hover:text-red-500">
                                        &times;
                                    </button>
                                </span>
                            ))
                        ) : (
                            <p className="text-textLight italic">{t('monitoring.keywords.empty')}</p>
                        )}
                    </div>
                </div>

                {/* Monitoring Results */}
                <div className="glass-card p-6 md:p-8 rounded-3xl">
                     <h2 className="text-2xl font-bold text-textDark mb-4">{t('monitoring.results.title')}</h2>
                     <div className="text-center p-8 bg-white/10 rounded-xl border border-dashed border-white/20">
                         <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLine