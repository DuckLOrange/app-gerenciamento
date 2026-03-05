'use client';

import { useAuth } from '../context/AuthContext';
import LoginScreen from './LoginScreen';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <LoginScreen />;
    }

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <Header />
                {children}
            </div>
        </>
    );
}
