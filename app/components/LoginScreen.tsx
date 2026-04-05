'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import InstallButton from './InstallButton';

export default function LoginScreen() {
    const { login, resetPassword } = useAuth();
    const [username, setUsername] = useState('');
    const [senha, setSenha] = useState('');
    const [isResetMode, setIsResetMode] = useState(false);
    const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setResetStatus(null);
        setLoading(true);

        try {
            if (isResetMode) {
                if (!username) throw new Error('Por favor, informe seu usuário ou e-mail.');
                await resetPassword(username);
                setResetStatus({ type: 'success', message: 'E-mail de recuperação enviado! Verifique sua caixa de entrada.' });
            } else {
                await login(username, senha);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro ao processar solicitação.';
            if (isResetMode) setResetStatus({ type: 'error', message: msg });
            else setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--background)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background gradient orbs */}
            <div style={{
                position: 'absolute',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)',
                top: '-100px',
                right: '-100px',
            }} />
            <div style={{
                position: 'absolute',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)',
                bottom: '-50px',
                left: '-50px',
            }} />

            <div className="glass-card" style={{
                width: '420px',
                maxWidth: '90vw',
                padding: '0',
                animation: 'slideUp 0.5s ease',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Header */}
                <div style={{
                    padding: '40px 40px 24px',
                    textAlign: 'center',
                    borderBottom: '1px solid var(--card-border)',
                }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        fontWeight: 800,
                        color: 'white',
                        margin: '0 auto 16px',
                        boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
                    }}>
                        G
                    </div>
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: 800,
                        margin: '0 0 6px 0',
                        background: 'linear-gradient(135deg, var(--foreground), var(--text-muted))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Gestão Empresarial
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                        {isResetMode ? 'Digite seu usuário para receber o link' : 'Faça login para acessar o sistema'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '32px 40px 40px' }}>
                    {error && !isResetMode && (
                        <div style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: '#f87171',
                            fontSize: '13px',
                            fontWeight: 600,
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {resetStatus && (
                        <div style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: resetStatus.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                            border: `1px solid ${resetStatus.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                            color: resetStatus.type === 'success' ? '#4ade80' : '#f87171',
                            fontSize: '13px',
                            fontWeight: 600,
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {resetStatus.type === 'success' ? (
                                    <polyline points="20 6 9 17 4 12" />
                                ) : (
                                    <>
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </>
                                )}
                            </svg>
                            {resetStatus.message}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Usuário ou E-mail</label>
                        <div style={{ position: 'relative' }}>
                            <svg
                                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            >
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <input
                                type="text"
                                className="form-input"
                                style={{ paddingLeft: '40px' }}
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Digite seu usuário"
                                required
                                autoFocus
                                id="login-username"
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    {!isResetMode && (
                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label>Senha</label>
                                <button
                                    type="button"
                                    onClick={() => setIsResetMode(true)}
                                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                                >
                                    Esqueceu a senha?
                                </button>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <svg
                                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                >
                                    <rect x="3" y="11" width="18" height="11" rx="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    type="password"
                                    className="form-input"
                                    style={{ paddingLeft: '40px' }}
                                    value={senha}
                                    onChange={e => setSenha(e.target.value)}
                                    placeholder="Digite sua senha"
                                    required={!isResetMode}
                                    id="login-password"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            marginTop: '8px',
                            padding: '12px',
                            fontSize: '15px',
                            opacity: loading ? 0.7 : 1,
                        }}
                        id="btn-login"
                    >
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
                                </svg>
                                {isResetMode ? 'Enviando...' : 'Entrando...'}
                            </span>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    {isResetMode ? (
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    ) : (
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    )}
                                    {isResetMode ? (
                                        <polyline points="22,6 12,13 2,6" />
                                    ) : (
                                        <>
                                            <polyline points="10 17 15 12 10 7" />
                                            <line x1="15" y1="12" x2="3" y2="12" />
                                        </>
                                    )}
                                </svg>
                                {isResetMode ? 'Enviar Link de Recuperação' : 'Entrar'}
                            </>
                        )}
                    </button>

                    {isResetMode && (
                        <button
                            type="button"
                            onClick={() => { setIsResetMode(false); setResetStatus(null); }}
                            className="btn-secondary"
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                marginTop: '12px',
                                padding: '10px',
                                fontSize: '13px',
                                background: 'transparent'
                            }}
                        >
                            Voltar para o Login
                        </button>
                    )}
                </form>
            </div>
            <InstallButton />
        </div>
    );
}
