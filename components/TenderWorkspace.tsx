import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../hooks/useSettings';
import { useAppStore } from '../store';
import type { Analysis } from '../types';
import { TenderInputForm } from './TenderInputForm';
import { TenderDetails } from './TenderDetails';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { toast } from 'react-hot-toast';
import { tenderAnalysisApi } from '../services/apiService';
import { useAuth } from '../App';
import { searchOnSerper, extractPriceFromUrl, generateRobustSearchQuery } from '../services/geminiService';
import { productPriceApi } from '../services/apiService';

interface TenderWorkspaceProps {
  onStartAnalysis: (data: { mainUrl: string; additionalUrls: string[]; files: File[] }, platform: 'xt' | 'uzex') => void;
  onUpdateAnalysis: (id: string, updates: Partial<Analysis>) => void;
  onClearInProgressAnalyses: () => void;
  onClearErrorAnalyses: () => void;
}

// Card Components
const PendingCard: React.FC<{ analysis: Analysis }> = ({ analysis }) => {
  const { t } = useSettings();
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-textDark truncate max-w-xs">{analysis.input.mainUrl || t('tenderAnalysis.pendingCardTitle')}</div>
          <div className="text-sm text-textLight">{t('tabs.pending')}</div>
        </div>
        <p className="text-xs text-textLight">{new Date(analysis.analysisDate).toLocaleString('uz-UZ')}</p>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2">
        <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '30%' }}></div>
      </div>
    </motion.div>
  );
};

const AnalyzingCard: React.FC<{ analysis: Analysis }> = ({ analysis }) => {
  const { t } = useSettings();
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-textDark truncate max-w-xs">{analysis.data?.tenderName || analysis.input.mainUrl}</div>
          <div className="text-sm text-textLight">{t('analysisCard.statusAnalyzing')}</div>
        </div>
        <p className="text-xs text-textLight">{new Date(analysis.analysisDate).toLocaleString('uz-UZ')}</p>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2">
        <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
      </div>
    </motion.div>
  );
};

const PricingCard: React.FC<{ analysis: Analysis }> = ({ analysis }) => {
  const { t } = useSettings();
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-textDark truncate max-w-xs">{analysis.data?.tenderName}</div>
          <div className="text-sm text-textLight">{t('analysisCard.statusPricing')}</div>
        </div>
        <p className="text-xs text-textLight">{new Date(analysis.analysisDate).toLocaleString('uz-UZ')}</p>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2">
        <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '90%' }}></div>
      </div>
    </motion.div>
  );
};

const ErrorCard: React.FC<{ analysis: Analysis }> = ({ analysis }) => {
  const { t } = useSettings();
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-4 border border-red-500/30 bg-red-500/10">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-red-600 truncate max-w-xs">{analysis.input.mainUrl || t('tenderAnalysis.errorCardTitle')}</div>
          <div className="text-sm text-red-500">{t('tabs.error')}</div>
        </div>
        <p className="text-xs text-textLight">{new Date(analysis.analysisDate).toLocaleString('uz-UZ')}</p>
      </div>
      <p className="text-sm text-red-600 mt-2">{analysis.error}</p>
    </motion.div>
  );
};

const CompletedCard: React.FC<{ 
  analysis: Analysis; 
  onUpdate: (id: string, updates: Partial<Analysis>) => void; 
  onView: () => void; 
}> = ({ analysis, onUpdate, onView }) => {
  const { t } = useSettings();
  const outcomes: { id: 'won' | 'lost' | 'skipped'; label: string; classes: string }[] = [
    { id: 'won', label: t('completed.outcomeWon'), classes: 'bg-green-600 hover:bg-green-700' },
    { id: 'lost', label: t('completed.outcomeLost'), classes: 'bg-red-600 hover:bg-red-700' },
    { id: 'skipped', label: t('completed.outcomeSkipped'), classes: 'bg-gray-500 hover:bg-gray-600' },
  ];

  // Handle outcome update without backend integration
  const handleOutcomeUpdate = (outcome: 'won' | 'lost' | 'skipped') => {
    // Update local state only
    onUpdate(analysis.id, { outcome });
    
    // Show success message
    toast.success(t('completed.outcomeUpdated'));
  };

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-4">
      <div className="flex justify-between items-start mb-3">
        <button onClick={onView} className="text-left">
          <div className="font-bold text-primary text-lg hover:underline">{analysis.data?.tenderName}</div>
          <div className="text-sm text-textLight">{t('tenderDetails.lotNumber')}: {analysis.data?.lotNumber}</div>
        </button>
        <p className="text-xs text-textLight mt-1 sm:mt-0">{new Date(analysis.analysisDate).toLocaleString('uz-UZ')}</p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-2 justify-end">
        <span className="text-sm font-semibold text-textLight mr-auto">{t('completed.statusLabel')}:</span>
        {outcomes.map(o => (
          <button 
            key={o.id} 
            onClick={() => handleOutcomeUpdate(o.id)}
            className={`px-3 py-1.5 text-xs text-white font-bold rounded-full transition ${analysis.outcome === o.id ? `${o.classes} ring-2 ring-offset-2 ring-offset-surface ring-white/80` : `bg-gray-400/50 hover:${o.classes}`}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export const TenderWorkspace: React.FC<TenderWorkspaceProps> = ({ 
  onStartAnalysis, 
  onUpdateAnalysis,
  onClearInProgressAnalyses,
  onClearErrorAnalyses
}) => {
  const { t } = useSettings();
  const { user } = useAuth();
  const { analyses, isAutoAnalysisEnabled, setIsAutoAnalysisEnabled, spendToken } = useAppStore();
  const [platform, setPlatform] = useState<'xt' | 'uzex'>('xt');
  const [selectedAnalystId, setSelectedAnalystId] = useState('');
  const [viewingAnalysis, setViewingAnalysis] = useState<Analysis | null>(null);
  const [expenses, setExpenses] = useState<{ id: string; name: string; amount: string; isPercentage: boolean }[]>([
    { id: 'bank', name: t('tenderDetails.bankFee'), amount: '1.5', isPercentage: true },
    { id: 'tax', name: t('tenderDetails.tax'), amount: '12', isPercentage: true },
    { id: 'transport', name: t('tenderDetails.transportCost'), amount: '0', isPercentage: false },
  ]);
  const [bankPercent, setBankPercent] = useState('1.5');
  const [taxPercent, setTaxPercent] = useState('12');
  const [transportCost, setTransportCost] = useState('0');
  const [bidResult, setBidResult] = useState<{ totalMarketPrice: number; totalExpenses: number; totalCost: number; finalBidPrice: number } | null>(null);

  // Set default analyst to current user
  React.useEffect(() => {
    if (user && !selectedAnalystId) {
      setSelectedAnalystId(user.id);
    }
  }, [user, selectedAnalystId]);

  const handleStartAnalysis = (data: { mainUrl: string; additionalUrls: string[]; files: File[] }) => {
    // Spend a token before starting the analysis
    if (user) {
      spendToken(platform, user);
    }
    
    // Start the analysis
    onStartAnalysis(data, platform);
  };

  const handleCalculateBid = () => {
    if (!viewingAnalysis?.data) return;
    
    const products = viewingAnalysis.data.products || [];
    const totalMarketPrice = products.reduce((sum, product) => sum + (product.foundMarketPrice || 0), 0);
    
    const bankAmount = (parseFloat(bankPercent) / 100) * totalMarketPrice;
    const taxAmount = (parseFloat(taxPercent) / 100) * totalMarketPrice;
    const transportAmount = parseFloat(transportCost);
    
    const totalExpenses = bankAmount + taxAmount + transportAmount;
    const totalCost = totalMarketPrice + totalExpenses;
    const finalBidPrice = totalCost;
    
    setBidResult({ totalMarketPrice, totalExpenses, totalCost, finalBidPrice });
  };

  const handleFindPrice = async (productIndex: number, searchType: 'text' | 'image' = 'text') => {
    if (!viewingAnalysis?.data) return;
    
    try {
      // Create a deep copy of the products array to avoid mutation issues
      const products = JSON.parse(JSON.stringify(viewingAnalysis.data.products));
      const product = products[productIndex];
      
      if (!product) return;
      
      // Update UI to show loading state
      products[productIndex] = { ...product, isLoadingMarketPrice: true };
      onUpdateAnalysis(viewingAnalysis.id, { 
        data: { ...viewingAnalysis.data, products } 
      });
      
      // If this is a manual search (triggered by "Qayta qidirish" button)
      if (searchType === 'text') {
        // First try our new product price API with detailed product information
        try {
          const priceResponse = await productPriceApi.getPrice(product);
          
          if (priceResponse.success && priceResponse.best_price) {
            const bestPrice = priceResponse.best_price;
            
            // Update the product with the found price
            products[productIndex] = { 
              ...product, 
              foundMarketPrice: bestPrice.price,
              sourceUrl: bestPrice.link,
              sourceName: bestPrice.shop,
              isLoadingMarketPrice: false 
            };
            
            // Ensure we're updating the complete data object
            const updatedData = { 
              ...viewingAnalysis.data, 
              products: [...products] 
            };
            
            // Log the update for debugging
            console.log('Updating product with price:', bestPrice.price, 'for product:', product.name);
            console.log('Full bestPrice object:', bestPrice);
            
            onUpdateAnalysis(viewingAnalysis.id, { 
              data: updatedData
            });
            
            toast.success(t('tenderDetails.priceFoundSuccess'));
            return;
          } else if (priceResponse.error) {
            console.error('Product price API error:', priceResponse.error);
          }
        } catch (apiError) {
          console.log('Product price API failed, falling back to Serper search:', apiError);
        }
        
        // Fallback to the original Serper search method
        // Generate search query for the product
        const searchQuery = generateRobustSearchQuery(product);
        const searchResults = await searchOnSerper(searchQuery);
        const topResults = (searchResults['uz'] || []).slice(0, 3);
        
        let foundPrice = 0;
        let sourceUrl: string | undefined = undefined;
        let sourceName: string | undefined = undefined;
        
        // Try to extract price from the top results
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
        
        // Update the product with the found price
        products[productIndex] = { 
          ...product, 
          foundMarketPrice: foundPrice,
          sourceUrl,
          sourceName,
          isLoadingMarketPrice: false 
        };
        
        // Ensure we're updating the complete data object
        const updatedData = { 
          ...viewingAnalysis.data, 
          products: [...products] 
        };
        
        // Log the update for debugging
        console.log('Updating product with fallback price:', foundPrice, 'for product:', product.name);
        
        onUpdateAnalysis(viewingAnalysis.id, { 
          data: updatedData
        });
        
        if (foundPrice > 0) {
          toast.success(t('tenderDetails.priceFoundSuccess'));
        } else {
          toast.error(t('tenderDetails.priceNotFound'));
        }
      } else {
        // Handle image search (existing functionality)
        toast.error(t('tenderDetails.imageSearchNotImplemented'));
        products[productIndex] = { ...product, isLoadingMarketPrice: false };
        
        // Ensure we're updating the complete data object
        const updatedData = { 
          ...viewingAnalysis.data, 
          products: [...products] 
        };
        
        onUpdateAnalysis(viewingAnalysis.id, { 
          data: updatedData
        });
      }
    } catch (error) {
      console.error('Failed to find price:', error);
      const products = [...viewingAnalysis.data.products];
      products[productIndex] = { ...products[productIndex], isLoadingMarketPrice: false };
      
      // Ensure we're updating the complete data object
      const updatedData = { 
        ...viewingAnalysis.data, 
        products: [...products] 
      };
      
      onUpdateAnalysis(viewingAnalysis.id, { 
        data: updatedData
      });
      
      toast.error(t('tenderDetails.priceFindError'));
    }
  };

  const handleProductNameChange = (productIndex: number, newName: string) => {
    if (!viewingAnalysis?.data) return;
    
    const products = [...viewingAnalysis.data.products];
    products[productIndex] = { ...products[productIndex], name: newName };
    
    onUpdateAnalysis(viewingAnalysis.id, { 
      data: { ...viewingAnalysis.data, products } 
    });
  };

  const handleProductQuantityChange = (productIndex: number, newQuantity: string) => {
    if (!viewingAnalysis?.data) return;
    
    const products = [...viewingAnalysis.data.products];
    products[productIndex] = { ...products[productIndex], quantity: newQuantity };
    
    onUpdateAnalysis(viewingAnalysis.id, { 
      data: { ...viewingAnalysis.data, products } 
    });
  };

  const handleMarketPriceChange = (productIndex: number, newPrice: number) => {
    if (!viewingAnalysis?.data) return;
    
    const products = [...viewingAnalysis.data.products];
    products[productIndex] = { ...products[productIndex], foundMarketPrice: newPrice };
    
    onUpdateAnalysis(viewingAnalysis.id, { 
      data: { ...viewingAnalysis.data, products } 
    });
  };

  const renderAnalysisCard = (analysis: Analysis) => {
    switch (analysis.status) {
      case 'pending':
        return <PendingCard analysis={analysis} />;
      case 'analyzing':
        return <AnalyzingCard analysis={analysis} />;
      case 'pricing':
        return <PricingCard analysis={analysis} />;
      case 'completed':
        return (
          <CompletedCard 
            analysis={analysis} 
            onUpdate={onUpdateAnalysis}
            onView={() => setViewingAnalysis(analysis)}
          />
        );
      case 'error':
        return <ErrorCard analysis={analysis} />;
      default:
        return null;
    }
  };

  const pendingAnalyses = analyses.filter(a => a.status === 'pending' && a.platform === platform);
  const activeAnalyses = analyses.filter(a => a.status === 'analyzing' || a.status === 'pricing');
  const completedAnalyses = analyses.filter(a => a.status === 'completed' && a.platform === platform);
  const errorAnalyses = analyses.filter(a => a.status === 'error' && a.platform === platform);

  if (viewingAnalysis) {
    return (
      <TenderDetails
        data={viewingAnalysis.data!}
        expenses={expenses}
        setExpenses={setExpenses}
        bankPercent={bankPercent}
        setBankPercent={setBankPercent}
        taxPercent={taxPercent}
        setTaxPercent={setTaxPercent}
        transportCost={transportCost}
        setTransportCost={setTransportCost}
        bidResult={bidResult}
        onCalculateBid={handleCalculateBid}
        onFindPrice={handleFindPrice}
        onProductNameChange={handleProductNameChange}
        onProductQuantityChange={handleProductQuantityChange}
        onMarketPriceChange={handleMarketPriceChange}
        expenseTemplates={[]}
        onApplyTemplate={() => {}}
        onOpenSaveTemplateModal={() => {}}
        onOpenManageTemplatesModal={() => {}}
        onBack={() => setViewingAnalysis(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h1 className="text-3xl font-extrabold text-textDark">{t('tenderAnalysis.title')}</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setPlatform('xt')}
            className={`px-4 py-2 rounded-xl font-bold transition ${platform === 'xt' ? 'bg-primary text-white shadow-lg' : 'bg-white/20 text-textDark hover:bg-white/40'}`}
          >
            XT-Xarid
          </button>
          <button 
            onClick={() => setPlatform('uzex')}
            className={`px-4 py-2 rounded-xl font-bold transition ${platform === 'uzex' ? 'bg-primary text-white shadow-lg' : 'bg-white/20 text-textDark hover:bg-white/40'}`}
          >
            Tender-UZEX
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-2xl font-extrabold text-textDark mb-6">{t('tenderAnalysis.formTitle')}</h2>
            <TenderInputForm 
              onSubmit={handleStartAnalysis}
              platform={platform}
              selectedAnalystId={selectedAnalystId}
              setSelectedAnalystId={setSelectedAnalystId}
            />
          </div>

          {/* Active Analyses */}
          {activeAnalyses.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-extrabold text-textDark">{t('tenderAnalysis.activeAnalyses')}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-textLight">{t('tenderAnalysis.autoProcess')}</span>
                  <button 
                    onClick={() => setIsAutoAnalysisEnabled(!isAutoAnalysisEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isAutoAnalysisEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAutoAnalysisEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {activeAnalyses.map(analysis => (
                  <div key={analysis.id}>
                    {renderAnalysisCard(analysis)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Analyses */}
          {pendingAnalyses.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-extrabold text-textDark">{t('tabs.pending')}</h2>
                <button 
                  onClick={onClearInProgressAnalyses}
                  className="px-3 py-1.5 text-sm bg-red-500/10 text-red-600 font-bold rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  {t('tenderAnalysis.clearAllButton')}
                </button>
              </div>
              <div className="space-y-4">
                {pendingAnalyses.map(analysis => (
                  <div key={analysis.id}>
                    {renderAnalysisCard(analysis)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Analyses */}
          {errorAnalyses.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border border-red-500/30 bg-red-500/10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-extrabold text-red-600 mb-4">{t('tabs.error')}</h2>
                <button 
                  onClick={onClearErrorAnalyses}
                  className="px-3 py-1.5 text-sm bg-red-500/10 text-red-600 font-bold rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  {t('tenderAnalysis.clearAllButton')}
                </button>
              </div>
              <div className="space-y-4">
                {errorAnalyses.map(analysis => (
                  <div key={analysis.id}>
                    {renderAnalysisCard(analysis)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Analyses */}
          {completedAnalyses.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-extrabold text-textDark mb-4">{t('tabs.completed')}</h2>
              <div className="space-y-4">
                {completedAnalyses.map(analysis => (
                  <div key={analysis.id}>
                    {renderAnalysisCard(analysis)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Stats Panel */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-xl font-extrabold text-textDark mb-4">{t('stats.title')}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-textLight">{t('stats.total')}</span>
                <span className="font-bold text-textDark">{analyses.filter(a => a.platform === platform).length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-textLight">{t('stats.completed')}</span>
                <span className="font-bold text-green-600">{completedAnalyses.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-textLight">{t('stats.pending')}</span>
                <span className="font-bold text-yellow-600">{pendingAnalyses.length}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-textLight">{t('stats.errors')}</span>
                <span className="font-bold text-red-600">{errorAnalyses.length}</span>
              </div>
            </div>
          </div>

          {/* Win Rate */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-xl font-extrabold text-textDark mb-4">{t('stats.winRate')}</h3>
            <div className="text-center py-4">
              <div className="text-4xl font-extrabold text-primary mb-2">
                {completedAnalyses.length > 0 
                  ? Math.round((completedAnalyses.filter(a => a.outcome === 'won').length / completedAnalyses.length) * 100) 
                  : 0}%
              </div>
              <div className="text-textLight text-sm">
                {completedAnalyses.filter(a => a.outcome === 'won').length} {t('stats.won')} / {completedAnalyses.length} {t('stats.total')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};