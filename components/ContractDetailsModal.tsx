import React from 'react';
import type { ContractData } from '../types';
import { useSettings } from '../hooks/useSettings';
import { motion, AnimatePresence } from 'framer-motion';

interface ContractDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ContractData | null;
}

const WarningIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
);
const CheckCircleIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
);
const LightbulbIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.657a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 14.95a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM4 10a1 1 0 01-1 1H2a1 1 0 110-2h1a1 1 0 011 1zM10 18a1 1 0 001-1v-1a1 1 0 10-2 0v1a1 1 0 001 1zM3.636 3.636a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM10 5a1 1 0 011 1v3h-2V6a1 1 0 011-1z" /><path d="M9 15a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM11 15a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1z" /></svg>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-extrabold text-textDark border-b-2 border-primary/50 pb-2 mb-4">{title}</h3>
        {children}
    </div>
);

const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode }> = ({ label, value }) => (
  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-white/10 last:border-b-0">
    <dt className="text-sm font-semibold text-textLight">{label}</dt>
    <dd className="mt-1 text-sm text-textDark sm:mt-0 sm:col-span-2 font-bold">{value || '-'}</dd>
  </div>
);

const ThemedBulletList: React.FC<{ items?: string[]; theme: 'warning' | 'critical' | 'success' | 'recommendation' | 'default' }> = ({ items, theme }) => {
    const { t } = useSettings();
    if (!items || items.length === 0) return <p className="text-textLight italic">{t('contractAnalysis.noInfo')}</p>;
    const themeClasses = {
        default: { bg: 'bg-secondary', border: 'border-border', text: 'text-textDark', icon: <CheckCircleIcon />, iconColor: 'text-textLight' },
        success: { bg: 'bg-green-500/10', border: 'border-green-400', text: 'text-green-800', icon: <CheckCircleIcon />, iconColor: 'text-green-500' },
        warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-400', text: 'text-yellow-800', icon: <WarningIcon />, iconColor: 'text-yellow-500' },
        critical: { bg: 'bg-red-500/10', border: 'border-red-400', text: 'text-red-800', icon: <WarningIcon />, iconColor: 'text-red-500' },
        recommendation: { bg: 'bg-blue-500/10', border: 'border-blue-400', text: 'text-blue-800', icon: <LightbulbIcon />, iconColor: 'text-blue-500' },
    };
    const currentTheme = themeClasses[theme];

    return (
        <ul className="space-y-3">
            {items.map((item, index) => (
                <li key={index} className={`flex ${currentTheme.bg} border-l-4 ${currentTheme.border} p-3 rounded-lg ${currentTheme.text}`}>
                    <span className={currentTheme.iconColor}>{currentTheme.icon}</span>
                    <span className="flex-1 font-medium">{item}</span>
                </li>
            ))}
        </ul>
    );
};


const ContractDetails: React.FC<{ data: ContractData }> = ({ data }) => {
    const { t } = useSettings();
    return (
        <div className="space-y-8">
            <Section title={t('contractAnalysis.summaryTitle')}><p className="text-textLight leading-relaxed">{data.summary}</p></Section>
            <Section title={t('contractAnalysis.risksTitle')}><ThemedBulletList items={data.complianceCheck?.notes} theme={data.complianceCheck?.status || 'warning'} /></Section>
            <Section title={t('contractAnalysis.recommendationsTitle')}><ThemedBulletList items={data.recommendations} theme="recommendation" /></Section>
            <Section title={t('contractAnalysis.mainInfoTitle')}><dl><DetailItem label={t('contractAnalysis.number')} value={data.contractNumber} /><DetailItem label={t('contractAnalysis.date')} value={data.contractDate} /><DetailItem label={t('contractAnalysis.customer')} value={data.parties?.customer} /><DetailItem label={t('contractAnalysis.supplier')} value={data.parties?.supplier} /><DetailItem label={t('contractAnalysis.subject')} value={data.subject} /><DetailItem label={t('contractAnalysis.totalValue')} value={data.totalValue} /></dl></Section>
            <Section title={t('contractAnalysis.paymentTerms')}><ThemedBulletList items={data.paymentTerms} theme="default" /></Section>
            <Section title={t('contractAnalysis.deliveryTerms')}><ThemedBulletList items={data.deliveryTerms} theme="default" /></Section>
            <Section title={t('contractAnalysis.penalties')}><ThemedBulletList items={data.penalties} theme="critical" /></Section>
            <Section title={t('contractAnalysis.otherTerms')}><dl><DetailItem label={t('contractAnalysis.warranty')} value={data.warranty} /><DetailItem label={t('contractAnalysis.forceMajeure')} value={data.forceMajeure} /><DetailItem label={t('contractAnalysis.governingLaw')} value={data.governingLaw} /></dl></Section>
        </div>
    );
};

export const ContractDetailsModal: React.FC<ContractDetailsModalProps> = ({ isOpen, onClose, data }) => {
    const { t } = useSettings();

    return (
        <AnimatePresence>
            {isOpen && data && (
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
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-card rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
                    >
                        <header className="flex justify-between items-center p-4 border-b border-white/20 flex-shrink-0">
                            <h3 className="text-lg font-bold text-textDark">{t('contractAnalysis.resultsTitle')}</h3>
                            <button onClick={onClose} className="text-textLight hover:text-textDark text-2xl font-bold leading-none p-1 rounded-full hover:bg-white/20 transition-colors">&times;</button>
                        </header>
                        <main className="p-6 overflow-y-auto flex-grow">
                            <ContractDetails data={data} />
                        </main>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};