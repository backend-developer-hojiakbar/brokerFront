import type { User, Analysis, TenderData, Product, Expense } from '../types';

// API base URL - update this to match your backend server
const API_BASE_URL = 'https://brokerapibro.pythonanywhere.com';

// Auth token storage
let authToken: string | null = null;

// Set auth token
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// Get auth token
export const getAuthToken = (): string | null => {
  return authToken;
};

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Token ${authToken}` }),
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // If it's a 401 Unauthorized error, clear the token
      if (response.status === 401) {
        setAuthToken(null);
        localStorage.removeItem('authToken');
      }
      
      throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
};

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await apiRequest('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    setAuthToken(response.token);
    return response;
  },

  register: async (userData: { username: string; password: string; email: string; first_name: string; last_name: string; role: string }) => {
    const response = await apiRequest('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    return response;
  },
};

// User API
export const userApi = {
  list: async () => {
    return await apiRequest('/api/users/');
  },

  get: async (id: number) => {
    return await apiRequest(`/api/users/${id}/`);
  },

  update: async (id: number, userData: Partial<User>) => {
    return await apiRequest(`/api/users/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  delete: async (id: number) => {
    return await apiRequest(`/api/users/${id}/`, {
      method: 'DELETE',
    });
  },
};

// Tender Analysis API
export const tenderAnalysisApi = {
  list: async () => {
    return await apiRequest('/api/tender-analyses/');
  },

  create: async (analysisData: { platform: 'xt' | 'uzex'; main_url: string; status: string }) => {
    return await apiRequest('/api/tender-analyses/', {
      method: 'POST',
      body: JSON.stringify(analysisData),
    });
  },

  get: async (id: string) => {
    return await apiRequest(`/api/tender-analyses/${id}/`);
  },

  update: async (id: string, analysisData: Partial<Analysis>) => {
    return await apiRequest(`/api/tender-analyses/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(analysisData),
    });
  },

  delete: async (id: string) => {
    return await apiRequest(`/api/tender-analyses/${id}/`, {
      method: 'DELETE',
    });
  },

  updateData: async (id: string, data: { 
    status?: string; 
    tender_data?: Partial<TenderData>; 
    products?: Partial<Product>[]; 
    expenses?: Partial<Expense>[] 
  }) => {
    return await apiRequest(`/api/tender-analyses/${id}/update/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateOutcome: async (id: string, outcome: 'won' | 'lost' | 'skipped') => {
    return await apiRequest(`/api/tender-analyses/${id}/outcome/`, {
      method: 'POST',
      body: JSON.stringify({ outcome }),
    });
  },
};

// Token API
export const tokenApi = {
  purchase: async (platform: 'xt' | 'uzex', amount: number, receipt: File | null = null) => {
    // If we have a receipt file, we need to use FormData
    if (receipt) {
      const formData = new FormData();
      formData.append('platform', platform);
      formData.append('amount', amount.toString());
      formData.append('receipt', receipt);
      
      const token = authToken || localStorage.getItem('authToken');
      const response = await fetch(API_BASE_URL + '/api/tokens/purchase/', {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Token ${token}` }),
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } else {
      // If no receipt, use the existing JSON approach
      return await apiRequest('/api/tokens/purchase/', {
        method: 'POST',
        body: JSON.stringify({ platform, amount }),
      });
    }
  },

  spend: async (platform: 'xt' | 'uzex') => {
    return await apiRequest('/api/tokens/spend/', {
      method: 'POST',
      body: JSON.stringify({ platform }),
    });
  },

  transactions: async () => {
    return await apiRequest('/api/tokens/transactions/');
  },
  
  activateTransaction: async (transactionId: number) => {
    return await apiRequest(`/api/tokens/transactions/${transactionId}/activate/`, {
      method: 'POST',
    });
  },
};

// Statistics API
export const statisticsApi = {
  get: async () => {
    return await apiRequest('/api/statistics/');
  },
};

// Product Price API
export const productPriceApi = {
  getPrice: async (product: { name: string; description?: string; specifications?: { key: string; value: string }[]; quantity?: string }) => {
    return await apiRequest('/api/product-price/', {
      method: 'POST',
      body: JSON.stringify({ product }),
    });
  },
};
