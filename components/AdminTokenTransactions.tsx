import React, { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { tokenApi } from '../services/apiService';
import type { TokenTransaction } from '../types';

interface AdminTokenTransactionsProps {
  onTokensUpdated: (xtTokens: number, uzexTokens: number) => void;
}

const AdminTokenTransactions: React.FC<AdminTokenTransactionsProps> = ({ onTokensUpdated }) => {
  const { t } = useSettings();
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tokenApi.transactions();
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError(t('errors.failedToLoadTransactions'));
    } finally {
      setLoading(false);
    }
  };

  const handleActivateTransaction = async (transactionId: number) => {
    try {
      setActivating(transactionId);
      setError(null);
      const response = await tokenApi.activateTransaction(transactionId);
      
      // Update the transaction in the list
      setTransactions(prev => prev.map(tx => 
        tx.id === transactionId ? { ...tx, is_active: true } : tx
      ));
      
      // Notify parent about token updates
      if (response.xtTokens !== undefined && response.uzexTokens !== undefined) {
        onTokensUpdated(response.xtTokens, response.uzexTokens);
      }
      
      // Show success message
      alert(response.message || t('tokens.activationSuccess'));
    } catch (err) {
      console.error('Failed to activate transaction:', err);
      setError(t('errors.failedToActivateTransaction'));
    } finally {
      setActivating(null);
    }
  };

  const showImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">{t('tokens.pendingTransactions')}</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={closeImagePreview}>
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute top-2 right-2 bg-white rounded-full p-2 text-gray-600 hover:text-gray-900"
              onClick={closeImagePreview}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={previewImage} alt="Receipt preview" className="max-w-full max-h-full object-contain" />
          </div>
        </div>
      )}
      
      {transactions.length === 0 ? (
        <p className="text-gray-500">{t('tokens.noPendingTransactions')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('tokens.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('tokens.platform')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('tokens.amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('tokens.description')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('tokens.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('tokens.receipt')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('tokens.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('tokens.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions
                .filter(tx => tx.transaction_type === 'purchase' && !tx.is_active)
                .map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.platform.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.amount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.receipt_url ? (
                        <button 
                          onClick={() => showImagePreview(transaction.receipt_url)}
                          className="text-blue-600 hover:underline"
                        >
                          {t('tokens.viewReceipt')}
                        </button>
                      ) : (
                        t('tokens.noReceipt')
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.is_active ? t('tokens.active') : t('tokens.pending')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!transaction.is_active && (
                        <button
                          onClick={() => handleActivateTransaction(transaction.id)}
                          disabled={activating === transaction.id}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          {activating === transaction.id ? t('tokens.activating') : t('tokens.activate')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-4">
        <button
          onClick={loadTransactions}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          {t('tokens.refresh')}
        </button>
      </div>
    </div>
  );
};

export default AdminTokenTransactions;