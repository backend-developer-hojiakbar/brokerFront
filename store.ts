import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Analysis, ContractAnalysis, ContractData, TenderData, Product } from './types';
import { processTenderUrl, searchOnSerper, extractPriceFromUrl, analyzeContracts, sendTelegramMessage } from './services/geminiService';
import { t } from './utils/i18n';
import type { Language } from './contexts/SettingsContext';
import { toast } from 'react-hot-toast';

// Define the state shape
interface AppState {
    // Auth & Users
    users: User[];
    setUsers: (users: User[]) => void;
    spendToken: (platform: 'xt' | 'uzex', loggedInUser: User) => void;

    // Tender Analysis
    analyses: Analysis[];
    isAutoAnalysisEnabled: boolean;
    startAnalysis: (input: Analysis['input'], platform: 'xt' | 'uzex') => void;
    updateAnalysis: (id: string, updates: Partial<Analysis>) => void;
    clearInProgressAnalyses: () => void;
    clearErrorAnalyses: () => void;
    processAnalysisQueue: (platform: 'xt' | 'uzex', contractHistory: ContractData[], telegramSettings: { isEnabled: boolean; chatId: string; lang: Language }) => Promise<void>;
    setIsAutoAnalysisEnabled: (enabled: boolean) => void;

    // Contract Analysis
    contractAnalyses: ContractAnalysis[];
    contractHistory: ContractData[];
    startContractAnalyses: (files: File[], userId: string) => void;
    processContractQueue: () => Promise<void>;
    setContractAnalyses: (analyses: ContractAnalysis[]) => void;
}

// Create the store
export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // === STATE ===
            users: [],
            analyses: [],
            isAutoAnalysisEnabled: true,
            contractAnalyses: [],
            contractHistory: [],

            // === ACTIONS ===
            setUsers: (users) => set({ users }),

            spendToken: (platform, loggedInUser) => {
                const adminId = loggedInUser.role === 'admin' ? loggedInUser.id : loggedInUser.adminId;
                if (!adminId) return;

                set(state => ({
                    users: state.users.map(u => {
                        if (u.id === adminId) {
                            const newTokens = { ...u };
                            if (platform === 'xt') {
                                newTokens.xtTokens = Math.max(0, (newTokens.xtTokens ?? 0) - 1);
                            } else {
                                newTokens.uzexTokens = Math.max(0, (newTokens.uzexTokens ?? 0) - 1);
                            }
                            return newTokens;
                        }
                        return u;
                    })
                }));
            },

            startAnalysis: (input, platform) => {
                const newAnalysis: Analysis = {
                    id: crypto.randomUUID(),
                    input,
                    platform, // Store the platform information
                    status: 'pending',
                    data: null,
                    error: null,
                    outcome: 'active',
                    analysisDate: new Date().toISOString(),
                };
                set(state => ({
                    analyses: [newAnalysis, ...state.analyses],
                    isAutoAnalysisEnabled: true // Always re-enable on new task
                }));
                // The useEffect in App.tsx will trigger the queue processing
            },

            updateAnalysis: (id, updates) => {
                set(state => ({
                    analyses: state.analyses.map(a => {
                        if (a.id === id) {
                            // For nested data updates, we need to properly merge them
                            if (updates.data && a.data) {
                                // Log for debugging
                                if (updates.data.products) {
                                    console.log('Updating products for analysis:', id);
                                    console.log('New products data:', updates.data.products);
                                    updates.data.products.forEach((product, index) => {
                                        if (product.foundMarketPrice !== undefined) {
                                            console.log(`Product ${index} (${product.name}) foundMarketPrice:`, product.foundMarketPrice);
                                        }
                                    });
                                }
                                
                                return { 
                                    ...a, 
                                    ...updates,
                                    data: {
                                        ...a.data,
                                        ...updates.data,
                                        // If products are being updated, make sure to properly merge them
                                        products: updates.data.products || a.data.products
                                    }
                                };
                            }
                            return { ...a, ...updates };
                        }
                        return a;
                    })
                }));
            },
            
            setIsAutoAnalysisEnabled: (enabled: boolean) => set({ isAutoAnalysisEnabled: enabled }),

            clearInProgressAnalyses: () => {
                set(state => ({
                    analyses: state.analyses.filter(a => a.outcome !== 'active')
                }));
            },

            clearErrorAnalyses: () => {
                set(state => ({
                    analyses: state.analyses.filter(a => a.status !== 'error')
                }));
            },

            processAnalysisQueue: async (platform, contractHistory, telegramSettings) => {
                const { isAutoAnalysisEnabled, analyses, updateAnalysis, users } = get();
                if (!isAutoAnalysisEnabled) return;

                // Filter analyses by platform
                const platformAnalyses = analyses.filter(a => a.status === 'pending' && a.platform === platform);

                const isProcessing = analyses.some(a => a.status === 'analyzing' || a.status === 'pricing');
                if (isProcessing) {
                    return; 
                }

                const pendingAnalysis = platformAnalyses.find(a => a.status === 'pending');
                if (!pendingAnalysis) return;

                updateAnalysis(pendingAnalysis.id, { status: 'analyzing' });
                
                try {
                    const tenderDetails = await processTenderUrl(
                        pendingAnalysis.input.mainUrl, 
                        pendingAnalysis.input.additionalUrls, 
                        pendingAnalysis.input.files,
                        contractHistory
                    );
                    
                    const analyst = users.find(u => u.id === pendingAnalysis.input.selectedAnalystId);
                    const dataWithMeta: TenderData = { ...tenderDetails, id: crypto.randomUUID(), analysisDate: new Date().toISOString(), brokerName: analyst?.name, userId: pendingAnalysis.input.selectedAnalystId };

                    if (!dataWithMeta.products || dataWithMeta.products.length === 0) {
                        throw new Error(dataWithMeta.summary || t(telegramSettings.lang, 'errors.analysisFailed'));
                    }

                    updateAnalysis(pendingAnalysis.id, { data: dataWithMeta, status: 'pricing' });
                    toast.success(`${dataWithMeta.lotNumber}: ${t(telegramSettings.lang, 'analysisCard.statusPricing')}`);

                    // --- SEQUENTIAL PRICE FETCHING ---
                    let currentProducts = [...dataWithMeta.products];

                    for (let i = 0; i < currentProducts.length; i++) {
                        const product = currentProducts[i];
                        
                        // 1. Set loading state for the current product and update the UI
                        currentProducts[i] = { ...product, isLoadingMarketPrice: true };
                        updateAnalysis(pendingAnalysis.id, { 
                            data: { ...dataWithMeta, products: [...currentProducts] } 
                        });

                        try {
                            const query = product.searchQuery || product.name;
                            const searchResults = await searchOnSerper(query);
                            const topResults = (searchResults['uz'] || []).slice(0, 3);
                            
                            let foundPrice = 0;
                            let sourceUrl: string | undefined = undefined;
                            let sourceName: string | undefined = undefined;

                            if (topResults.length > 0) {
                                const prices = await Promise.all(topResults.map(result => extractPriceFromUrl(product, result.link)));
                                const validPrices = prices.filter(p => p > 0);
                                
                                if (validPrices.length > 0) {
                                    foundPrice = Math.min(...validPrices);
                                    const bestPriceIndex = prices.indexOf(foundPrice);
                                    if (bestPriceIndex !== -1) {
                                        sourceUrl = topResults[bestPriceIndex].link;
                                        sourceName = topResults[bestPriceIndex].title;
                                    }
                                }
                            }
                            
                            // 2. Update the product with the found price and set loading to false
                            currentProducts[i] = { ...product, foundMarketPrice: foundPrice, sourceUrl, sourceName, isLoadingMarketPrice: false };

                        } catch(error) {
                            console.error(`Error fetching price for product "${product.name}":`, error);
                            // On error, just mark it as not loading and price 0
                            currentProducts[i] = { ...product, foundMarketPrice: 0, isLoadingMarketPrice: false };
                        }

                        // 3. Update the state with the new product data to show the result in the UI
                        updateAnalysis(pendingAnalysis.id, { 
                            data: { ...dataWithMeta, products: [...currentProducts] } 
                        });
                    }
                    
                    const finalData = { ...dataWithMeta, products: currentProducts };
                    updateAnalysis(pendingAnalysis.id, { status: 'completed', data: finalData });
                    toast.success(`${finalData.lotNumber}: ${t(telegramSettings.lang, 'tabs.completed')}`);

                    if (telegramSettings.isEnabled && telegramSettings.chatId) {
                        const formatCurrency = (amount: number | undefined | null) => new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', minimumFractionDigits: 0 }).format(amount || 0);
                        let message = `<b>${t(telegramSettings.lang, 'telegram.messageTitle')}</b>\n\n`;
                        message += `<b>${t(telegramSettings.lang, 'telegram.tenderName')}:</b> <i>${finalData.tenderName}</i>\n`;
                        message += `<b>${t(telegramSettings.lang, 'telegram.lotNumber')}:</b> <code>${finalData.lotNumber}</code>\n`;
                        message += `<b>${t(telegramSettings.lang, 'telegram.startingPrice')}:</b> ${finalData.startingPrice}\n\n`;
                        message += `<b>${t(telegramSettings.lang, 'telegram.products')}:</b>\n`;
                        finalData.products.forEach(p => {
                            const priceText = p.foundMarketPrice ? `${formatCurrency(p.foundMarketPrice)}` : t(telegramSettings.lang, 'telegram.noPrice');
                            message += `- ${p.name}: <b>${priceText}</b>\n`;
                        });
                        if (pendingAnalysis.input.mainUrl) message += `\n<a href="${pendingAnalysis.input.mainUrl}">${t(telegramSettings.lang, 'telegram.viewLot')}</a>`;
                        sendTelegramMessage(telegramSettings.chatId, message).catch(err => console.error("Telegram dispatch error:", err));
                    }

                } catch (err) {
                    const errorMsg = err instanceof Error ? err.message : String(err);
                    updateAnalysis(pendingAnalysis.id, { status: 'error', error: errorMsg });
                    set({ isAutoAnalysisEnabled: false });
                    toast.error(errorMsg, { duration: 8000 });
                }
            },
            
            setContractAnalyses: (analyses) => set({ contractAnalyses: analyses }),

            startContractAnalyses: (files, userId) => {
                const newJobs: ContractAnalysis[] = files.map(file => ({
                    id: crypto.randomUUID(), file, status: 'pending', data: null, error: null,
                    analysisDate: new Date().toISOString(), userId,
                }));
                set(state => ({ contractAnalyses: [...newJobs, ...state.contractAnalyses] }));
                get().processContractQueue();
            },
            
            processContractQueue: async () => {
                const { contractAnalyses } = get();
                const isProcessing = contractAnalyses.some(a => a.status === 'analyzing');
                if(isProcessing) return;

                const pendingJob = contractAnalyses.find(job => job.status === 'pending');
                if (!pendingJob) return;

                set(state => ({ contractAnalyses: state.contractAnalyses.map(j => j.id === pendingJob.id ? { ...j, status: 'analyzing' } : j) }));
                
                try {
                    const contractDetails = await analyzeContracts(pendingJob.file);
                    const dataWithMeta: ContractData = { ...contractDetails, id: crypto.randomUUID(), analysisDate: new Date().toISOString(), userId: pendingJob.userId };

                    set(state => ({
                        contractAnalyses: state.contractAnalyses.map(j => j.id === pendingJob.id ? { ...j, status: 'completed', data: dataWithMeta } : j),
                        contractHistory: [dataWithMeta, ...state.contractHistory]
                    }));
                    toast.success(`${pendingJob.file.name}: Shartnoma tahlili yakunlandi.`);

                } catch (err) {
                    const errorMsg = err instanceof Error ? err.message : String(err);
                    set(state => ({ contractAnalyses: state.contractAnalyses.map(j => j.id === pendingJob.id ? { ...j, status: 'error', error: errorMsg } : j) }));
                    toast.error(`${pendingJob.file.name}: ${errorMsg}`);
                }

                 // Check if there are more pending jobs and process them
                const hasMorePending = get().contractAnalyses.some(job => job.status === 'pending');
                if (hasMorePending) {
                    get().processContractQueue();
                }
            }
        }),
        {
            name: 'tender-pro-storage',
            partialize: (state) => ({
                users: state.users,
                analyses: state.analyses,
                contractHistory: state.contractHistory,
                contractAnalyses: state.contractAnalyses,
            }),
            // Migrate old analyses that don't have the platform property
            merge: (persistedState: any, currentState: any) => {
                const mergedState = { ...currentState, ...persistedState };
                
                // Handle migration of analyses without platform property
                if (mergedState.analyses && Array.isArray(mergedState.analyses)) {
                    mergedState.analyses = mergedState.analyses.map((analysis: any) => {
                        // If platform is missing, try to infer it from the URL
                        if (!('platform' in analysis) && analysis.input?.mainUrl) {
                            try {
                                const urlObject = new URL(analysis.input.mainUrl);
                                const hostname = urlObject.hostname.replace('www.', '');
                                
                                if (hostname.includes('xt-xarid.uz')) {
                                    return { ...analysis, platform: 'xt' };
                                } else if (hostname.includes('uzex.uz')) {
                                    return { ...analysis, platform: 'uzex' };
                                }
                            } catch (e) {
                                // If URL parsing fails, default to 'xt'
                                console.warn('Failed to parse URL for platform inference:', analysis.input.mainUrl);
                            }
                            // Default to 'xt' if we can't determine the platform
                            return { ...analysis, platform: 'xt' };
                        }
                        return analysis;
                    });
                }
                
                return mergedState;
            }
        }
    )
);