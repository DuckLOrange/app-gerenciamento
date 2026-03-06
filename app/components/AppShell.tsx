'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginScreen from './LoginScreen';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (!currentUser) {
        return <LoginScreen />;
    }

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <>
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
            <div className="main-content">
                <Header onToggleSidebar={toggleSidebar} />
                {children}
            </div>
            {/* Overlay for mobile when sidebar is open */}
            {isSidebarOpen && (
                <div
                    onClick={closeSidebar}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 35,
                        backdropFilter: 'blur(4px)'
                    }}
                />
            )}
        </>
    );
}
