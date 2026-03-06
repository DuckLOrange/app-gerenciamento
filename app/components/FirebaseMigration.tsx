'use client';

import React, { useRef, useState } from 'react';
import { db } from '../firebase/config';
import { writeBatch, doc } from 'firebase/firestore';

export function FirebaseMigration() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setStatus('Lendo arquivo de backup...');

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const jsonContent = event.target?.result as string;
                const data = JSON.parse(jsonContent);

                setStatus('Migrando dados para a Nuvem... Por favor aguarde.');

                // Firestore batch limits to 500 writes per batch. For safety, assuming standard sizes, we might do separate batches or individual loops.
                // For simplicity and to avoid batch limits, let's just do sequential writes in promises but grouped by collection.

                const collectionsToMigrate = [
                    'empresas',
                    'funcionarios',
                    'registrosPonto',
                    'transacoes',
                    'notas',
                    'tarefas',
                    'anotacoes',
                    'itensEstoque',
                    'movimentacoesEstoque',
                ];

                let totalRegistros = 0;

                for (const colName of collectionsToMigrate) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const items = data[colName] as any[];
                    if (items && Array.isArray(items) && items.length > 0) {

                        // Chunking manually to respect potential limits or just looping (less limits on loop than batch)
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
                        if (operationCount > 0) {
                            await batch.commit();
                        }
                    }
                }

                setStatus(`Migração concluída com sucesso! ${totalRegistros} itens enviados.`);
                // Remove locally stored old items to force only firebase context
                localStorage.clear();

                // Let user reload to start fresh
                setTimeout(() => {
                    window.location.reload();
                }, 3000);

            } catch (err) {
                console.error('Error during migration', err);
                setStatus('Erro ao processar arquivo: ' + (err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg my-4">
            <h3 className="font-bold text-lg mb-2 text-blue-800">Sincronização com Nuvem (Firebase)</h3>
            <p className="text-sm text-gray-700 mb-4">
                O sistema agora salva os dados na nuvem para que fiquem sincronizados no seu celular e computador!
                <br /><br />
                Para não perder seus dados antigos, clique no botão abaixo e selecione o arquivo <strong>backup_app_gerenciamento_...json</strong> mais recente que você tem na sua pasta Downloads.
            </p>

            <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? 'Processando...' : 'Fazer Upload do Backup Inicial'}
            </button>

            {status && (
                <p className="mt-4 font-semibold text-blue-900">{status}</p>
            )}
        </div>
    );
}
