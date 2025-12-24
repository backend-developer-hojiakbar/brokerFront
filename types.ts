export interface Product {
  name: string;
  quantity: string;
  description: string;
  price?: string;
  imageUrl?: string;
  specifications: { key: string; value: string }[];
  dimensions?: string;
  weight?: string;
  voltage?: string;
  searchQuery?: string;
  foundMarketPrice?: number;
  sourceUrl?: string;
  sourceName?: string;
  finalBidPrice?: number;
  isLoadingMarketPrice?: boolean;
}

export interface Expense {
  id: string;
  name: string;
  amount: string;
  isPercentage: boolean;
}

export interface BidCalculationResult {
  totalMarketPrice: number;
  totalExpenses: number;
  totalCost: number;
  finalBidPrice: number;
}


export interface TenderData {
  id: string;
  analysisDate: string;
  summary: string;
  lotNumber: string;
  tenderName: string;
  customerName: string;
  startingPrice: string;
  applicationDeadline: string;
  products: Product[];
  brokerName?: string;
  userId: string;
  winProbability?: number;
  winProbabilityReasoning?: string;
}

export interface SerperSearchResult {
    title: string;
    link: string;
    snippet: string;
    position: number;
    foundPrice?: number;
    isLoadingPrice?: boolean;
    priceSource?: string;
    priceCurrency?: string;
}

export interface ExpenseTemplate {
  id: string;
  name: string;
  expenses: Expense[];
}

export interface ContractData {
  id: string;
  analysisDate: string;
  summary: string;
  parties: {
    customer: string;
    supplier: string;
  };
  contractNumber: string;
  contractDate: string;
  subject: string;
  totalValue: string;
  paymentTerms: string[];
  deliveryTerms: string[];
  penalties: string[];
  warranty: string;
  risks: string[];
  governingLaw: string;
  forceMajeure: string;
  complianceCheck: {
    status: 'success' | 'warning' | 'critical';
    notes: string[];
  };
  recommendations: string[];
  userId: string;
  products?: Product[];
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: 'admin' | 'broker';
  adminId?: string;
  xtTokens?: number;
  uzexTokens?: number;
}

// New types for multi-analysis workflow
export type AnalysisStatus = 'pending' | 'analyzing' | 'pricing' | 'completed' | 'error';
export type AnalysisOutcome = 'active' | 'won' | 'lost' | 'skipped';

export interface Analysis {
  id: string;
  input: {
    mainUrl: string;
    additionalUrls: string[];
    files: File[];
    selectedAnalystId: string;
  };
  platform: 'xt' | 'uzex'; // Add platform property
  status: AnalysisStatus;
  data: TenderData | null;
  error: string | null;
  outcome: AnalysisOutcome;
  analysisDate: string;
}

export interface ContractAnalysis {
  id: string;
  file: File;
  status: AnalysisStatus;
  data: ContractData | null;
  error: string | null;
  analysisDate: string;
  userId: string;
}

export interface TokenTransaction {
  id: number;
  user: number;
  platform: 'xt' | 'uzex';
  transaction_type: 'purchase' | 'spend';
  amount: number;
  timestamp: string;
  description: string;
  is_active: boolean;
}
