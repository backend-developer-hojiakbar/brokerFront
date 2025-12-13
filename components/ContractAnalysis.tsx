import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import type { ContractData, User, ContractAnalysis as ContractAnalysisType, AnalysisStatus } from '../types';
import { ErrorMessage } from './ErrorMessage';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../App';
import { ContractDetailsModal } from './ContractDetailsModal';

type ContractTab = 'new' | 'history';

const FileIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-textLight" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
);
const TrashIcon: React.FC<{ onClick: () => void, className?: string }> = ({ onClick, className }) => (
    <button type="button" onClick={onClick} className={`p-2 rounded-lg text-textLight hover:text-red-500 hover:bg-red-500/10 transition-colors ${className}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
);
const AnalyzeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.414l2.26-2.26A4 4 0 1011 5z" clipRule="evenodd" />
    </svg>
);

interface ContractAnalysisProps {
    contractAnalyses: ContractAnalysisType[];
    setContractAnalyses: (analyses: ContractAnalysisType[]) => void;
    onStartAnalyses: (files: File[]) => void;
}

export const ContractAnalysis: React.FC<ContractAnalysisProps> = ({ contractAnalyses, setContractAnalyses, onStartAnalyses }) => {
    const { t } = useSettings();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<ContractTab>('new');
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [viewingContract, setViewingContract] = useState<ContractData | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files!)]);
    };
    
    const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index));

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
        const items = event.clipboardData?.items; if (!items) return;
        const filesToAdd: File[] = [];
        for (let i = 0; i < items.length; i++) {
            const file = items[i].getAsFile();
            if (file) filesToAdd.push(file);
        }
        if (filesToAdd.length > 0) { event.preventDefault(); setFiles(prevFiles => [...prevFiles, ...filesToAdd]); }
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) { setError(t('contractAnalysis.fileUploadError')); return; }
        setError(null);
        onStartAnalyses(files);
        setFiles([]);
        setActiveTab('history');
    }, [files, onStartAnalyses, t]);
    
    const handleDeleteHistory = useCallback((id: string) => {
        if (window.confirm(t('history.deleteConfirm'))) {
            setContractAnalyses(contractAnalyses.filter(item => item.id !== id));
        }
    }, [t, contractAnalyses, setContractAnalyses]);

    const handleClearHistory = useCallback(() => {
         if (window.confirm(t('history.clearConfirm'))) { setContractAnalyses([]); }
    }, [t, setContractAnalyses]);

    const renderStatus = (status: AnalysisStatus, errorMsg: string | null) => {
        switch(status) {
            case 'pending':
                return <span className="text-gray-500 font-semibold">{t('contractHistory.statusPending')}</span>;
            case 'analyzing':
                return <span className="flex items-center text-blue-500 font-semibold"><svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> {t('contractHistory.statusAnalyzing')}</span>;
            case 'completed':
                return <span className="text-green-600 font-semibold">{t('contractHistory.statusCompleted')}</span>;
            case 'error':
                return <span className="text-red-500 font-semibold" title={errorMsg || ''}>{t('contractHistory.statusError')}</span>;
            default: return null;
        }
    };

    const TabButton: React.FC<{ tabId: ContractTab; label: string; count?: number }> = ({ tabId, label, count }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-3 font-bold transition-colors relative border-b-4 ${activeTab === tabId ? 'border-primary text-primary' : 'border-transparent text-textLight hover:text-textDark'}`}
        >
            {label}
            {count && count > 0 ? <span className="absolute -top-1 right-0 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{count}</span> : null}
        </button>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h1 className="text-4xl font-extrabold text-textDark">{t('tabs.contractAnalysis')}</h1>
            <div className="border-b border-border flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <TabButton tabId="new" label={t('tabs.newAnalysis')} />
                    <TabButton tabId="history" label={t('tabs.contractHistory')} count={contractAnalyses.length} />
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'new' && (
                        <div className="glass-card p-6 md:p-8 rounded-3xl">
                            <h2 className="text-3xl font-extrabold text-center mb-2 text-textDark">{t('tabs.contractAnalysis')}</h2>
                            <p className="text-textLight mb-6 text-center">{t('contractAnalysis.formSubtitle')}</p>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-lg font-bold text-textDark mb-2">{t('contractAnalysis.filesLabel')}</label>
                                    <div onPaste={handlePaste} tabIndex={0} className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center focus:outline-none focus:ring-2 focus:ring-primary bg-white/10 hover:border-white/40 transition-colors">
                                        <input type="file" multiple onChange={handleFileChange} id="contract-file-upload" className="hidden" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
                                        <label htmlFor="contract-file-upload" className="cursor-pointer text-primary font-bold hover:underline">{t('contractAnalysis.selectFilesButton')}</label>
                                        <p className="text-xs text-textLight mt-1">{t('contractAnalysis.fileTypesHint')}</p>
                                    </div>
                                    {files.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <h4 className="text-sm font-semibold text-textLight">{t('contractAnalysis.uploadedFilesLabel')}:</h4>
                                            {files.map((file, index) => (<div key={index} className="flex items-center justify-between p-2 bg-white/10 rounded-lg"><div className="flex items-center gap-2 text-sm text-textDark"><FileIcon /><span>{file.name}</span><span className="text-xs text-textLight">({(file.size / 1024).toFixed(1)} KB)</span></div><TrashIcon onClick={() => removeFile(index)} /></div>))}
                                        </div>
                                    )}
                                </div>
                                {error && <ErrorMessage message={error} /> }
                                <button type="submit" disabled={files.length === 0} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-lg font-extrabold rounded-xl hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-200 disabled:bg-primary/60 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/40"><AnalyzeIcon /> {t('contractAnalysis.analyzeButton')}</button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="glass-card p-4 md:p-6 rounded-3xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-textDark">{t('history.titleContract')}</h3>
                                {user?.role === 'admin' && contractAnalyses.length > 0 && (<button onClick={handleClearHistory} className="text-sm text-red-500 hover:underline">{t('history.clear')}</button>)}
                            </div>
                            <div className="overflow-x-auto">
                                {contractAnalyses.length > 0 ? (
                                    <table className="w-full text-sm text-left text-textDark">
                                        <thead className="text-xs text-textLight uppercase bg-white/10">
                                            <tr>
                                                <th scope="col" className="px-4 py-3">{t('contractHistory.tableName')}</th>
                                                <th scope="col" className="px-4 py-3">{t('contractHistory.tableStatus')}</th>
                                                <th scope="col" className="px-4 py-3">{t('contractHistory.tableNumber')}</th>
                                                <th scope="col" className="px-4 py-3">{t('contractHistory.tableCustomer')}</th>
                                                <th scope="col" className="px-4 py-3">{t('contractHistory.tableDate')}</th>
                                                <th scope="col" className="px-4 py-3 text-right">{t('history.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contractAnalyses.map(item => (
                                                <tr key={item.id} className="border-b border-white/10 hover:bg-white/10">
                                                    <td className="px-4 py-3 font-medium truncate max-w-xs">{item.file.name}</td>
                                                    <td className="px-4 py-3">{renderStatus(item.status, item.error)}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">{item.data?.contractNumber || '-'}</td>
                                                    <td className="px-4 py-3 truncate max-w-xs">{item.data?.parties?.customer || '-'}</td>
                                                    <td className="px-4 py-3">{format(new Date(item.analysisDate), 'dd.MM.yyyy')}</td>
                                                    <td className="px-4 py-3 flex items-center justify-end gap-2">
                                                        {item.status === 'completed' && item.data && <button onClick={() => setViewingContract(item.data)} className="font-medium text-primary hover:underline">{t('analysisCard.viewButton')}</button>}
                                                        {user?.role === 'admin' && <TrashIcon onClick={() => handleDeleteHistory(item.id)} />}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (<p className="text-center text-textLight py-6">{t('history.emptyContract')}</p>)}
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
            
            <ContractDetailsModal
                isOpen={!!viewingContract}
                onClose={() => setViewingContract(null)}
                data={viewingContract}
            />
        </motion.div>
    );
};