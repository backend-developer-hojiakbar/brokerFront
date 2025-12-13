import React, { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../App';
import type { User } from '../types';
import { useAppStore } from '../store';
import { AddUserModal } from './AddBrokerModal';
import { toast } from 'react-hot-toast';
import { userApi, authApi } from '../services/apiService';

interface UsersPageProps {
  users: User[];
  setUsers: (users: User[]) => void;
  currentUser: User | null;
}

export const UsersPage: React.FC<UsersPageProps> = ({ users, setUsers, currentUser }) => {
    const { t } = useSettings();
    const { user } = useAuth();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch users from backend when component mounts
    useEffect(() => {
        const fetchUsers = async () => {
            if (!currentUser) return;
            
            try {
                setIsLoading(true);
                const backendUsers = await userApi.list();
                
                // Merge backend users with local users, prioritizing backend data
                const mergedUsers = [...users];
                
                backendUsers.forEach((backendUser: any) => {
                    const existingIndex = mergedUsers.findIndex(u => u.id === backendUser.id.toString());
                    const formattedUser: User = {
                        id: backendUser.id.toString(),
                        username: backendUser.username,
                        name: backendUser.first_name || backendUser.username,
                        role: backendUser.role,
                        adminId: backendUser.admin_id ? backendUser.admin_id.toString() : undefined,
                        xtTokens: backendUser.xt_tokens,
                        uzexTokens: backendUser.uzex_tokens
                    };
                    
                    if (existingIndex >= 0) {
                        mergedUsers[existingIndex] = formattedUser;
                    } else {
                        mergedUsers.push(formattedUser);
                    }
                });
                
                setUsers(mergedUsers);
            } catch (error) {
                console.error('Failed to fetch users:', error);
                toast.error(t('users.fetchError'));
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchUsers();
    }, [currentUser]);

    const handleAddUser = async (data: { name: string; username: string; password?: string; }) => {
        if (users.some(u => u.username === data.username)) {
            toast.error(t('users.errorExists'));
            return;
        }
        
        try {
            // Create user via backend API
            const userData = {
                username: data.username,
                password: data.password || '',
                email: `${data.username}@tender.local`, // Required field for backend
                first_name: data.name,
                last_name: '',
                role: 'broker'
            };
            
            const response = await authApi.register(userData);
            
            const newUser: User = {
                id: response.user_id.toString(),
                name: data.name,
                username: data.username,
                role: 'broker',
                adminId: user?.id
            };
            
            setUsers([...users, newUser]);
            toast.success(`${data.name} ${t('users.addedSuccessfully')}`);
            setIsAddModalOpen(false);
        } catch (error) {
            console.error('Failed to add user:', error);
            toast.error(t('users.addError'));
        }
    };

    const handleDeleteUser = async (id: string) => {
        const userToDelete = users.find(u => u.id === id);
        if (!userToDelete) return;
        
        if (userToDelete.role === 'admin') {
            toast.error(t('users.cannotDeleteAdmin'));
            return;
        }
        
        if (window.confirm(t('users.deleteConfirm', { userName: userToDelete.name }))) {
            try {
                // Delete user via backend API
                await userApi.delete(parseInt(id));
                
                setUsers(users.filter(u => u.id !== id));
                toast.success(`${userToDelete.name} ${t('users.deletedSuccessfully')}`);
            } catch (error) {
                console.error('Failed to delete user:', error);
                toast.error(t('users.deleteError'));
            }
        }
    };

    const brokers = users.filter(u => u.role === 'broker' && u.adminId === user?.id);

    return (
        <div className="animate-fade-in">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-4xl font-extrabold text-textDark">{t('users.title')}</h1>
                 <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-6 py-3 bg-primary text-white font-extrabold rounded-xl hover:bg-primary-dark transition shadow-lg hover:shadow-primary/40"
                    disabled={isLoading}
                >
                    {isLoading ? t('common.loading') : t('users.addButton')}
                </button>
            </div>
            <div className="glass-card p-6 md:p-8 rounded-3xl">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : users.length > 0 ? (
                    <div className="space-y-4">
                        {/* Admin Section */}
                        {users.filter(u => u.role === 'admin').map(adminUser => (
                             <div key={adminUser.id} className="p-3 bg-white/20 rounded-xl border-2 border-primary/50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-textDark font-bold text-lg">{adminUser.name}</span>
                                        <span className="ml-2 text-xs bg-primary text-white font-semibold px-2 py-0.5 rounded-full">{t('users.roleAdmin')}</span>
                                    </div>
                                    <span className="text-sm text-textLight font-mono">{adminUser.username}</span>
                                </div>
                             </div>
                        ))}
                         {/* Brokers Section */}
                        {brokers.map(brokerUser => (
                            <div key={brokerUser.id} className="p-3 bg-white/10 rounded-xl border border-white/20">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-textDark font-semibold">{brokerUser.name}</span>
                                        <span className="ml-2 text-xs bg-gray-500 text-white font-semibold px-2 py-0.5 rounded-full">{t('users.roleBroker')}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-textLight font-mono hidden sm:inline">{brokerUser.username}</span>
                                        <button 
                                            onClick={() => handleDeleteUser(brokerUser.id)} 
                                            className="p-2 rounded-lg text-textLight hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                            disabled={isLoading}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                </div>
                             </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-textLight py-6">{t('users.empty')}</p>
                )}
            </div>
            <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddUser} />
        </div>
    );
};
