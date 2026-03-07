'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/funcionarios': 'Funcionários',
    '/empresas': 'Empresas',
    '/ponto': 'Gestão de Horas',
    '/agenda': 'Agenda & Notas',
    '/financeiro': 'Financeiro',
    '/faturamento': 'Faturamento',
    '/usuarios': 'Usuários',
};

interface HeaderProps {
    onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
    const pathname = usePathname();
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        const update = () => {
            const now = new Date();
            setCurrentDate(now.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }));
        };
        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, []);

    const title = pageTitles[pathname] || 'Dashboard';

    return (
        <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
            gap: '16px',
            flexWrap: 'wrap',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        background: 'linear-gradient(135deg, var(--foreground), var(--text-muted))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        margin: 0,
                    }}>
                        {title}
                    </h1>
                    <p style={{
                        fontSize: '13px',
                        color: 'var(--text-muted)',
                        marginTop: '4px',
                        textTransform: 'capitalize',
                    }}>
                        {currentDate}
                    </p>
                </div>
            </div>

            <div style={{ position: 'relative' }} className="hidden-on-mobile">
                <svg
                    style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                    }}
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    type="text"
                    placeholder="Buscar..."
                    className="search-input"
                    style={{ width: '280px' }}
                    id="search-input"
                />
            </div>

            {/* Mobile Menu Toggle (Right Side) */}
            <div className="md:hidden">
                <button
                    onClick={onToggleSidebar}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--foreground)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '14px'
                    }}
                    title="Menu"
                >
                    Menu
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
        </header >
    );
}
