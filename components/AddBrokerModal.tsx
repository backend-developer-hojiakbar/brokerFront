import React, { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { motion, AnimatePresence } from 'framer-motion';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string, username: string, password: string }) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onSave }) => {
    const { t } = useSettings();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSave = () => {
        if (name.trim() && username.trim() && password.trim()) {
            onSave({ name, username, password });
            setName('');
            setUsername('');
            setPassword('');
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
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-card rounded-2xl w-full max-w-md flex flex-col"
                        aria-modal="true" role="dialog"
                    >
                        <header className="flex justify-between items-center p-4 border-b border-white/20">
                            <h3 className="text-lg font-bold text-textDark">{t('users.addUserTitle')}</h3>
                            <button onClick={onClose} className="text-textLight hover:text-textDark text-2xl font-bold leading-none p-1 rounded-full hover:bg-white/20 transition-colors">&times;</button>
                        </header>
                        <main className="p-6 space-y-4">
                            <div>
                                <label htmlFor="broker-name" className="block text-sm font-semibold text-textLight mb-2">{t('users.nameLabel')}</label>
                                <input
                                    id="broker-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('users.addPlaceholder')}
                                    className="w-full px-3 py-2 bg-white/20 text-textDark border border-transparent rounded-lg focus:ring-primary focus:border-primary"
                                    autoFocus
                                />
                            </div>
                             <div>
                                <label htmlFor="broker-username" className="block text-sm font-semibold text-textLight mb-2">{t('users.usernameLabel')}</label>
                                <input
                                    id="broker-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder={t('users.usernamePlaceholder')}
                                    className="w-full px-3 py-2 bg-white/20 text-textDark border border-transparent rounded-lg focus:ring-primary focus:border-primary"
                                />
                            </div>
                             <div>
                                <label htmlFor="broker-password"  className="block text-sm font-semibold text-textLight mb-2">{t('users.passwordLabel')}</label>
                                <input
                                    id="broker-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('users.passwordPlaceholder')}
                                    className="w-full px-3 py-2 bg-white/20 text-textDark border border-transparent rounded-lg focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </main>
                        <footer className="flex justify-end items-center p-4 border-t border-white/20 gap-3">
                            <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-textDark bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                                {t('common.cancel')}
                            </button>
                            <button onClick={handleSave} disabled={!name.trim() || !username.trim() || !password.trim()} className="px-5 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:bg-primary/60">
                                {t('common.save')}
                            </button>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
