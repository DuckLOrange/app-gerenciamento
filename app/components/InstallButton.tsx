'use client';

import { useState, useEffect } from 'react';

export default function InstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        setIsIOS(isIOSDevice);

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // For mobile/iOS, we want to show the button as an "Info" button if native prompt isn't available
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

        if (!isStandalone) {
            if (isIOSDevice) {
                // On iOS, we always want to show the button (as an instruction trigger)
                setIsVisible(true);
            } else {
                // On other devices, we wait for beforeinstallprompt
                // But let's show it after 5 seconds as a fallback if not standalone
                const timer = setTimeout(() => {
                    if (!isStandalone) setIsVisible(true);
                }, 5000);
                return () => clearTimeout(timer);
            }
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowInstructions(true);
            return;
        }

        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setIsVisible(false);
            }
        } else {
            // If no native prompt, show instructions for others too
            setShowInstructions(true);
        }
    };

    if (!isVisible) return null;

    return (
        <>
            <button
                onClick={handleInstallClick}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 1000,
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '12px 20px',
                    fontWeight: 700,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
                    cursor: 'pointer',
                    animation: 'button-pulse 2s infinite',
                    transition: 'transform 0.2s ease',
                }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {isIOS ? 'Como Instalar' : 'Baixar Aplicativo'}
            </button>

            {showInstructions && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        backdropFilter: 'blur(5px)',
                    }}
                    onClick={() => setShowInstructions(false)}
                >
                    <div
                        style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--card-border)',
                            borderRadius: '24px',
                            padding: '32px',
                            maxWidth: '400px',
                            width: '100%',
                            textAlign: 'center',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 style={{ marginBottom: '16px', color: 'white' }}>Instalar Aplicativo</h2>

                        {isIOS ? (
                            <div style={{ textAlign: 'left', fontSize: '15px', color: 'var(--foreground)' }}>
                                <p style={{ marginBottom: '12px' }}>Para instalar no seu iPhone:</p>
                                <ol style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                                    <li>Toque no ícone de <strong>Compartilhar</strong> (quadrado com seta pra cima <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle' }}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>)</li>
                                    <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
                                    <li>Toque em <strong>"Adicionar"</strong> no topo da tela.</li>
                                </ol>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'left', fontSize: '15px', color: 'var(--foreground)' }}>
                                <p style={{ marginBottom: '12px' }}>Para instalar no seu Android:</p>
                                <ol style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                                    <li>Toque no ícone de <strong>Menu</strong> (três pontinhos <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle' }}><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>)</li>
                                    <li>Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                                </ol>
                            </div>
                        )}

                        <button
                            onClick={() => setShowInstructions(false)}
                            className="btn-primary"
                            style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}
                        >
                            Entendi
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
