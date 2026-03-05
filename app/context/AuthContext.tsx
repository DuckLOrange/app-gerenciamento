'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AppUser {
    id: string;
    username: string;
    senha: string;
    nome: string;
    role: 'admin' | 'usuario';
    criadoEm: string;
}

interface AuthContextType {
    currentUser: AppUser | null;
    isAdmin: boolean;
    users: AppUser[];
    login: (username: string, senha: string) => boolean;
    logout: () => void;
    addUser: (u: Omit<AppUser, 'id' | 'criadoEm'>) => void;
    updateUser: (id: string, data: Partial<AppUser>) => void;
    deleteUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

const DEFAULT_USER_SOELI: AppUser = {
    id: 'user-soeli',
    username: 'SoeliHeming',
    senha: 'Soeli@11',
    nome: 'Soeli Heming',
    role: 'admin', // Promoted to admin
    criadoEm: new Date().toISOString(),
};

const DEFAULT_USERS = [DEFAULT_USER_SOELI];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [loaded, setLoaded] = useState(false);

    // Load from localStorage
    useEffect(() => {
        try {
            const storedUsers = localStorage.getItem('app_users');
            let parsedUsers: AppUser[] = storedUsers ? JSON.parse(storedUsers) : [];

            // Remove the old 'adimin' typo user if it exists
            parsedUsers = parsedUsers.filter(u => u.id !== 'admin-default');

            // Ensure all default users exist (check by ID to avoid duplicates)
            for (const defaultUser of DEFAULT_USERS) {
                const exists = parsedUsers.findIndex(u => u.id === defaultUser.id);
                if (exists === -1) {
                    parsedUsers.push(defaultUser);
                } else {
                    // Force update role for existing default users if they changed in code (like Soeli to admin)
                    if (parsedUsers[exists].role !== defaultUser.role) {
                        parsedUsers[exists].role = defaultUser.role;
                    }
                }
            }
            // Remove duplicates by ID
            const seen = new Set<string>();
            const deduped = parsedUsers.filter(u => {
                if (seen.has(u.id)) return false;
                seen.add(u.id);
                return true;
            });
            setUsers(deduped);

            // Check for active session (sessionStorage = expires on tab close)
            const sessionUserId = sessionStorage.getItem('app_session');
            if (sessionUserId) {
                const user = deduped.find(u => u.id === sessionUserId);
                if (user) setCurrentUser(user);
            }
        } catch {
            setUsers([...DEFAULT_USERS]);
        }
        setLoaded(true);
    }, []);

    // Save users to localStorage
    useEffect(() => {
        if (loaded) {
            localStorage.setItem('app_users', JSON.stringify(users));
        }
    }, [users, loaded]);

    const login = useCallback((username: string, senha: string): boolean => {
        const user = users.find(u => u.username === username && u.senha === senha);
        if (user) {
            setCurrentUser(user);
            sessionStorage.setItem('app_session', user.id);
            return true;
        }
        return false;
    }, [users]);

    const logout = useCallback(() => {
        setCurrentUser(null);
        sessionStorage.removeItem('app_session');
    }, []);

    const addUser = useCallback((u: Omit<AppUser, 'id' | 'criadoEm'>) => {
        setUsers(prev => [...prev, { ...u, id: generateId(), criadoEm: new Date().toISOString() }]);
    }, []);

    const updateUser = useCallback((id: string, data: Partial<AppUser>) => {
        setUsers(prev => {
            const updated = prev.map(u => u.id === id ? { ...u, ...data } : u);
            // Update current user if it's the one being modified
            const updatedUser = updated.find(u => u.id === id);
            if (updatedUser && currentUser?.id === id) {
                setCurrentUser(updatedUser);
            }
            return updated;
        });
    }, [currentUser]);

    const deleteUser = useCallback((id: string) => {
        if (id === 'user-soeli') return; // Cannot delete Soeli Admin account
        setUsers(prev => prev.filter(u => u.id !== id));
    }, []);

    const isAdmin = currentUser?.role === 'admin';

    if (!loaded) return null;

    return (
        <AuthContext.Provider value={{
            currentUser,
            isAdmin,
            users,
            login,
            logout,
            addUser,
            updateUser,
            deleteUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
