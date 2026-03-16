'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { currentUser, isAdmin, logout } = useAuth();

    const menuItems = [
        {
            href: '/',
            label: 'Dashboard',
            adminOnly: false,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            ),
        },
        {
            href: '/funcionarios',
            label: 'Funcionários',
            adminOnly: false,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
        },
        {
            href: '/ponto',
            label: 'Gestão de Horas',
            adminOnly: false,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            ),
        },
        {
            href: '/financeiro',
            label: 'Financeiro',
            adminOnly: false,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
            ),
        },
        {
            href: '/ferias',
            label: 'Férias',
            adminOnly: false,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 10V2H6v8a5 5 0 0 0-1.8 3.5" />
                    <path d="M22 13.5A3.5 3.5 0 1 1 18.5 10" />
                    <path d="M5.5 13.5A3.5 3.5 0 1 1 2 10" />
                    <path d="M12 2v20" />
                    <mask id="sun-mask" fill="white">
                        <circle cx="12" cy="12" r="12" />
                        <rect x="0" y="12" width="24" height="12" fill="black" />
                    </mask>
                    <g mask="url(#sun-mask)">
                        <circle cx="12" cy="11" r="5" />
                        <path d="M12 2v3M12 17v3M4 11H1M23 11h-3M5.6 4.6l2 2M16.4 17.4l2 2M5.6 17.4l2-2M16.4 4.6l2-2" />
                    </g>
                </svg>
            ),
        },
        {
            href: '/agenda',
            label: 'Agenda & Notas',
            adminOnly: false,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            ),
        },
        {
            href: '/faturamento',
            label: 'Faturamento',
            adminOnly: false,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                </svg>
            ),
        },
        {
            href: '/empresas',
            label: 'Empresas',
            adminOnly: false,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
                    <path d="M9 9h1" /><path d="M9 13h1" /><path d="M9 17h1" />
                </svg>
            ),
        },
        {
            href: '/almoxarifado',
            label: 'Almoxarifado',
            adminOnly: false,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
            ),
        },
        {
            href: '/usuarios',
            label: 'Usuários',
            adminOnly: true,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            ),
        },
    ];

    const visibleItems = menuItems.filter(item => !item.adminOnly || isAdmin);

    return (
        <aside
            className="sidebar"
            id="sidebar"
            style={{
                transform: isOpen ? 'translateX(0)' : undefined,
                visibility: isOpen ? 'visible' : undefined,
                zIndex: 40,
                display: 'flex',
                flexDirection: 'column',
                height: '100vh'
            }}
        >
            {/* Close Button (Mobile Only) */}
            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(255,255,255,0.06)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    zIndex: 50
                }}
                className="md:hidden"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            {/* Logo */}
            <div style={{ flexShrink: 0, padding: '24px 20px', borderBottom: '1px solid var(--card-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                        src="/logo.png"
                        alt="Logo Gestão"
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            objectFit: 'cover',
                            background: 'white'
                        }}
                    />
                    <div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>
                            Gestão
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                            Sistema Empresarial
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', padding: '8px 16px', marginBottom: '4px' }}>
                    Menu Principal
                </div>
                {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${isActive ? 'active' : ''}`}
                            id={`nav-${item.href.replace('/', '') || 'dashboard'}`}
                            onClick={onClose}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div style={{
                flexShrink: 0,
                marginTop: 'auto',
                background: 'var(--sidebar-bg)',
                padding: '16px 20px',
                borderTop: '1px solid var(--card-border)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar" style={{
                            background: isAdmin
                                ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
                                : 'linear-gradient(135deg, #06b6d4, #22d3ee)',
                        }}>
                            {currentUser?.nome.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{currentUser?.nome}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {isAdmin ? '👑 Admin' : '👤 Usuário'}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        title="Sair"
                        id="btn-logout"
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: 'none',
                            borderRadius: '8px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </div>
        </aside>
    );
}
