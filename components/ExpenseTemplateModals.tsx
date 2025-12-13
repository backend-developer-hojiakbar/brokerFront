import React, { useState } from 'react';
import type { ExpenseTemplate } from '../types';
import { useSettings } from '../hooks/useSettings';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);


interface SaveTemplateModalProps extends ModalProps {
    onSave: (name: string) => void;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({ isOpen, onClose, onSave }) => {
    const { t } = useSettings();
    const [name, setName] = useState('');

    const handleSave = () => {
        onSave(name);
        setName('');
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
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-card rounded-2xl w-full max-w-md flex flex-col"
                        aria-modal="true" role="dialog"
                    >
                        <header className="flex justify-between items-center p-4 border-b border-white/20">
                            <h3 className="text-lg font-bold text-textDark">{t('templates.saveTitle')}</h3>
                            <button onClick={onClose} className="text-textLight hover:text-textDark text-2xl font-bold leading-none p-1 rounded-full hover:bg-white/20 transition-colors">&times;</button>
                        </header>
                        <main className="p-6">
                            <label htmlFor="template-name" className="block text-sm font-semibold text-textLight mb-2">{t('templates.nameLabel')}</label>
                            <input
                                id="template-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('templates.namePlaceholder')}
                                className="w-full px-3 py-2 bg-white/20 text-textDark border border-transparent rounded-lg"
                                autoFocus
                            />
                        </main>
                        <footer className="flex justify-end items-center p-4 border-t border-white/20 gap-3">
                            <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-textDark bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                                {t('common.cancel')}
                            </button>
                            <button onClick={handleSave} className="px-5 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">
                                {t('common.save')}
                            </button>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

interface ManageTemplatesModalProps extends ModalProps {
    templates: ExpenseTemplate[];
    onDelete: (id: string) => void;
}

export const ManageTemplatesModal: React.FC<ManageTemplatesModalProps> = ({ isOpen, onClose, templates, onDelete }) => {
    const { t } = useSettings();

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
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-card rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
                        aria-modal="true" role="dialog"
                    >
                        <header className="flex justify-between items-center p-4 border-b border-white/20 flex-shrink-0">
                            <h3 className="text-lg font-bold text-textDark">{t('templates.manageTitle')}</h3>
                            <button onClick={onClose} className="text-textLight hover:text-textDark text-2xl font-bold leading-none p-1 rounded-full hover:bg-white/20 transition-colors">&times;</button>
                        </header>
                        <main className="p-6 overflow-y-auto">
                            {templates.length > 0 ? (
                                <ul className="space-y-2">
                                    {templates.map(template => (
                                        <li key={template.id} className="flex justify-between items-center p-3 bg-white/10 rounded-xl border border-white/20">
                                            <span className="text-textDark font-semibold">{template.name}</span>
                                            <button onClick={() => onDelete(template.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-500/10 transition-colors" aria-label={t('templates.deleteAria', { templateName: template.name })}>
                                                <TrashIcon />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-textLight p-8">{t('templates.empty')}</p>
                            )}
                        </main>
                         <footer className="flex justify-end items-center p-4 border-t border-white/20 flex-shrink-0">
                             <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-textDark bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                                {t('common.close')}
                            </button>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};