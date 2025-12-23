import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../hooks/useSettings';
import { toast } from 'react-hot-toast';
import { productPriceApi } from '../services/apiService';
import type { Product, TenderData, Expense, BidCalculationResult, ExpenseTemplate } from '../types';

// Utility functions
const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '-';
    if (isNaN(amount)) return '-';
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', minimumFractionDigits: 0 }).format(amount);
};

const parsePriceString = (priceStr: string | undefined): number => {
    if (!priceStr) return 0;
    // Remove currency symbols and spaces, then parse
    const cleaned = priceStr.replace(/[^\d,.]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
};

// Import from geminiService
const generateRobustSearchQuery = (product: Product): string => {
    // Simple implementation - in a real app this would be imported from geminiService
    
    // Detect language of the product name
    const detectLanguage = (text: string): 'uzbek_latin' | 'uzbek_cyrillic' | 'russian' | 'english' => {
        // Count characters from different alphabets
        const latinCount = (text.match(/[a-zA-Z]/g) || []).length;
        const cyrillicCount = (text.match(/[а-яА-ЯёЁ]/g) || []).length;
        const uzbekCyrillicCount = (text.match(/[ўЎқҚғҒҳҲ]/g) || []).length;
        
        if (uzbekCyrillicCount > 0) return 'uzbek_cyrillic';
        if (cyrillicCount > latinCount) return 'russian';
        if (latinCount > 0) return 'english';
        // Default to Uzbek Latin if no clear pattern
        return 'uzbek_latin';
    };
    
    // Language-specific important spec keys
    const importantSpecKeysByLanguage = {
        uzbek_latin: ['brand', 'model', 'ishlab chiqaruvchi', 'part number', 'artikul'],
        uzbek_cyrillic: ['бренд', 'модел', 'ишлаб чиқарувчи', 'партия номери', 'артикул'],
        russian: ['бренд', 'модель', 'производитель', 'номер партии', 'артикул'],
        english: ['brand', 'model', 'manufacturer', 'part number', 'article']
    };
    
    // Language-specific location modifiers
    const locationModifiersByLanguage = {
        uzbek_latin: 'Toshkentda',
        uzbek_cyrillic: 'Ташкентда',
        russian: 'Ташкент',
        english: 'Tashkent'
    };
    
    // Language-specific price keywords
    const priceKeywordsByLanguage = {
        uzbek_latin: 'narx',
        uzbek_cyrillic: 'нарх',
        russian: 'цена',
        english: 'price'
    };
    
    // Detect the language of the product name
    const language = detectLanguage(product.name);
    
    // Get language-specific keys
    const importantSpecKeys = importantSpecKeysByLanguage[language];
    const locationModifier = locationModifiersByLanguage[language];
    const priceKeyword = priceKeywordsByLanguage[language];
    
    // Extract important specification values
    const specValues: string[] = [];
    if (product.specifications) {
        for (const spec of product.specifications) {
            if (importantSpecKeys.some(is => spec.key.toLowerCase().includes(is))) {
                specValues.push(spec.value);
            }
        }
    }
    
    // Build search terms
    const parts = [product.name, ...specValues];
    const cleanedParts = parts
        .map(part => part.replace(/,/g, ' ').trim())
        .filter(part => part.length > 2);
    
    // Create multiple search queries for better coverage
    const uniqueParts = [...new Set(cleanedParts)];
    const searchQueries: string[] = [];
    
    // Main query with all terms
    searchQueries.push(uniqueParts.join(' ') + ` ${priceKeyword} ${locationModifier}`);
    
    // Individual term queries
    for (const part of uniqueParts) {
        searchQueries.push(`${part} ${priceKeyword} ${locationModifier}`);
    }
    
    // Return the main query (you could also return multiple queries if needed)
    return searchQueries[0];
};

const ProductItem: React.FC<{ 
    product: Product; 
    index: number; 
    onFindPrice: (index: number, searchType?: 'text' | 'image') => void; 
    onProductNameChange: (index: number, newName: string) => void; 
    onProductQuantityChange: (index: number, newQuantity: string) => void; 
    onMarketPriceChange: (index: number, newPrice: number) => void; 
    onOpenPriceSearch: (index: number, searchType?: 'text' | 'image') => void; 
    onShowPriceDetails: (index: number) => void;
}> = ({ product, index, onFindPrice, onProductNameChange, onProductQuantityChange, onMarketPriceChange, onOpenPriceSearch, onShowPriceDetails }) => {
    const { t } = useSettings();
    
    const getQuantityParts = (quantityStr: string) => {
        const s = String(quantityStr || '').trim();
        const match = s.match(/^(\d*[\.,]?\d+)\s*(.*)$/);
        if (match) {
            return {
                value: match[1],
                unit: match[2].trim()
            };
        }
        return { value: '1', unit: s };
    };

    const { value: quantityValue, unit: quantityUnit } = getQuantityParts(product.quantity);
    
    const handlePriceEditStart = () => {
        onOpenPriceSearch(index, 'text');
    };

    const startingPrice = useMemo(() => parsePriceString(product.price), [product.price]);
    const isMarketPriceHigh = product.foundMarketPrice !== undefined && startingPrice > 0 && product.foundMarketPrice > startingPrice;

    const importantSpecKeys = useMemo(() => ['brand', 'model', 'ishlab chiqaruvchi', 'модель', 'бренд', 'производитель', 'part number', 'артикул'], []);
    const keySpecs = useMemo(() => {
        const specs = product.specifications || [];
        return specs.filter(spec => 
            importantSpecKeys.some(key => spec.key.toLowerCase().includes(key))
        ).slice(0, 3);
    }, [product.specifications, importantSpecKeys]);

    const searchQueryPreview = useMemo(() => generateRobustSearchQuery(product), [product]);

    return (
        <motion.div layout className="border border-white/20 rounded-2xl p-4 mb-4 transition-shadow hover:shadow-2xl bg-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                     <div className="flex items-start sm:items-center gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 bg-primary text-white rounded-full font-bold text-lg mt-1 sm:mt-0">{index + 1}</span>
                        <input
                            type="text"
                            value={product.name}
                            onChange={(e) => onProductNameChange(index, e.target.value)}
                            className="text-lg font-semibold text-textDark bg-surface border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary w-full p-2"
                            aria-label={t('tenderDetails.productNameAria')}
                        />
                     </div>
                    <p className="text-sm text-textLight mt-2 pl-11">{product.description}</p>
                     <div className="mt-3 text-sm space-y-2 pl-11">
                        <div className="grid grid-cols-2 items-center gap-2">
                            <label htmlFor={`quantity-value-${index}`} className="font-semibold text-textLight">{t('tenderDetails.quantityLabel')}:</label>
                            <div className="flex items-stretch bg-surface border border-border rounded-lg focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                                <input id={`quantity-value-${index}`} type="number" value={quantityValue.replace(',', '.')} onChange={(e) => onProductQuantityChange(index, `${e.target.value} ${quantityUnit}`.trim())} className="text-sm text-textDark bg-transparent p-1.5 w-full outline-none rounded-l-md" aria-label={t('tenderDetails.quantityAria')} step="any" />
                                {quantityUnit && (<span className="flex items-center text-sm text-textLight px-3 border-l border-border whitespace-nowrap">{quantityUnit}</span>)}
                            </div>
                        </div>
                        {product.price && (
                             <div className="grid grid-cols-2 items-center gap-2 p-2 bg-surface rounded-lg border border-border">
                                <span className="font-bold text-textDark">{t('tenderDetails.startingPriceLabel')}:</span>
                                <span className="font-extrabold text-primary text-right">{product.price}</span>
                            </div>
                        )}
                        {product.dimensions && (<div className="grid grid-cols-2 items-center gap-2"><span className="font-semibold text-textLight">{t('tenderDetails.dimensions')}:</span><span>{product.dimensions}</span></div>)}
                        {product.weight && (<div className="grid grid-cols-2 items-center gap-2"><span className="font-semibold text-textLight">{t('tenderDetails.weight')}:</span><span>{product.weight}</span></div>)}
                        {product.voltage && (<div className="grid grid-cols-2 items-center gap-2"><span className="font-semibold text-textLight">{t('tenderDetails.voltage')}:</span><span>{product.voltage}</span></div>)}
                    </div>
                </div>
                <div className="space-y-3 flex flex-col justify-center">
                    {(keySpecs.length > 0 || searchQueryPreview) && (
                        <div className="p-3 bg-surface rounded-lg border border-border text-sm">
                            {keySpecs.length > 0 && (
                                <div className="mb-3">
                                    <h6 className="font-semibold text-textLight mb-1">{t('tenderDetails.keySpecifications')}:</h6>
                                    <div className="flex flex-wrap gap-2">
                                        {keySpecs.map((spec, i) => (
                                            <span key={i} className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">{spec.value}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {searchQueryPreview && (
                                 <div>
                                    <h6 className="font-semibold text-textLight mb-1">{t('tenderDetails.searchQueryPreview')}:</h6>
                                    <p className="text-xs text-textDark italic bg-white/10 p-2 rounded-md">{searchQueryPreview}</p>
                                </div>
                            )}
                        </div>
                    )}
                     <div className="p-3 bg-surface rounded-lg border border-border">
                        <label className="block text-sm font-semibold text-textLight mb-2">{t('tenderDetails.marketPriceLabel')}</label>
                        {product.isLoadingMarketPrice ? (
                            <div className="flex items-center text-textLight animate-pulse"><svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>{t('tenderDetails.findingMarketPrice')}</span></div>
                        ) : (product.foundMarketPrice !== undefined && product.foundMarketPrice !== null) ? (
                            <div className="flex items-center justify-between gap-2">
                                <div onClick={handlePriceEditStart} className="cursor-pointer group flex-grow">
                                     <div className="flex items-center gap-2" title={isMarketPriceHigh ? t('tenderDetails.marketPriceWarningTooltip') : ''}>
                                        <p className={`text-2xl font-extrabold transition-colors ${isMarketPriceHigh ? 'text-red-500' : 'text-textDark'}`}>{formatCurrency(product.foundMarketPrice)}</p>
                                        {isMarketPriceHigh && (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>)}
                                    </div>
                                    {product.sourceUrl && (<a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline group-hover:text-primary-dark" title={product.sourceName} onClick={(e) => e.stopPropagation()}>{product.sourceName ? (product.sourceName.length > 30 ? product.sourceName.substring(0, 27) + '...' : product.sourceName) : t('tenderDetails.viewSource')}</a>)}
                                </div>
                                <div className="flex items-center">
                                    <button onClick={() => onFindPrice(index, 'text')} className="flex-shrink-0 p-2 rounded-full hover:bg-primary/10 text-primary transition-colors" title={t('tenderDetails.researchPriceTooltip')}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg></button>
                                    <button onClick={() => onShowPriceDetails(index)} className="flex-shrink-0 p-2 rounded-full hover:bg-primary/10 text-primary transition-colors" title="Boshqa narxlarni qidirish"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg></button>
                                    {product.imageUrl && <button onClick={() => onFindPrice(index, 'image')} className="flex-shrink-0 p-2 rounded-full hover:bg-primary/10 text-primary transition-colors" title={t('tenderDetails.searchByImage')}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg></button>}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between w-full">
                                <span className="text-sm text-textLight italic flex-grow text-center sm:text-left">{t('tenderDetails.marketPriceNotFound')}</span>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button onClick={() => onFindPrice(index, 'text')} className="px-3 py-1.5 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-colors text-xs whitespace-nowrap">{t('tenderDetails.searchAgainButton')}</button>
                                    <button onClick={handlePriceEditStart} className="px-3 py-1.5 bg-surface text-textDark font-bold rounded-lg hover:bg-secondary transition-colors text-xs whitespace-nowrap">{t('tenderDetails.manualEntryButton')}</button>
                                </div>
                            </div>
                        )}
                    </div>
                    {product.finalBidPrice !== undefined && (
                         <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                            <p className="text-sm font-semibold text-textDark">{t('tenderDetails.finalBidPriceLabel')}:</p>
                            <p className="text-lg font-extrabold text-green-700">{formatCurrency(product.finalBidPrice)}</p>
                        </div>
                    )}
                </div>
            </div>
            {product.specifications && product.specifications.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/20">
                    <h5 className="text-sm font-bold text-textDark mb-2">{t('tenderDetails.specificationsTitle')}:</h5>
                    <dl className="text-sm columns-1 md:columns-2 gap-x-4">
                        {product.specifications.map((spec, i) => (
                            <div key={i} className="grid grid-cols-2 gap-2 py-1 px-2 even:bg-white/5 rounded break-inside-avoid-column">
                                <dt className="font-semibold text-textLight">{spec.key}</dt>
                                <dd className="text-textDark">{spec.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            )}
             <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h5 className="text-sm font-bold text-textDark mb-2">{t('tenderDetails.priceHistory.title')}:</h5>
                    <div className="p-4 bg-surface rounded-lg border border-border text-center text-textLight italic text-sm h-full flex items-center justify-center">
                        {t('tenderDetails.priceHistory.placeholder')}
                    </div>
                </div>
                 <div>
                    <h5 className="text-sm font-bold text-textDark mb-2">{t('tenderDetails.competitorAnalysis.title')}:</h5>
                    <div className="p-4 bg-surface rounded-lg border border-border text-textLight text-sm">
                        {t('tenderDetails.competitorAnalysis.placeholder')}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Add the main TenderDetails component
const TenderDetails: React.FC<{
  data: TenderData;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  bankPercent: string;
  setBankPercent: React.Dispatch<React.SetStateAction<string>>;
  taxPercent: string;
  setTaxPercent: React.Dispatch<React.SetStateAction<string>>;
  transportCost: string;
  setTransportCost: React.Dispatch<React.SetStateAction<string>>;
  bidResult: BidCalculationResult | null;
  onCalculateBid: () => void;
  onFindPrice: (productIndex: number, searchType?: 'text' | 'image') => void;
  onProductNameChange: (productIndex: number, newName: string) => void;
  onProductQuantityChange: (productIndex: number, newQuantity: string) => void;
  onMarketPriceChange: (productIndex: number, newPrice: number) => void;
  expenseTemplates: ExpenseTemplate[];
  onApplyTemplate: (template: ExpenseTemplate) => void;
  onOpenSaveTemplateModal: () => void;
  onOpenManageTemplatesModal: () => void;
  onBack: () => void;
}> = ({
  data,
  expenses,
  setExpenses,
  bankPercent,
  setBankPercent,
  taxPercent,
  setTaxPercent,
  transportCost,
  setTransportCost,
  bidResult,
  onCalculateBid,
  onFindPrice,
  onProductNameChange,
  onProductQuantityChange,
  onMarketPriceChange,
  expenseTemplates,
  onApplyTemplate,
  onOpenSaveTemplateModal,
  onOpenManageTemplatesModal,
  onBack
}) => {
  const { t } = useSettings();
  const [priceSearchModalOpen, setPriceSearchModalOpen] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState<number | null>(null);
  const [manualPrice, setManualPrice] = useState('');
  const [priceDetailsModalOpen, setPriceDetailsModalOpen] = useState(false);
  const [priceDetailsData, setPriceDetailsData] = useState<any>(null);

  const handleOpenPriceSearch = (productIndex: number) => {
    setCurrentProductIndex(productIndex);
    setPriceSearchModalOpen(true);
  };

  const handleShowPriceDetails = async (productIndex: number) => {
    // Get the product data
    const product = data.products[productIndex];
    if (!product) return;
    
    // Store the current product index
    setCurrentProductIndex(productIndex);
    
    try {
      // Fetch detailed price search results
      const priceResponse = await productPriceApi.getPrice(product);
      
      if (priceResponse.success) {
        // Store the detailed results
        setPriceDetailsData(priceResponse);
        setPriceDetailsModalOpen(true);
      } else {
        toast.error("Batafsil narx ma'lumotlarini olishda xatolik yuz berdi");
      }
    } catch (error) {
      console.error("Error fetching price details:", error);
      toast.error("Batafsil narx ma'lumotlarini olishda xatolik yuz berdi");
    }
  };

  const handleClosePriceSearch = () => {
    setPriceSearchModalOpen(false);
    setCurrentProductIndex(null);
    setManualPrice('');
  };

  const handleClosePriceDetails = () => {
    setPriceDetailsModalOpen(false);
    setPriceDetailsData(null);
  };

  const handleSaveManualPrice = () => {
    if (currentProductIndex !== null && manualPrice) {
      const price = parseFloat(manualPrice.replace(/\s/g, '').replace(',', '.'));
      if (!isNaN(price)) {
        onMarketPriceChange(currentProductIndex, price);
        handleClosePriceSearch();
      }
    }
  };

  const handleSelectPrice = (priceData: any) => {
    // Close the modal first
    handleClosePriceDetails();
    
    // Update the product's market price with the selected price
    if (currentProductIndex !== null) {
      onMarketPriceChange(currentProductIndex, priceData.price);
      
      // Also update the source information
      // We need to trigger a state update in the parent component to reflect these changes
      toast.success("Narx muvaffaqiyatli tanlandi!");
    }
  };

  const handleExpenseChange = (id: string, amount: string) => {
    setExpenses(prev => prev.map(expense => 
      expense.id === id ? { ...expense, amount } : expense
    ));
  };

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-primary hover:text-primary-dark font-bold py-2 px-4 rounded-lg transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        {t('tenderDetails.backButton')}
      </button>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-textDark">{data.tenderName}</h1>
            <p className="text-textLight">{t('tenderDetails.lotNumber')}: {data.lotNumber}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={onCalculateBid}
              className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors"
            >
              {t('tenderDetails.calculateBidButton')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-extrabold text-textDark mb-4">{t('tenderDetails.productsSection')}</h2>
              <div className="space-y-4">
                {data.products.map((product, index) => (
                  <ProductItem
                    key={index}
                    product={product}
                    index={index}
                    onFindPrice={onFindPrice}
                    onProductNameChange={onProductNameChange}
                    onProductQuantityChange={onProductQuantityChange}
                    onMarketPriceChange={onMarketPriceChange}
                    onOpenPriceSearch={handleOpenPriceSearch}
                    onShowPriceDetails={handleShowPriceDetails}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-extrabold text-textDark mb-4">{t('tenderDetails.expensesSection')}</h3>
              
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center gap-3">
                    <label htmlFor={`expense-${expense.id}`} className="flex-grow text-sm font-medium text-textDark">
                      {expense.name}
                    </label>
                    <div className="flex items-center">
                      <input
                        id={`expense-${expense.id}`}
                        type="text"
                        value={expense.amount}
                        onChange={(e) => handleExpenseChange(expense.id, e.target.value)}
                        className="w-20 text-sm text-textDark bg-white border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary p-2"
                      />
                      <span className="ml-2 text-sm text-textLight">
                        {expense.isPercentage ? '%' : t('tenderDetails.currency')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <button 
                  onClick={onOpenSaveTemplateModal}
                  className="w-full py-2 text-sm bg-surface text-textDark font-bold rounded-lg hover:bg-secondary transition-colors mb-2"
                >
                  {t('tenderDetails.saveTemplateButton')}
                </button>
                <button 
                  onClick={onOpenManageTemplatesModal}
                  className="w-full py-2 text-sm bg-surface text-textDark font-bold rounded-lg hover:bg-secondary transition-colors"
                >
                  {t('tenderDetails.manageTemplatesButton')}
                </button>
                
                {expenseTemplates.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-textDark mb-2">
                      {t('tenderDetails.applyTemplateLabel')}
                    </label>
                    <select 
                      onChange={(e) => {
                        const template = expenseTemplates.find(t => t.id === e.target.value);
                        if (template) onApplyTemplate(template);
                      }}
                      className="w-full text-sm text-textDark bg-white border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary p-2"
                    >
                      <option value="">{t('tenderDetails.selectTemplatePlaceholder')}</option>
                      {expenseTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {bidResult && (
              <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                <h3 className="text-lg font-extrabold text-textDark mb-4">{t('tenderDetails.bidCalculationResults')}</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-white/20">
                    <span className="text-textLight">{t('tenderDetails.totalMarketPrice')}</span>
                    <span className="font-bold text-textDark">{formatCurrency(bidResult.totalMarketPrice)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-white/20">
                    <span className="text-textLight">{t('tenderDetails.totalExpenses')}</span>
                    <span className="font-bold text-textDark">{formatCurrency(bidResult.totalExpenses)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-white/20">
                    <span className="text-textLight">{t('tenderDetails.totalCost')}</span>
                    <span className="font-bold text-textDark">{formatCurrency(bidResult.totalCost)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-textLight font-bold">{t('tenderDetails.finalBidPrice')}</span>
                    <span className="text-xl font-extrabold text-primary">{formatCurrency(bidResult.finalBidPrice)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price Search Modal */}
      {priceSearchModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-extrabold text-textDark mb-4">
              {t('tenderDetails.manualPriceEntry')}
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-textDark mb-2">
                {t('tenderDetails.enterPriceLabel')}
              </label>
              <input
                type="text"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                placeholder={t('tenderDetails.pricePlaceholder')}
                className="w-full text-textDark bg-surface border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary p-3"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleClosePriceSearch}
                className="flex-1 py-2 bg-surface text-textDark font-bold rounded-lg hover:bg-secondary transition-colors"
              >
                {t('tenderDetails.cancelButton')}
              </button>
              <button
                onClick={handleSaveManualPrice}
                disabled={!manualPrice}
                className="flex-1 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {t('tenderDetails.saveButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Details Modal */}
      {priceDetailsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-extrabold text-textDark">
                Boshqa narxlarni qidirish natijalari
              </h3>
              <button 
                onClick={handleClosePriceDetails}
                className="p-2 rounded-full hover:bg-surface text-textLight"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {priceDetailsData && priceDetailsData.best_per_language && (
                <div className="p-4 bg-surface rounded-lg border border-border">
                  <h4 className="font-bold text-textDark mb-2">Topilgan narxlar</h4>
                  <div className="space-y-3">
                    {Object.entries(priceDetailsData.best_per_language).map(([language, data]: [string, any]) => (
                      <div key={language} className="flex justify-between items-center p-3 bg-white rounded-lg border border-border">
                        <div>
                          <p className="font-bold text-textDark">
                            {language === 'russian' && 'Rus tili'}
                            {language === 'uzbek_cyrillic' && "O'zbekcha (krill)"}
                            {language === 'uzbek_latin' && "O'zbekcha (lotin)"}
                            {language === 'english' && 'Ingliz tili'}
                            {language === 'original' && 'Original til'}
                          </p>
                          <p className="text-sm text-textLight">{data.shop}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="font-extrabold text-textDark">{formatCurrency(data.price)}</p>
                            <a href={data.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                              Manbani ko'rish
                            </a>
                          </div>
                          <button 
                            onClick={() => handleSelectPrice(data)}
                            className="flex-shrink-0 px-3 py-1 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors"
                          >
                            Tanlash
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {priceDetailsData && priceDetailsData.all_results && (
                <div className="p-4 bg-surface rounded-lg border border-border">
                  <h4 className="font-bold text-textDark mb-2">Barcha natijalar</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {priceDetailsData.all_results.map((result: any, index: number) => (
                      <div key={index} className="p-3 bg-white rounded-lg border border-border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="font-bold text-textDark">{result.shop}</p>
                              <p className="font-extrabold text-textDark">{formatCurrency(result.price)}</p>
                            </div>
                            <p className="text-sm text-textLight mt-1">
                              {result.method} •{' '}
                              {result.language === 'russian' && 'rus tili'}
                              {result.language === 'uzbek_cyrillic' && "o'zbekcha (krill)"}
                              {result.language === 'uzbek_latin' && "o'zbekcha (lotin)"}
                              {result.language === 'english' && 'ingliz tili'}
                              {result.language === 'original' && 'original til'}
                            </p>
                            <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-2 inline-block">
                              {result.link}
                            </a>
                          </div>
                          <button 
                            onClick={() => handleSelectPrice(result)}
                            className="flex-shrink-0 ml-2 px-3 py-1 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors"
                          >
                            Tanlash
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleClosePriceDetails}
                  className="px-4 py-2 bg-surface text-textDark font-bold rounded-lg hover:bg-secondary transition-colors"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { TenderDetails, ProductItem };