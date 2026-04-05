'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase/config';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    sendPasswordResetEmail,
    User as FirebaseUser
} from 'firebase/auth';
import {
    doc,
    onSnapshot,
    setDoc,
    deleteDoc,
    collection,
    query
} from 'firebase/firestore';

export interface AppUser {
    id: string; // This will map to Firebase UID
    username: string; // We'll use email as username or map it
    nome: string;
    role: 'admin' | 'usuario';
    criadoEm: string;
    oculto?: boolean;
}

interface AuthContextType {
    currentUser: AppUser | null;
    isAdmin: boolean;
    users: AppUser[];
    login: (email: string, senha: string) => Promise<void>;
    logout: () => Promise<void>;
    addUserProfile: (u: Omit<AppUser, 'id' | 'criadoEm'> & { id: string }) => Promise<void>;
    updateUserProfile: (id: string, data: Partial<AppUser>) => Promise<void>;
    deleteUserProfile: (id: string) => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPER_ADMIN_UID = 'IsKDEOntHNV58tWbRoEmVdkyP9n2';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [loaded, setLoaded] = useState(false);

    // 1. Monitor Firebase Auth State
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
            if (fbUser) {
                // Fetch profile from Firestore
                const unsubProfile = onSnapshot(doc(db, 'perfisUsuarios', fbUser.uid), async (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data() as AppUser;

                        // Força Adilson a ser admin e oculto se o UID bater
                        if (fbUser.uid === SUPER_ADMIN_UID && (!userData.oculto || userData.role !== 'admin')) {
                            await setDoc(doc(db, 'perfisUsuarios', fbUser.uid), {
                                oculto: true,
                                role: 'admin',
                                nome: 'Adilson',
                                username: fbUser.email || 'adilson@app.com'
                            }, { merge: true });
                        }

                        setCurrentUser({ ...userData, id: fbUser.uid });
                    } else {
                        // Create initial profile
                        const isSuperAdmin = fbUser.uid === SUPER_ADMIN_UID;
                        const newProfile = {
                            username: fbUser.email || '',
                            nome: isSuperAdmin ? 'Adilson' : (fbUser.displayName || 'Usuário'),
                            role: isSuperAdmin ? 'admin' : 'usuario',
                            oculto: isSuperAdmin,
                            criadoEm: new Date().toISOString()
                        };
                        await setDoc(doc(db, 'perfisUsuarios', fbUser.uid), newProfile);
                    }
                });
                return () => unsubProfile();
            } else {
                setCurrentUser(null);
            }
        });

        // 2. Monitor all user profiles (for admin management)
        const unsubUsers = onSnapshot(query(collection(db, 'perfisUsuarios')), (querySnapshot) => {
            const docs: AppUser[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as AppUser;
                // Oculta usuários marcados como oculto, a menos que seja o próprio Super-Admin consultando
                if (data.oculto && auth.currentUser?.uid !== SUPER_ADMIN_UID) {
                    return;
                }
                docs.push({ ...data, id: doc.id });
            });
            setUsers(docs);
            setLoaded(true);
        });

        return () => {
            unsubscribeAuth();
            unsubUsers();
        };
    }, []);

    const login = useCallback(async (email: string, senha: string): Promise<void> => {
        const trimmedEmail = email.trim();
        const trimmedSenha = senha.trim();
        const validEmail = (trimmedEmail.includes('@') ? trimmedEmail : `${trimmedEmail}@app.com`);

        try {
            await signInWithEmailAndPassword(auth, validEmail, trimmedSenha);
        } catch (error: unknown) {
            console.error('Erro no login:', error);
            const err = error as Error & { code?: string };
            // Translate common Firebase errors
            if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                throw new Error(`Usuário ou senha incorretos. (Tentativa para: ${validEmail})`);
            } else if (err.code === 'auth/unauthorized-domain') {
                throw new Error('Acesso negado: Este domínio/IP não está autorizado no Console do Firebase.');
            } else {
                throw new Error(err.message || 'Erro ao tentar fazer login. Verifique sua conexão.');
            }
        }
    }, []);

    const logout = useCallback(async () => {
        await signOut(auth);
    }, []);

    const addUserProfile = useCallback(async (u: Omit<AppUser, 'id' | 'criadoEm'> & { id: string }) => {
        const id = u.id; // Usually we use the Firebase UID here
        await setDoc(doc(db, 'perfisUsuarios', id), {
            ...u,
            criadoEm: new Date().toISOString()
        });
    }, []);

    const updateUserProfile = useCallback(async (id: string, data: Partial<AppUser>) => {
        await setDoc(doc(db, 'perfisUsuarios', id), data, { merge: true });
    }, []);

    const deleteUserProfile = useCallback(async (id: string) => {
        await deleteDoc(doc(db, 'perfisUsuarios', id));
    }, []);

    const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
        const user = auth.currentUser;
        if (!user || !user.email) throw new Error('Usuário não autenticado.');

        const credential = EmailAuthProvider.credential(user.email, currentPassword);

        try {
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
        } catch (error: any) {
            console.error('Erro ao trocar senha:', error);
            if (error.code === 'auth/wrong-password') {
                throw new Error('A senha atual está incorreta.');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('A nova senha é muito fraca. Tente uma senha mais curta ou complexa.');
            }
            throw new Error(error.message || 'Erro ao trocar senha.');
        }
    }, []);

    const resetPassword = useCallback(async (email: string) => {
        const trimmedEmail = email.trim();
        const validEmail = (trimmedEmail.includes('@') ? trimmedEmail : `${trimmedEmail}@app.com`);

        try {
            await sendPasswordResetEmail(auth, validEmail);
        } catch (error: any) {
            console.error('Erro ao enviar e-mail de recuperação:', error);
            if (error.code === 'auth/user-not-found') {
                throw new Error('Usuário não encontrado.');
            }
            throw new Error(error.message || 'Erro ao enviar e-mail de recuperação.');
        }
    }, []);

    const isAdmin = currentUser?.role === 'admin';

    // During loading, we show nothing or a spinner
    if (!loaded) return null;

    return (
        <AuthContext.Provider value={{
            currentUser,
            isAdmin,
            users,
            login,
            logout,
            addUserProfile,
            updateUserProfile,
            deleteUserProfile,
            changePassword,
            resetPassword,
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
