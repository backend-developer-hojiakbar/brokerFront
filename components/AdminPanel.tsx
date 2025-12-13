import React, { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import AdminTokenTransactions from './AdminTokenTransactions';

interface AdminPanelProps {
  user: any;
  onTokensUpdated: (xtTokens: number, uzexTokens: number) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onTokensUpdated }) => {
  const { t } = useSettings();
  const [activeTab, setActiveTab] = useState<'transactions'>('transactions');

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('tokens.pendingTransactions')}
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'transactions' && (
            <AdminTokenTransactions onTokensUpdated={onTokensUpdated} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;