import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../hooks/useSettings';
import { toast } from 'react-hot-toast';
import { tokenApi } from '../services/apiService';
import { useAuth } from '../App';

interface BuyTokensModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const BuyTokensModal: React.FC<BuyTokensModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [platform, setPlatform] = useState<'xt' | 'uzex'>('xt');
    const [quantity, setQuantity] = useState('100');
    const [error, setError] = useState('');
    const [receipt, setReceipt] = useState<File | null>(null);
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { t } = useSettings();
    const { user } = useAuth();

    const price = (Number(quantity) || 0) * 10000;

    const handleNext = () => {
        if (Number(quantity) < 100) {
            setError(t('purchase.minTokensError'));
            return;
        }
        setError('');
        setStep(2);
    };

    const handleConfirm = () => {
        if (!receipt || !fullName || !phoneNumber) {
            toast.error(t('purchase.fillAllFieldsError'));
            return;
        }
        setStep(3);
    };

    const handleCopy = () => {
        const cardNumber = '8600123456789012';
        navigator.clipboard.writeText(cardNumber).then(() => {
            toast.success(t('purchase.copiedTooltip'));
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            toast.error("Nusxalashda xatolik yuz berdi");
        });
    };

    const handlePurchase = async () => {
        if (!user) return;
        
        try {
            setIsProcessing(true);
            // Call the backend API to purchase tokens with receipt
            const response = await tokenApi.purchase(platform, parseInt(quantity), receipt);
            
            // Show success message
            toast.success(t('purchase.successTitle'));
            
            // Call onSuccess callback to update user tokens
            onSuccess();
            
            // Close the modal after a short delay
            setTimeout(() => {
                onClose();
                // Reset form
                setStep(1);
                setPlatform('xt');
                setQuantity('100');
                setError('');
                setReceipt(null);
                setFullName('');
                setPhoneNumber('');
                setIsProcessing(false);
            }, 2000);
        } catch (error: any) {
            console.error('Failed to purchase tokens:', error);
            toast.error(error.message || t('errors.unknown'));
            setIsProcessing(false);
        }
    };

    const StepIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => (
        <div className="flex justify-center items-center w-full max-w-sm mx-auto mb-8">
            <div className="flex flex-col items-center relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${currentStep >= 1 ? 'bg-primary text-white shadow-lg' : 'bg-white/30 text-textDark'}`}>1</div>
                <p className={`text-xs mt-2 font-bold ${currentStep >= 1 ? 'text-textDark' : 'text-textLight'}`}>{t('purchase.step1')}</p>
            </div>
            <div className={`flex-grow h-1 mx-2 transition-colors ${currentStep >= 2 ? 'bg-primary' : 'bg-white/20'}`}></div>
            <div className="flex flex-col items-center relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${currentStep >= 2 ? 'bg-primary text-white shadow-lg' : 'bg-white/30 text-textDark'}`}>2</div>
                <p className={`text-xs mt-2 font-bold ${currentStep >= 2 ? 'text-textDark' : 'text-textLight'}`}>{t('purchase.step2')}</p>
            </div>
            <div className={`flex-grow h-1 mx-2 transition-colors ${currentStep >= 3 ? 'bg-primary' : 'bg-white/20'}`}></div>
            <div className="flex flex-col items-center relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${currentStep >= 3 ? 'bg-primary text-white shadow-lg' : 'bg-white/30 text-textDark'}`}>3</div>
                <p className={`text-xs mt-2 font-bold ${currentStep >= 3 ? 'text-textDark' : 'text-textLight'}`}>{t('purchase.step3')}</p>
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="w-full max-w-2xl glass-card rounded-3xl p-6 md:p-10 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-extrabold text-textDark">{t('header.buyTokens')}</h2>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-white/20 text-textDark transition-colors"
                                aria-label={t('common.close')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <StepIndicator currentStep={step} />

                        {step === 1 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-textLight mb-2">{t('purchase.selectPlatformLabel')}</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setPlatform('xt')} 
                                            className={`p-4 rounded-xl border-2 text-center transition-all duration-300 ${platform === 'xt' ? 'border-primary bg-primary/10 font-bold shadow-lg' : 'border-transparent bg-white/20 hover:bg-white/40'}`}
                                        >
                                            XT-Xarid
                                        </button>
                                        <button 
                                            onClick={() => setPlatform('uzex')} 
                                            className={`p-4 rounded-xl border-2 text-center transition-all duration-300 ${platform === 'uzex' ? 'border-primary bg-primary/10 font-bold shadow-lg' : 'border-transparent bg-white/20 hover:bg-white/40'}`}
                                        >
                                            Tender-UZEX
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="token-quantity" className="block text-sm font-semibold text-textLight mb-2">{t('purchase.tokenQuantityLabel')}</label>
                                    <input 
                                        id="token-quantity" 
                                        type="number" 
                                        value={quantity} 
                                        onChange={e => setQuantity(e.target.value)} 
                                        onBlur={() => { if (Number(quantity) < 100) setQuantity('100'); }}
                                        min="100" 
                                        className="w-full p-3 bg-white/20 text-textDark border border-transparent rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition" 
                                    />
                                    {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
                                </div>
                                <div className="p-4 bg-white/10 rounded-xl text-center border border-white/20">
                                    <p className="text-sm text-textLight">{t('purchase.totalPriceLabel')}</p>
                                    <p className="text-3xl font-extrabold text-primary">{price.toLocaleString('uz-UZ')} {t('purchase.currency')}</p>
                                </div>
                                <button 
                                    onClick={handleNext} 
                                    className="w-full py-3 bg-primary text-white font-extrabold rounded-xl hover:bg-primary-dark transition shadow-lg hover:shadow-primary/40"
                                >
                                    {t('purchase.nextButton')}
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <h3 className="font-bold text-xl text-textDark text-center">{t('purchase.paymentTitle')}</h3>
                                <p className="text-center text-textLight font-medium">
                                    {t('purchase.paymentInstruction')} <strong>{price.toLocaleString('uz-UZ')} {t('purchase.currency')}</strong>
                                </p>
                                <div className="p-3 bg-white/20 rounded-xl border border-white/20 flex items-center justify-between gap-4">
                                    <span className="font-mono text-lg sm:text-xl tracking-widest text-textDark">8600 1234 5678 9012</span>
                                    <button 
                                        onClick={handleCopy} 
                                        className="p-2 rounded-lg hover:bg-white/30 text-textDark" 
                                        aria-label={t('purchase.copyAriaLabel')} 
                                        title={t('purchase.copyAriaLabel')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                                            <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-center text-textLight text-sm">To'ychiyev Nurbek</p>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-textLight mb-2">{t('purchase.fullNameLabel')}</label>
                                    <input 
                                        type="text" 
                                        value={fullName} 
                                        onChange={(e) => setFullName(e.target.value)} 
                                        placeholder={t('purchase.fullNamePlaceholder')} 
                                        className="w-full p-3 bg-white/20 text-textDark border border-transparent rounded-xl" 
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-textLight mb-2">{t('purchase.phoneLabel')}</label>
                                    <input 
                                        type="tel" 
                                        value={phoneNumber} 
                                        onChange={(e) => setPhoneNumber(e.target.value)} 
                                        placeholder="+998 XX XXX XX XX" 
                                        className="w-full p-3 bg-white/20 text-textDark border border-transparent rounded-xl" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-textLight mb-2">{t('purchase.receiptLabel')}</label>
                                    <input 
                                        type="file" 
                                        onChange={(e) => setReceipt(e.target.files ? e.target.files[0] : null)} 
                                        accept="image/*" 
                                        className="w-full text-sm text-textLight file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setStep(1)} 
                                        className="w-1/3 py-3 bg-white/20 text-textDark font-bold rounded-xl hover:bg-white/40 transition"
                                    >
                                        {t('purchase.backButton')}
                                    </button>
                                    <button 
                                        onClick={handleConfirm} 
                                        className="w-2/3 py-3 bg-primary text-white font-extrabold rounded-xl hover:bg-primary-dark transition shadow-lg"
                                    >
                                        {t('purchase.confirmButton')}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
                                <h3 className="font-extrabold text-2xl text-primary">{t('purchase.successTitle')}</h3>
                                <p className="text-textLight font-medium">{t('purchase.successMessage')}</p>
                                
                                <div className="p-4 bg-white/10 rounded-xl border border-white/20">
                                    <p className="font-bold">{t('purchase.contactInfo')}</p>
                                    <a 
                                        href="https://t.me/Nurbek_To" 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-primary hover:underline font-bold text-lg"
                                    >
                                        @Nurbek_To
                                    </a>
                                </div>
                                
                                <button 
                                    onClick={handlePurchase}
                                    disabled={isProcessing}
                                    className={`w-full py-3 bg-primary text-white font-extrabold rounded-xl hover:bg-primary-dark transition shadow-lg ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t('common.processing')}
                                        </span>
                                    ) : t('purchase.confirmButton')}
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};