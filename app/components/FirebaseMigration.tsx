import React, { useRef, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { writeBatch, doc } from 'firebase/firestore';

export function FirebaseMigration() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(true); // Default to true while checking

    useEffect(() => {
        // Check if user dismissed it before
        const dismissed = localStorage.getItem('hideMigrationBanner') === 'true';
        setIsDismissed(dismissed);

        if (!dismissed) {
            // Show with a delay to avoid flashing during data load
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismissBanner = () => {
        setIsVisible(false);
        localStorage.setItem('hideMigrationBanner', 'true');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setStatus('Lendo backup...');

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const jsonContent = event.target?.result as string;
                const data = JSON.parse(jsonContent);

                setStatus('Sincronizando...');

                const collectionsToMigrate = [
                    'empresas', 'funcionarios', 'registrosPonto', 'transacoes',
                    'notas', 'tarefas', 'anotacoes', 'itensEstoque', 'movimentacoesEstoque',
                ];

                let totalRegistros = 0;
                for (const colName of collectionsToMigrate) {
                    const items = data[colName] as any[];
                    if (items && Array.isArray(items) && items.length > 0) {
                        const batch = writeBatch(db);
                        let operationCount = 0;

                        for (const item of items) {
                            const itemRef = doc(db, colName, item.id);
                            batch.set(itemRef, item);
                            operationCount++;
                            totalRegistros++;

                            if (operationCount >= 400) {
                                await batch.commit();
                                operationCount = 0;
                            }
                        }
                        if (operationCount > 0) await batch.commit();
                    }
                }

                setStatus(`Sucesso! ${totalRegistros} itens migrados.`);
                localStorage.clear();
                localStorage.setItem('hideMigrationBanner', 'true');

                setTimeout(() => window.location.reload(), 2000);
            } catch (err) {
                console.error(err);
                setStatus('Erro: ' + (err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    if (isDismissed || !isVisible) return null;

    return (
        <div className="glass-card animate-fade-in" style={{
            padding: '16px 20px',
            marginBottom: '24px',
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <button
                onClick={dismissBanner}
                style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                </div>

                <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>Sincronização com Nuvem</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0, paddingRight: '20px' }}>
                        Clique no botão para importar seu backup local para a nuvem.
                    </p>
                </div>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="btn-primary"
                    style={{
                        padding: '8px 16px',
                        fontSize: '12px',
                        height: 'auto',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {loading ? 'Processando...' : 'Importar Backup'}
                </button>
            </div>

            <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

            {status && (
                <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#3b82f6'
                }}>
                    {status}
                </div>
            )}
        </div>
    );
}
