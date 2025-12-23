import React, { useState, useCallback, useEffect, createContext, useContext, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sidebar } from './components/Sidebar';
import { useSettings } from './hooks/useSettings';
import { TenderWorkspace } from './components/TenderWorkspace';
import { useAppStore } from './store';
import type { User, Analysis, TenderData, Product, SerperSearchResult, ContractData, ContractAnalysis } from './types';
import { ContractAnalysis as ContractAnalysisPage } from './components/ContractAnalysis';
import { QuickSearch } from './components/QuickSearch';
import { SearchResults } from './components/SearchResults';
import { UsersPage } from './components/Brokers';
import { searchOnSerper, extractPriceFromUrl } from './services/geminiService';
// Fix: Import the Header component to resolve the reference error.
import { Header } from './components/Header';
// Import the new API service
import { authApi, setAuthToken, userApi, tenderAnalysisApi, tokenApi, statisticsApi } from './services/apiService';
// Import the BuyTokensModal component
import { BuyTokensModal } from './components/BuyTokensModal';
// Import the AdminPanel component
import AdminPanel from './components/AdminPanel';

// --- AUTH CONTEXT ---
interface AuthContextType {
    user: User | null;
    login: (username: string, password?: string) => Promise<boolean>;
    logout: () => void;
    getEffectiveTokens: () => { xtTokens: number; uzexTokens: number };
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// --- AUTH-RELATED COMPONENTS ---

const PurchaseFlowPage: React.FC<{ onSwitchToLogin: () => void }> = ({ onSwitchToLogin }) => {
    const [step, setStep] = useState(1);
    const [platform, setPlatform] = useState<'xt' | 'uzex'>('xt');
    const [quantity, setQuantity] = useState('100');
    const [error, setError] = useState('');
    const [receipt, setReceipt] = useState<File | null>(null);
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const { t } = useSettings();

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
        <div className="px-4 py-8 md:py-12 flex flex-col items-center justify-center min-h-full">
            <div className="w-full max-w-2xl glass-card rounded-3xl p-6 md:p-10">
                <div className="flex justify-center mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-textDark">{t('main.title')}</h1>
                    </div>
                </div>
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-textDark">{t('purchase.welcomeTitle')}</h2>
                    <p className="text-textLight mt-2 font-medium">{t('purchase.welcomeSubtitle')}</p>
                </div>

                <StepIndicator currentStep={step} />

                {step === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-textLight mb-2">{t('purchase.selectPlatformLabel')}</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setPlatform('xt')} className={`p-4 rounded-xl border-2 text-center transition-all duration-300 ${platform === 'xt' ? 'border-primary bg-primary/10 font-bold shadow-lg' : 'border-transparent bg-white/20 hover:bg-white/40'}`}>XT-Xarid</button>
                                <button onClick={() => setPlatform('uzex')} className={`p-4 rounded-xl border-2 text-center transition-all duration-300 ${platform === 'uzex' ? 'border-primary bg-primary/10 font-bold shadow-lg' : 'border-transparent bg-white/20 hover:bg-white/40'}`}>Tender-UZEX</button>
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
                                className="w-full p-3 bg-white/20 text-textDark border border-transparent rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition" />
                             {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
                        </div>
                        <div className="p-4 bg-white/10 rounded-xl text-center border border-white/20">
                            <p className="text-sm text-textLight">{t('purchase.totalPriceLabel')}</p>
                            <p className="text-3xl font-extrabold text-primary">{price.toLocaleString('uz-UZ')} {t('purchase.currency')}</p>
                        </div>
                        <button onClick={handleNext} className="w-full py-3 bg-primary text-white font-extrabold rounded-xl hover:bg-primary-dark transition shadow-lg hover:shadow-primary/40">
                            {t('purchase.nextButton')}
                        </button>
                    </motion.div>
                )}

                {step === 2 && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                         <h3 className="font-bold text-xl text-textDark text-center">{t('purchase.paymentTitle')}</h3>
                         <p className="text-center text-textLight font-medium">{t('purchase.paymentInstruction')} <strong>{price.toLocaleString('uz-UZ')} {t('purchase.currency')}</strong></p>
                         <div className="p-3 bg-white/20 rounded-xl border border-white/20 flex items-center justify-between gap-4">
                            <span className="font-mono text-lg sm:text-xl tracking-widest text-textDark">8600 1234 5678 9012</span>
                            <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-white/30 text-textDark" aria-label={t('purchase.copyAriaLabel')} title={t('purchase.copyAriaLabel')}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg>
                            </button>
                         </div>
                        <p className="text-center text-textLight text-sm">To'ychiyev Nurbek</p>
                         
                         <div>
                             <label className="block text-sm font-semibold text-textLight mb-2">{t('purchase.fullNameLabel')}</label>
                             <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('purchase.fullNamePlaceholder')} className="w-full p-3 bg-white/20 text-textDark border border-transparent rounded-xl" />
                         </div>
                         
                         <div>
                             <label className="block text-sm font-semibold text-textLight mb-2">{t('purchase.phoneLabel')}</label>
                             <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+998 XX XXX XX XX" className="w-full p-3 bg-white/20 text-textDark border border-transparent rounded-xl" />
                         </div>

                         <div>
                             <label className="block text-sm font-semibold text-textLight mb-2">{t('purchase.receiptLabel')}</label>
                             <input type="file" onChange={(e) => setReceipt(e.target.files ? e.target.files[0] : null)} accept="image/*" className="w-full text-sm text-textLight file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                         </div>

                         <div className="flex items-center gap-4">
                             <button onClick={() => setStep(1)} className="w-1/3 py-3 bg-white/20 text-textDark font-bold rounded-xl hover:bg-white/40 transition">
                                 {t('purchase.backButton')}
                             </button>
                             <button onClick={handleConfirm} className="w-2/3 py-3 bg-primary text-white font-extrabold rounded-xl hover:bg-primary-dark transition shadow-lg">
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
                            <a href="https://t.me/Nurbek_To" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold text-lg">@Nurbek_To</a>
                        </div>
                        <button onClick={onSwitchToLogin} className="w-full py-3 bg-primary text-white font-extrabold rounded-xl hover:bg-primary-dark transition shadow-lg">
                            {t('purchase.goToLoginButton')}
                        </button>
                    </motion.div>
                )}

                <div className="mt-8 text-center text-sm">
                    <p className="text-textLight">{t('purchase.haveAccountPrompt')} <button onClick={onSwitchToLogin} className="font-bold text-primary hover:underline">{t('login.loginLink')}</button></p>
                </div>
            </div>
        </div>
    );
};


const LoginPage: React.FC<{ onSwitchToPurchase: () => void }> = ({ onSwitchToPurchase }) => {
    const { login } = useAuth();
    const { t } = useSettings();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('1234');
    const [error, setError] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await login(username, password);
        if (!success) {
            setError(true);
        }
    };

    return (
        <div className="px-4 py-12 flex flex-col items-center justify-center min-h-full">
            <div className="w-full max-w-md glass-card rounded-3xl p-6 md:p-10">
                <div className="text-center mb-8">
                     <h2 className="text-3xl font-extrabold text-textDark">{t('login.title')}</h2>
                    <p className="text-textLight mt-2">{t('login.subtitle')}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-textLight mb-2" htmlFor="username">{t('login.usernameLabel')}</label>
                        <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 bg-white/20 text-textDark border border-transparent rounded-xl" required />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-textLight mb-2" htmlFor="password">{t('login.passwordLabel')}</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-white/20 text-textDark border border-transparent rounded-xl" required />
                    </div>
                    {error && <p className="text-sm text-red-500">{t('login.error')}</p>}
                    <button type="submit" className="w-full py-3 bg-primary text-white font-extrabold rounded-xl hover:bg-primary-dark transition shadow-lg">
                        {t('login.loginButton')}
                    </button>
                </form>
                 <div className="mt-8 text-center text-sm">
                    <p className="text-textLight">{t('login.noAccountPrompt')} <button onClick={onSwitchToPurchase} className="font-bold text-primary hover:underline">{t('login.purchaseLink')}</button></p>
                </div>
            </div>
        </div>
    );
};

// ...

type Page = 'dashboard' | 'tender' | 'contract' | 'search' | 'users';

export const App: React.FC = () => {
  const { theme, t, language, isTelegramEnabled, telegramChatId } = useSettings();
  const [user, setUser] = useState<User | null>(null);
  const { users, setUsers, spendToken, analyses, startAnalysis, updateAnalysis, clearInProgressAnalyses, clearErrorAnalyses, processAnalysisQueue, contractAnalyses, setContractAnalyses, startContractAnalyses, processContractQueue, contractHistory, isAutoAnalysisEnabled } = useAppStore();
  const [page, setPage] = useState<Page>('dashboard');
  const [authPage, setAuthPage] = useState<'login' | 'purchase'>('login');
  const [isBuyTokensModalOpen, setIsBuyTokensModalOpen] = useState(false);
  const [isNoTokensModalOpen, setIsNoTokensModalOpen] = useState(false);
  const [noTokensPlatform, setNoTokensPlatform] = useState<'XT-Xarid' | 'Tender-UZEX'>('XT-Xarid');
  const [quickSearchState, setQuickSearchState] = useState<{ query: string; results: Record<string, SerperSearchResult[]>; isLoading: boolean; error: string | null; hasSearched: boolean }>({ query: '', results: {}, isLoading: false, error: null, hasSearched: false });

  // Init users on first load - now we'll fetch from backend
  useEffect(() => {
    const initApp = async () => {
      // Try to restore auth token from localStorage
      const savedToken = localStorage.getItem('authToken');
      if (savedToken) {
        setAuthToken(savedToken);
        try {
          // Validate the token by making a simple API call
          const response = await fetch('http://127.0.0.1:8000/api/users/', {
            headers: {
              'Authorization': `Token ${savedToken}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Invalid token');
          }
          
          // Token is valid, fetch current user data
          // In a full implementation, we would fetch user data from the backend
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('authToken');
          setAuthToken(null);
        }
      }
      
      // Initialize with default users if none exist
      if (users.length === 0) {
        setUsers([
          { id: 'admin-1', username: 'admin', password: '1234', name: 'Admin', role: 'admin', xtTokens: 1000, uzexTokens: 1000 },
        ]);
      }
    };
    
    initApp();
  }, [users, setUsers]);

  // Fetch statistics when user logs in - removed backend fetch, using local calculation instead
  /*
  useEffect(() => {
    const fetchStatistics = async () => {
      if (!user) return;
      
      try {
        setLoadingStats(true);
        const stats = await statisticsApi.get();
        setStatistics(stats);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    
    fetchStatistics();
  }, [user]);
  */

  // Auto-process analysis queue
  useEffect(() => {
    const telegramSettings = { isEnabled: isTelegramEnabled, chatId: telegramChatId, lang: language };
    const interval = setInterval(() => {
      if (isAutoAnalysisEnabled) {
          processAnalysisQueue('xt', contractHistory, telegramSettings);
          processAnalysisQueue('uzex', contractHistory, telegramSettings);
      }
    }, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [processAnalysisQueue, contractHistory, isAutoAnalysisEnabled, isTelegramEnabled, telegramChatId, language]);
  
  // Auto-process contract queue (separately)
  useEffect(() => {
      processContractQueue();
  }, [contractAnalyses, processContractQueue]);


  const get = useAppStore.getState;

  const login = async (username: string, password?: string): Promise<boolean> => {
    try {
      // Clear any existing invalid token
      localStorage.removeItem('authToken');
      setAuthToken(null);
      
      // Try backend login first
      const response = await authApi.login(username, password || '');
      
      // Create user object from backend response
      const backendUser: User = {
        id: response.user_id.toString(),
        username: response.username,
        name: response.username,
        role: response.role,
        xtTokens: response.xt_tokens,
        uzexTokens: response.uzex_tokens,
      };
      
      setUser(backendUser);
      
      // Save token to localStorage
      localStorage.setItem('authToken', response.token);
      
      // Update users in store
      setUsers([
        ...get().users.filter(u => u.username !== username),
        backendUser
      ]);
      
      return true;
    } catch (error: any) {
      console.error('Backend login failed:', error);
      
      // If it's a token error, clear the token and try again
      if (error.message && error.message.includes('Invalid token')) {
        localStorage.removeItem('authToken');
        setAuthToken(null);
      }
      
      // Fall back to local authentication
      const foundUser = get().users.find(u => u.username === username && u.password === password);
      if (foundUser) {
        setUser(foundUser);
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('authToken');
  };

  const getEffectiveTokens = useCallback(() => {
    if (!user) return { xtTokens: 0, uzexTokens: 0 };
    if (user.role === 'admin') return { xtTokens: user.xtTokens ?? 0, uzexTokens: user.uzexTokens ?? 0 };
    const admin = get().users.find(u => u.id === user.adminId);
    return { xtTokens: admin?.xtTokens ?? 0, uzexTokens: admin?.uzexTokens ?? 0 };
  }, [user, get]);

  const handleStartAnalysis = useCallback((input: Analysis['input'], platform: 'xt' | 'uzex') => {
    startAnalysis(input, platform);
  }, [startAnalysis]);
  
  const handleUpdateAnalysis = useCallback((id: string, updates: Partial<Analysis>) => {
      updateAnalysis(id, updates);
  }, [updateAnalysis]);
  
  const handleClearInProgressAnalyses = useCallback(() => {
      clearInProgressAnalyses();
  }, [clearInProgressAnalyses]);

  const handleClearErrorAnalyses = useCallback(() => {
      clearErrorAnalyses();
  }, [clearErrorAnalyses]);
  
  const handleStartContractAnalyses = useCallback((files: File[]) => {
      if(user) {
          startContractAnalyses(files, user.id);
      }
  }, [user, startContractAnalyses]);

  const handleQuickSearch = async (query: string) => {
      setQuickSearchState(prev => ({ ...prev, query, isLoading: true, error: null, hasSearched: true }));
      try {
          const searchResultsData = await searchOnSerper(query);
          const initialResults = searchResultsData['uz']?.slice(0, 5).map(r => ({ ...r, isLoadingPrice: true })) || [];
          setQuickSearchState(prev => ({ ...prev, results: { 'uz': initialResults }, isLoading: false }));

          const pricePromises = initialResults.map(async (result) => {
              try {
                  const price = await extractPriceFromUrl({ name: query } as Product, result.link);
                  return { link: result.link, price };
              } catch {
                  return { link: result.link, price: 0 };
              }
          });
          
          const prices = await Promise.all(pricePromises);

          setQuickSearchState(prev => ({
              ...prev,
              results: {
                  'uz': (prev.results['uz'] || []).map(r => {
                      const found = prices.find(p => p.link === r.link);
                      return { ...r, foundPrice: found?.price, isLoadingPrice: false };
                  })
              }
          }));

      } catch (err) {
          setQuickSearchState(prev => ({ ...prev, isLoading: false, error: err instanceof Error ? err.message : t('errors.unknown') }));
      }
  };


  const handleBuyTokens = () => {
      setIsBuyTokensModalOpen(true);
  };
  
  const handleBuyTokensSuccess = useCallback(async () => {
    if (!user) return;
    
    try {
      // Refresh user data to get updated token counts
      const response = await authApi.login(user.username, ''); // Empty password since we're already authenticated
      
      // Update user with new token counts
      const updatedUser: User = {
        ...user,
        xtTokens: response.xt_tokens,
        uzexTokens: response.uzex_tokens,
      };
      
      setUser(updatedUser);
      
      // Update users in store
      setUsers([
        ...get().users.filter(u => u.id !== user.id),
        updatedUser
      ]);
      
      toast.success(t('purchase.successTitle'));
    } catch (error) {
      console.error('Failed to refresh user tokens:', error);
      toast.error(t('errors.unknown'));
    }
  }, [user, setUsers, get, t]);

  const handleNewAnalysis = () => {
    setPage('tender');
  };

  const authContextValue = { user, login, logout, getEffectiveTokens };

  useEffect(() => {
    document.documentElement.className = `theme-${theme}`;
  }, [theme]);

  // Calculate statistics locally instead of fetching from backend
  const calculateLocalStatistics = useCallback(() => {
    if (!user) return null;
    
    const userAnalyses = analyses;
    
    const totalAnalyses = userAnalyses.length;
    const completedAnalyses = userAnalyses.filter(a => a.status === 'completed').length;
    const pendingAnalyses = userAnalyses.filter(a => a.status === 'pending').length;
    const errorAnalyses = userAnalyses.filter(a => a.status === 'error').length;
    
    const wonAnalyses = userAnalyses.filter(a => a.outcome === 'won').length;
    const lostAnalyses = userAnalyses.filter(a => a.outcome === 'lost').length;
    const skippedAnalyses = userAnalyses.filter(a => a.outcome === 'skipped').length;
    
    // Win rate calculation
    const winRate = (wonAnalyses + lostAnalyses) > 0 
      ? (wonAnalyses / (wonAnalyses + lostAnalyses)) * 100 
      : 0;
    
    return {
      total_analyses: totalAnalyses,
      completed_analyses: completedAnalyses,
      pending_analyses: pendingAnalyses,
      error_analyses: errorAnalyses,
      won_analyses: wonAnalyses,
      lost_analyses: lostAnalyses,
      skipped_analyses: skippedAnalyses,
      win_rate: winRate
    };
  }, [analyses, user]);
  
  const localStatistics = useMemo(() => calculateLocalStatistics(), [calculateLocalStatistics]);

  if (!user) {
      const isShowingPurchase = authPage === 'purchase';
      return (
          <AuthContext.Provider value={authContextValue}>
              <div className={`min-h-screen ${isShowingPurchase ? 'bg-white/10' : ''}`}>
                  <AnimatePresence mode="wait">
                      <motion.div
                          key={authPage}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                      >
                          {isShowingPurchase ? (
                              <PurchaseFlowPage onSwitchToLogin={() => setAuthPage('login')} />
                          ) : (
                              <LoginPage onSwitchToPurchase={() => setAuthPage('purchase')} />
                          )}
                      </motion.div>
                  </AnimatePresence>
              </div>
          </AuthContext.Provider>
      );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <Toaster position="bottom-center" toastOptions={{
        style: { background: 'rgb(var(--color-accent-default))', color: 'rgb(var(--color-text-dark))' },
      }}/>
      
      {/* Buy Tokens Modal */}
      <BuyTokensModal 
        isOpen={isBuyTokensModalOpen} 
        onClose={() => setIsBuyTokensModalOpen(false)} 
        onSuccess={handleBuyTokensSuccess} 
      />
      
      <div className="relative min-h-screen flex">
        <Sidebar page={page} setPage={setPage} user={user} onLogout={logout} onBuyTokens={handleBuyTokens} onNewAnalysis={handleNewAnalysis} />
        <div className="flex-1 pl-20 lg:pl-72">
          <Header user={user} onLogout={logout} onBuyTokens={handleBuyTokens} />
          <main className="p-4 md:p-8">
            {page === 'dashboard' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-extrabold text-textDark">{t('dashboard.title')}</h1>
                  <button onClick={() => setPage('tender')} className="px-6 py-3 bg-primary text-white font-extrabold rounded-xl hover:bg-primary-dark transition shadow-lg">
                    {t('dashboard.newAnalysisButton')}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-textLight">{t('dashboard.stats.totalAnalyses')}</h3>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002-2h2a2 2 0 002 2" />
                        </svg>
                      </div>
                    </div>
                    <p className="mt-4 text-3xl font-extrabold text-textDark">
                      {localStatistics ? localStatistics.total_analyses : analyses.length}
                    </p>
                  </div>
                  
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-textLight">{t('dashboard.stats.won')}</h3>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="mt-4 text-3xl font-extrabold text-textDark">
                      {localStatistics ? localStatistics.won_analyses : analyses.filter(a => a.outcome === 'won').length}
                    </p>
                  </div>
                  
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-textLight">{t('dashboard.stats.winRate')}</h3>
                    </div>
                    <p className="mt-4 text-3xl font-extrabold text-textDark">
                      {localStatistics ? `${Math.round(localStatistics.win_rate)}%` : (
                        analyses.length > 0 ? 
                          `${Math.round((analyses.filter(a => a.outcome === 'won').length / 
                          (analyses.filter(a => a.outcome === 'won').length + analyses.filter(a => a.outcome === 'lost').length)) * 100 || 0)}%` : 
                          '0%'
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-textDark mb-4">{t('dashboard.recentAnalyses')}</h3>
                  {analyses.slice(0, 5).map(analysis => (
                    <div key={analysis.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div>
                        <p className="font-bold text-textDark">{analysis.data?.tenderName || analysis.input.mainUrl}</p>
                        <p className="text-sm text-textLight">{analysis.data?.lotNumber ? `${t('tenderDetails.lotNumber')}: ${analysis.data.lotNumber}` : (analysis.data?.customerName || t('history.unknownCustomer'))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-textLight">{new Date(analysis.analysisDate).toLocaleDateString('uz-UZ')}</p>
                        <p className={`text-sm font-bold ${
                          analysis.outcome === 'won' ? 'text-green-600' :
                          analysis.outcome === 'lost' ? 'text-red-600' :
                          analysis.outcome === 'skipped' ? 'text-gray-500' : 'text-blue-600'
                        }`}>
                          {analysis.outcome === 'won' ? t('completed.outcomeWon') :
                           analysis.outcome === 'lost' ? t('completed.outcomeLost') :
                           analysis.outcome === 'skipped' ? t('completed.outcomeSkipped') : t('dashboard.inProgress')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {analyses.length === 0 && <p className="text-center text-textLight py-4">{t('dashboard.noAnalyses')}</p>}
                </div>
              </div>
            )}
            
            {page === 'tender' && (
              <TenderWorkspace 
                onStartAnalysis={handleStartAnalysis}
                onUpdateAnalysis={handleUpdateAnalysis}
                onClearInProgressAnalyses={handleClearInProgressAnalyses}
                onClearErrorAnalyses={handleClearErrorAnalyses}
              />
            )}
            
            {page === 'contract' && (
              <ContractAnalysisPage 
                contractAnalyses={contractAnalyses}
                onStartAnalysis={handleStartContractAnalyses}
                setContractAnalyses={setContractAnalyses}
              />
            )}
            
            {page === 'search' && (
              <QuickSearch 
                state={quickSearchState}
                onSearch={handleQuickSearch}
                onReset={() => setQuickSearchState({ query: '', results: {}, isLoading: false, error: null, hasSearched: false })}
              />
            )}
            
            {page === 'users' && (
              <UsersPage users={users} setUsers={setUsers} currentUser={user} />
            )}
            {page === 'admin' && user?.role === 'admin' && (
              <AdminPanel user={user} onTokensUpdated={(xtTokens, uzexTokens) => {
                // Update the current user's token counts
                if (user) {
                  const updatedUser = {
                    ...user,
                    xtTokens,
                    uzexTokens
                  };
                  setUser(updatedUser);
                  
                  // Also update in the users list
                  setUsers(users.map(u => u.id === user.id ? updatedUser : u));
                }
              }} />
            )}
          </main>
        </div>
      </div>
    </AuthContext.Provider>
  );
};