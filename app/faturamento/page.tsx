'use client';

import { useState, useMemo } from 'react';
import { useData, NotaItem } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function FaturamentoPage() {
    const { funcionarios, registrosPonto, notas, addNota, updateNotaStatus, deleteNota, empresas } = useData();
    const { isAdmin } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [previewNota, setPreviewNota] = useState<string | null>(null);

    // Form state
    const [formMes, setFormMes] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [formEmpresaId, setFormEmpresaId] = useState('');
    const [selectedFuncionarios, setSelectedFuncionarios] = useState<string[]>([]);

    const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo');

    // Filter employees by selected company
    const funcionariosFiltrados = useMemo(() => {
        if (!formEmpresaId) return funcionariosAtivos;
        return funcionariosAtivos.filter(f => f.empresaId === formEmpresaId);
    }, [funcionariosAtivos, formEmpresaId]);

    // Calculate hours for each selected employee
    const itensCalculados = useMemo(() => {
        return selectedFuncionarios.map(funcId => {
            const func = funcionarios.find(f => f.id === funcId);
            if (!func) return null;
            const registros = registrosPonto.filter(
                r => r.funcionarioId === funcId && r.data.startsWith(formMes)
            );
            const totalHoras = registros.reduce((a, r) => a + r.horasTrabalhadas, 0);
            return {
                funcionarioId: func.id,
                funcionarioNome: func.nome,
                totalHoras,
                valorHora: func.valorHora,
                subtotal: totalHoras * func.valorHora,
            } as NotaItem;
        }).filter(Boolean) as NotaItem[];
    }, [selectedFuncionarios, formMes, registrosPonto, funcionarios]);

    const totalGeral = itensCalculados.reduce((a, item) => a + item.subtotal, 0);
    const totalHorasGeral = itensCalculados.reduce((a, item) => a + item.totalHoras, 0);

    const toggleFuncionario = (id: string) => {
        setSelectedFuncionarios(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedFuncionarios.length === funcionariosFiltrados.length) {
            setSelectedFuncionarios([]);
        } else {
            setSelectedFuncionarios(funcionariosFiltrados.map(f => f.id));
        }
    };

    const handleGerarNota = (e: React.FormEvent) => {
        e.preventDefault();
        if (itensCalculados.length === 0 || totalHorasGeral === 0) return;

        const emp = empresas.find(e => e.id === formEmpresaId);

        addNota({
            itens: itensCalculados,
            empresaId: emp?.id || '',
            empresaNome: emp?.nomeFantasia || emp?.razaoSocial || '',
            empresaCnpj: emp?.cnpj || '',
            mes: formMes,
            totalValor: totalGeral,
            status: 'pendente',
        });
        setModalOpen(false);
        setSelectedFuncionarios([]);
    };

    const handleDelete = (id: string) => {
        if (confirm('Excluir esta nota de faturamento?')) {
            deleteNota(id);
        }
    };

    const openModal = () => {
        setSelectedFuncionarios([]);
        setFormEmpresaId('');
        setModalOpen(true);
    };

    const notaPreview = previewNota ? notas.find(n => n.id === previewNota) : null;

    const mesesOptions = useMemo(() => {
        const months = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            months.push({ value, label });
        }
        return months;
    }, []);

    const formatMes = (mes: string) => {
        const [y, m] = mes.split('-');
        const d = new Date(parseInt(y), parseInt(m) - 1, 1);
        return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    };

    // Resumo
    const resumo = useMemo(() => {
        const totalPendente = notas.filter(n => n.status === 'pendente').reduce((a, n) => a + n.totalValor, 0);
        const totalPago = notas.filter(n => n.status === 'pago').reduce((a, n) => a + n.totalValor, 0);
        return { totalPendente, totalPago, total: notas.length };
    }, [notas]);

    return (
        <div>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div className="glass-card stat-card purple animate-fade-in" style={{ padding: '24px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Total de Notas</span>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{resumo.total}</div>
                </div>
                <div className="glass-card stat-card amber animate-fade-in animate-delay-100" style={{ padding: '24px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Pendentes</span>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#fbbf24' }}>
                        R$ {resumo.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="glass-card stat-card green animate-fade-in animate-delay-200" style={{ padding: '24px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Pagos</span>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#4ade80' }}>
                        R$ {resumo.totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <button className="btn-primary" onClick={openModal} id="btn-gerar-nota">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                    Gerar Nota de Honorários
                </button>
            </div>

            {/* Table */}
            <div className="glass-card animate-fade-in" style={{ overflow: 'hidden' }}>
                {notas.length === 0 ? (
                    <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Nenhuma nota emitida</p>
                        <p style={{ fontSize: '13px' }}>Gere notas a partir das horas do cartão ponto</p>
                    </div>
                ) : (
                    <table className="data-table" id="table-faturamento">
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>Mês Referência</th>
                                <th>Funcionários</th>
                                <th>Total Horas</th>
                                <th>Valor Total</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notas.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).map((nota) => {
                                const totalHoras = nota.itens.reduce((a, i) => a + i.totalHoras, 0);
                                return (
                                    <tr key={nota.id}>
                                        <td>
                                            {nota.empresaNome ? (
                                                <span className="badge info" style={{ fontSize: '11px' }}>
                                                    {nota.empresaNome}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ textTransform: 'capitalize' }}>
                                            {formatMes(nota.mes)}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {nota.itens.map((item, idx) => (
                                                    <span key={idx} style={{
                                                        fontSize: '11px', background: 'rgba(99,102,241,0.1)',
                                                        padding: '2px 8px', borderRadius: '6px', fontWeight: 600,
                                                    }}>
                                                        {item.funcionarioNome}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--accent-tertiary)' }}>{totalHoras.toFixed(1)}h</td>
                                        <td style={{ fontWeight: 700, fontSize: '15px' }}>
                                            R$ {nota.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${nota.status === 'pago' ? 'success' : 'warning'}`}
                                            >
                                                {nota.status === 'pago' ? '✓ Pago' : '⏳ Pendente'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                {nota.status === 'pendente' ? (
                                                    <button
                                                        className="btn-primary"
                                                        style={{ padding: '6px 14px', fontSize: '12px', background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                                                        onClick={() => updateNotaStatus(nota.id, 'pago')}
                                                    >
                                                        ✓ Confirmar Recebimento
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn-secondary"
                                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                                        onClick={() => updateNotaStatus(nota.id, 'pendente')}
                                                    >
                                                        ↩ Desfazer
                                                    </button>
                                                )}
                                                <button
                                                    className="btn-secondary"
                                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                                    onClick={() => setPreviewNota(nota.id)}
                                                >
                                                    Visualizar
                                                </button>
                                                {isAdmin && (
                                                    <button className="btn-danger" onClick={() => handleDelete(nota.id)}>
                                                        Excluir
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Gerar Nota */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Gerar Nota de Honorários" width="640px">
                <form onSubmit={handleGerarNota}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Empresa</label>
                            <select
                                className="form-select"
                                value={formEmpresaId}
                                onChange={e => {
                                    setFormEmpresaId(e.target.value);
                                    setSelectedFuncionarios([]);
                                }}
                                id="modal-select-empresa-nota"
                            >
                                <option value="">Todas as empresas</option>
                                {empresas.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.nomeFantasia || emp.razaoSocial} — {emp.cnpj}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Mês Referência</label>
                            <select
                                className="form-select"
                                value={formMes}
                                onChange={e => setFormMes(e.target.value)}
                                required
                                id="modal-select-mes-nota"
                            >
                                {mesesOptions.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
                            </select>
                        </div>
                    </div>

                    {/* Employee selection */}
                    <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <label style={{ fontWeight: 600, fontSize: '14px' }}>Selecione os Funcionários</label>
                            <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={selectAll}>
                                {selectedFuncionarios.length === funcionariosFiltrados.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                            </button>
                        </div>

                        {funcionariosFiltrados.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
                                Nenhum funcionário ativo encontrado
                            </p>
                        ) : (
                            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {funcionariosFiltrados.map(func => {
                                    const isSelected = selectedFuncionarios.includes(func.id);
                                    const registros = registrosPonto.filter(
                                        r => r.funcionarioId === func.id && r.data.startsWith(formMes)
                                    );
                                    const horas = registros.reduce((a, r) => a + r.horasTrabalhadas, 0);

                                    return (
                                        <div
                                            key={func.id}
                                            onClick={() => toggleFuncionario(func.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                                                background: isSelected ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                                                border: `1.5px solid ${isSelected ? 'rgba(99,102,241,0.4)' : 'var(--card-border)'}`,
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '20px', height: '20px', borderRadius: '6px',
                                                    border: `2px solid ${isSelected ? '#6366f1' : 'var(--card-border)'}`,
                                                    background: isSelected ? '#6366f1' : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.15s ease',
                                                }}>
                                                    {isSelected && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{func.nome}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        {func.cargo} • R$ {func.valorHora.toFixed(2)}/h
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700, fontSize: '13px', color: horas > 0 ? 'var(--accent-tertiary)' : 'var(--text-muted)' }}>
                                                    {horas.toFixed(1)}h
                                                </div>
                                                <div style={{ fontSize: '11px', color: horas > 0 ? '#4ade80' : 'var(--text-muted)' }}>
                                                    R$ {(horas * func.valorHora).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Total summary */}
                    {itensCalculados.length > 0 && (
                        <div className="glass-card" style={{
                            padding: '20px', marginTop: '16px',
                            background: 'rgba(99,102,241,0.06)',
                            border: '1px solid rgba(99,102,241,0.15)',
                        }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600 }}>
                                Resumo da Nota
                            </div>
                            {itensCalculados.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                                    <span>{item.funcionarioNome} ({item.totalHoras.toFixed(1)}h × R$ {item.valorHora.toFixed(2)})</span>
                                    <span style={{ fontWeight: 600 }}>R$ {item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            ))}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', paddingTop: '12px',
                                borderTop: '1px solid var(--card-border)', fontSize: '16px', fontWeight: 800, marginTop: '8px',
                            }}>
                                <span>TOTAL DA NOTA</span>
                                <span style={{ color: '#4ade80' }}>R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {totalHorasGeral === 0 && (
                                <p style={{ color: '#f87171', fontSize: '12px', marginTop: '8px' }}>
                                    ⚠ Nenhuma hora registrada para os funcionários selecionados neste mês
                                </p>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={itensCalculados.length === 0 || totalHorasGeral === 0}
                            style={{ opacity: (itensCalculados.length === 0 || totalHorasGeral === 0) ? 0.5 : 1 }}
                            id="btn-confirmar-nota"
                        >
                            Gerar Nota Única
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Preview Nota */}
            <Modal
                isOpen={!!previewNota}
                onClose={() => setPreviewNota(null)}
                title="Nota de Honorários"
                width="600px"
            >
                {notaPreview && (
                    <div id="nota-preview-content">
                        <div style={{
                            textAlign: 'center', marginBottom: '24px', paddingBottom: '20px',
                            borderBottom: '2px solid var(--card-border)',
                        }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '20px', fontWeight: 800, color: 'white', margin: '0 auto 12px',
                            }}>
                                G
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0' }}>NOTA DE HONORÁRIOS</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Emitida em {new Date(notaPreview.criadoEm).toLocaleDateString('pt-BR')}
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            {notaPreview.empresaNome && (
                                <div style={{ gridColumn: '1 / -1', padding: '12px 16px', background: 'rgba(99,102,241,0.06)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.12)' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                                        Empresa
                                    </div>
                                    <div style={{ fontSize: '15px', fontWeight: 700 }}>{notaPreview.empresaNome}</div>
                                    {notaPreview.empresaCnpj && (
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            CNPJ: {notaPreview.empresaCnpj}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                                    Período
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: 700, textTransform: 'capitalize' }}>
                                    {formatMes(notaPreview.mes)}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                                    Profissionais
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: 700 }}>
                                    {notaPreview.itens.length} funcionário{notaPreview.itens.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>

                        <table className="data-table" style={{ marginBottom: '24px' }}>
                            <thead>
                                <tr>
                                    <th>Profissional</th>
                                    <th style={{ textAlign: 'center' }}>Horas</th>
                                    <th style={{ textAlign: 'right' }}>Valor/h</th>
                                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notaPreview.itens.map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: 600 }}>{item.funcionarioNome}</td>
                                        <td style={{ textAlign: 'center' }}>{item.totalHoras.toFixed(1)}h</td>
                                        <td style={{ textAlign: 'right' }}>R$ {item.valorHora.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                            R$ {item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="total-row">
                                    <td colSpan={3} style={{ textAlign: 'right' }}>VALOR TOTAL</td>
                                    <td style={{ textAlign: 'right', fontSize: '16px' }}>
                                        R$ {notaPreview.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '16px', borderRadius: '10px', marginBottom: '20px',
                            background: notaPreview.status === 'pago' ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)',
                        }}>
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>Status</span>
                            <span className={`badge ${notaPreview.status === 'pago' ? 'success' : 'warning'}`} style={{ fontSize: '13px' }}>
                                {notaPreview.status === 'pago' ? '✓ Pago' : '⏳ Pendente'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" onClick={() => setPreviewNota(null)}>Fechar</button>
                            <button className="btn-primary" onClick={() => window.print()}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 6 2 18 2 18 9" />
                                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                    <rect x="6" y="14" width="12" height="8" />
                                </svg>
                                Imprimir
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
