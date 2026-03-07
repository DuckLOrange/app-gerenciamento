'use client';

import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

type ViewMode = 'diario' | 'mensal' | 'total';

export default function PontoPage() {
    const { funcionarios, registrosPonto, addRegistroPonto, deleteRegistroPonto } = useData();
    const { isAdmin } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('diario');
    const [selectedFunc, setSelectedFunc] = useState('');
    const [selectedMes, setSelectedMes] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [form, setForm] = useState({ funcionarioId: '', data: '', entrada: '', saida: '' });

    const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo');

    // Gerar opções de meses
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

    // ============ DIÁRIO: registros filtrados por funcionário e mês ============
    const registrosDiarios = useMemo(() => {
        return registrosPonto
            .filter(r => {
                const matchFunc = !selectedFunc || r.funcionarioId === selectedFunc;
                const matchMes = r.data.startsWith(selectedMes);
                return matchFunc && matchMes;
            })
            .sort((a, b) => a.data.localeCompare(b.data));
    }, [registrosPonto, selectedFunc, selectedMes]);

    const totalHorasDiario = registrosDiarios.reduce((acc, r) => acc + r.horasTrabalhadas, 0);

    // ============ MENSAL: resumo mensal separado por funcionário ============
    const resumoMensal = useMemo(() => {
        const registrosMes = registrosPonto.filter(r => r.data.startsWith(selectedMes));
        const porFuncionario = new Map<string, { totalHoras: number; totalDias: number; registros: number }>();

        registrosMes.forEach(r => {
            const current = porFuncionario.get(r.funcionarioId) || { totalHoras: 0, totalDias: 0, registros: 0 };
            current.totalHoras += r.horasTrabalhadas;
            current.registros += 1;
            // Contar dias únicos
            const diasSet = new Set(
                registrosMes.filter(rr => rr.funcionarioId === r.funcionarioId).map(rr => rr.data)
            );
            current.totalDias = diasSet.size;
            porFuncionario.set(r.funcionarioId, current);
        });

        return Array.from(porFuncionario.entries()).map(([funcId, data]) => {
            const func = funcionarios.find(f => f.id === funcId);
            return {
                funcionarioId: funcId,
                nome: func?.nome || 'Desconhecido',
                cargo: func?.cargo || '',
                valorHora: func?.valorHora || 0,
                ...data,
                mediaHorasDia: data.totalDias > 0 ? data.totalHoras / data.totalDias : 0,
                valorTotal: (func?.valorHora || 0) * data.totalHoras,
            };
        }).sort((a, b) => b.totalHoras - a.totalHoras);
    }, [registrosPonto, selectedMes, funcionarios]);

    const totalGeralMensal = resumoMensal.reduce((acc, r) => acc + r.totalHoras, 0);
    const totalValorMensal = resumoMensal.reduce((acc, r) => acc + r.valorTotal, 0);

    // ============ TOTAL: todos os meses, agrupado por funcionário ============
    const resumoTotal = useMemo(() => {
        const porFuncionario = new Map<string, {
            totalHoras: number;
            totalDias: number;
            meses: Set<string>;
        }>();

        registrosPonto.forEach(r => {
            const current = porFuncionario.get(r.funcionarioId) || { totalHoras: 0, totalDias: 0, meses: new Set<string>() };
            current.totalHoras += r.horasTrabalhadas;
            current.meses.add(r.data.substring(0, 7));
            porFuncionario.set(r.funcionarioId, current);
        });

        // Count unique days per employee
        registrosPonto.forEach(r => {
            const current = porFuncionario.get(r.funcionarioId);
            if (current) {
                const diasSet = new Set(
                    registrosPonto.filter(rr => rr.funcionarioId === r.funcionarioId).map(rr => rr.data)
                );
                current.totalDias = diasSet.size;
            }
        });

        return Array.from(porFuncionario.entries()).map(([funcId, data]) => {
            const func = funcionarios.find(f => f.id === funcId);
            return {
                funcionarioId: funcId,
                nome: func?.nome || 'Desconhecido',
                cargo: func?.cargo || '',
                valorHora: func?.valorHora || 0,
                totalHoras: data.totalHoras,
                totalDias: data.totalDias,
                totalMeses: data.meses.size,
                mediaHorasDia: data.totalDias > 0 ? data.totalHoras / data.totalDias : 0,
                valorTotal: (func?.valorHora || 0) * data.totalHoras,
            };
        }).sort((a, b) => b.totalHoras - a.totalHoras);
    }, [registrosPonto, funcionarios]);

    const totalGeralGlobal = resumoTotal.reduce((acc, r) => acc + r.totalHoras, 0);
    const totalValorGlobal = resumoTotal.reduce((acc, r) => acc + r.valorTotal, 0);

    const openNew = () => {
        const today = new Date().toISOString().split('T')[0];
        setForm({ funcionarioId: selectedFunc || '', data: today, entrada: '08:00', saida: '17:00' });
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.funcionarioId || !form.data || !form.entrada || !form.saida) return;
        addRegistroPonto({
            funcionarioId: form.funcionarioId,
            data: form.data,
            entrada: form.entrada,
            saida: form.saida,
        });
        setModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Excluir este registro de ponto?')) {
            deleteRegistroPonto(id);
        }
    };

    return (
        <div>
            {/* View Mode Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', border: '1px solid var(--card-border)' }} id="view-mode-tabs">
                {[
                    { key: 'diario' as ViewMode, label: 'Diário', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
                    { key: 'mensal' as ViewMode, label: 'Mensal', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg> },
                    { key: 'total' as ViewMode, label: 'Total Geral', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setViewMode(tab.key)}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            background: viewMode === tab.key
                                ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                                : 'transparent',
                            color: viewMode === tab.key ? 'white' : 'var(--text-muted)',
                            boxShadow: viewMode === tab.key ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                        }}
                        id={`tab-${tab.key}`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="glass-card animate-fade-in" style={{ padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    {viewMode !== 'total' && (
                        <>
                            {viewMode === 'diario' && (
                                <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
                                    <label>Funcionário</label>
                                    <select
                                        className="form-select"
                                        value={selectedFunc}
                                        onChange={e => setSelectedFunc(e.target.value)}
                                        id="select-funcionario-ponto"
                                    >
                                        <option value="">Todos os funcionários</option>
                                        {funcionariosAtivos.map(f => (
                                            <option key={f.id} value={f.id}>{f.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
                                <label>Mês</label>
                                <select
                                    className="form-select"
                                    value={selectedMes}
                                    onChange={e => setSelectedMes(e.target.value)}
                                    id="select-mes-ponto"
                                >
                                    {mesesOptions.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                    {viewMode === 'total' && (
                        <div style={{ flex: 1, fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                            Visão acumulada de todos os períodos por funcionário
                        </div>
                    )}
                    <button className="btn-primary" onClick={openNew} id="btn-add-ponto">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Registrar Horas
                    </button>
                </div>
            </div>

            {/* ==================== VIEW: DIÁRIO ==================== */}
            {viewMode === 'diario' && (
                <>
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        <div className="glass-card stat-card cyan animate-fade-in animate-delay-100" style={{ padding: '20px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Total de Registros</span>
                            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{registrosDiarios.length}</div>
                        </div>
                        <div className="glass-card stat-card purple animate-fade-in animate-delay-200" style={{ padding: '20px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Total de Horas</span>
                            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{totalHorasDiario.toFixed(1)}h</div>
                        </div>
                        <div className="glass-card stat-card green animate-fade-in animate-delay-300" style={{ padding: '20px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Média Diária</span>
                            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
                                {registrosDiarios.length > 0 ? (totalHorasDiario / registrosDiarios.length).toFixed(1) : '0'}h
                            </div>
                        </div>
                    </div>

                    {/* Daily Table */}
                    <div className="glass-card animate-fade-in" style={{ overflow: 'hidden' }}>
                        {registrosDiarios.length === 0 ? (
                            <div className="empty-state">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Nenhum registro de ponto</p>
                                <p style={{ fontSize: '13px' }}>Clique em &quot;Registrar Horas&quot; para adicionar</p>
                            </div>
                        ) : (
                            <div className="table-responsive-wrapper">
                                <table className="data-table" id="table-ponto-diario">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Dia</th>
                                            <th>Funcionário</th>
                                            <th>Entrada</th>
                                            <th>Saída</th>
                                            <th>Horas</th>
                                            <th style={{ textAlign: 'right' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registrosDiarios.map((r) => {
                                            const func = funcionarios.find(f => f.id === r.funcionarioId);
                                            const dataObj = new Date(r.data + 'T12:00:00');
                                            const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'short' });
                                            return (
                                                <tr key={r.id}>
                                                    <td style={{ fontWeight: 600 }}>
                                                        {dataObj.toLocaleDateString('pt-BR')}
                                                    </td>
                                                    <td>
                                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                                            {diaSemana}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div className="avatar" style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', width: '28px', height: '28px', fontSize: '11px' }}>
                                                                {func?.nome.charAt(0).toUpperCase() || '?'}
                                                            </div>
                                                            {func?.nome || 'Desconhecido'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge info">{r.entrada}</span>
                                                    </td>
                                                    <td>
                                                        <span className="badge warning">{r.saida}</span>
                                                    </td>
                                                    <td style={{ fontWeight: 700, color: 'var(--accent-tertiary)' }}>
                                                        {r.horasTrabalhadas.toFixed(1)}h
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        {isAdmin && (
                                                            <button className="btn-danger" onClick={() => handleDelete(r.id)}>
                                                                Excluir
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="total-row">
                                            <td colSpan={5} style={{ textAlign: 'right', paddingRight: '16px' }}>TOTAL</td>
                                            <td>{totalHorasDiario.toFixed(1)}h</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ==================== VIEW: MENSAL ==================== */}
            {viewMode === 'mensal' && (
                <>
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        <div className="glass-card stat-card purple animate-fade-in animate-delay-100" style={{ padding: '20px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Funcionários no Mês</span>
                            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{resumoMensal.length}</div>
                        </div>
                        <div className="glass-card stat-card cyan animate-fade-in animate-delay-200" style={{ padding: '20px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Total de Horas</span>
                            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{totalGeralMensal.toFixed(1)}h</div>
                        </div>
                        <div className="glass-card stat-card green animate-fade-in animate-delay-300" style={{ padding: '20px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Valor Total</span>
                            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#4ade80' }}>
                                R$ {totalValorMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    {/* Monthly Summary Table */}
                    <div className="glass-card animate-fade-in" style={{ overflow: 'hidden' }}>
                        {resumoMensal.length === 0 ? (
                            <div className="empty-state">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <path d="M3 9h18" /><path d="M9 21V9" />
                                </svg>
                                <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Nenhum registro neste mês</p>
                                <p style={{ fontSize: '13px' }}>Adicione registros de ponto para ver o resumo mensal</p>
                            </div>
                        ) : (
                            <div className="table-responsive-wrapper">
                                <table className="data-table" id="table-ponto-mensal">
                                    <thead>
                                        <tr>
                                            <th>Funcionário</th>
                                            <th>Cargo</th>
                                            <th style={{ textAlign: 'center' }}>Dias Trabalhados</th>
                                            <th style={{ textAlign: 'center' }}>Total Horas</th>
                                            <th style={{ textAlign: 'center' }}>Média/Dia</th>
                                            <th style={{ textAlign: 'right' }}>Valor/Hora</th>
                                            <th style={{ textAlign: 'right' }}>Valor Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resumoMensal.map((r) => (
                                            <tr key={r.funcionarioId}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div className="avatar" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                                            {r.nome.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span style={{ fontWeight: 600 }}>{r.nome}</span>
                                                    </div>
                                                </td>
                                                <td style={{ color: 'var(--text-muted)' }}>{r.cargo}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className="badge info">{r.totalDias} dias</span>
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent-tertiary)' }}>
                                                    {r.totalHoras.toFixed(1)}h
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {r.mediaHorasDia.toFixed(1)}h
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    R$ {r.valorHora.toFixed(2)}
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '15px', color: '#4ade80' }}>
                                                    R$ {r.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="total-row">
                                            <td colSpan={3} style={{ textAlign: 'right', paddingRight: '16px' }}>TOTAL</td>
                                            <td style={{ textAlign: 'center' }}>{totalGeralMensal.toFixed(1)}h</td>
                                            <td></td>
                                            <td></td>
                                            <td style={{ textAlign: 'right', fontSize: '15px' }}>
                                                R$ {totalValorMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Hours Distribution Bar */}
                    {resumoMensal.length > 0 && (
                        <div className="glass-card animate-fade-in" style={{ padding: '24px', marginTop: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 20px 0' }}>Distribuição de Horas</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {resumoMensal.map(r => (
                                    <div key={r.funcionarioId} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '13px', width: '140px', flexShrink: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {r.nome}
                                        </span>
                                        <div className="progress-bar" style={{ flex: 1 }}>
                                            <div
                                                className="progress-bar-fill"
                                                style={{
                                                    width: `${totalGeralMensal > 0 ? (r.totalHoras / totalGeralMensal) * 100 : 0}%`,
                                                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                                }}
                                            />
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: 700, width: '60px', textAlign: 'right', color: 'var(--accent-tertiary)' }}>
                                            {r.totalHoras.toFixed(1)}h
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ==================== VIEW: TOTAL ==================== */}
            {viewMode === 'total' && (
                <>
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        <div className="glass-card stat-card purple animate-fade-in animate-delay-100" style={{ padding: '20px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Funcionários</span>
                            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{resumoTotal.length}</div>
                        </div>
                        <div className="glass-card stat-card cyan animate-fade-in animate-delay-200" style={{ padding: '20px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Total de Horas (Geral)</span>
                            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{totalGeralGlobal.toFixed(1)}h</div>
                        </div>
                        <div className="glass-card stat-card green animate-fade-in animate-delay-300" style={{ padding: '20px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Valor Total Acumulado</span>
                            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#4ade80' }}>
                                R$ {totalValorGlobal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    {/* Total Summary Table */}
                    <div className="glass-card animate-fade-in" style={{ overflow: 'hidden' }}>
                        {resumoTotal.length === 0 ? (
                            <div className="empty-state">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Nenhum registro de ponto</p>
                                <p style={{ fontSize: '13px' }}>Adicione registros para ver o resumo total</p>
                            </div>
                        ) : (
                            <div className="table-responsive-wrapper">
                                <table className="data-table" id="table-ponto-total">
                                    <thead>
                                        <tr>
                                            <th>Funcionário</th>
                                            <th>Cargo</th>
                                            <th style={{ textAlign: 'center' }}>Meses</th>
                                            <th style={{ textAlign: 'center' }}>Dias Trabalhados</th>
                                            <th style={{ textAlign: 'center' }}>Total Horas</th>
                                            <th style={{ textAlign: 'center' }}>Média/Dia</th>
                                            <th style={{ textAlign: 'right' }}>Valor Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resumoTotal.map((r) => (
                                            <tr key={r.funcionarioId}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div className="avatar" style={{ background: 'linear-gradient(135deg, #06b6d4, #22d3ee)' }}>
                                                            {r.nome.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span style={{ fontWeight: 600 }}>{r.nome}</span>
                                                    </div>
                                                </td>
                                                <td style={{ color: 'var(--text-muted)' }}>{r.cargo}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className="badge info">{r.totalMeses}</span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className="badge warning">{r.totalDias} dias</span>
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '15px', color: 'var(--accent-tertiary)' }}>
                                                    {r.totalHoras.toFixed(1)}h
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {r.mediaHorasDia.toFixed(1)}h
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '15px', color: '#4ade80' }}>
                                                    R$ {r.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="total-row">
                                            <td colSpan={4} style={{ textAlign: 'right', paddingRight: '16px' }}>TOTAL GERAL</td>
                                            <td style={{ textAlign: 'center', fontSize: '15px' }}>{totalGeralGlobal.toFixed(1)}h</td>
                                            <td></td>
                                            <td style={{ textAlign: 'right', fontSize: '15px' }}>
                                                R$ {totalValorGlobal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Ranking visual */}
                    {resumoTotal.length > 0 && (
                        <div className="glass-card animate-fade-in" style={{ padding: '24px', marginTop: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 20px 0' }}>Ranking de Horas por Funcionário</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {resumoTotal.map((r, i) => (
                                    <div key={r.funcionarioId} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px',
                                            fontWeight: 800,
                                            flexShrink: 0,
                                            background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' :
                                                i === 1 ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)' :
                                                    i === 2 ? 'linear-gradient(135deg, #b45309, #d97706)' :
                                                        'rgba(255,255,255,0.06)',
                                            color: i < 3 ? '#000' : 'var(--text-muted)',
                                        }}>
                                            {i + 1}
                                        </span>
                                        <span style={{ fontSize: '13px', width: '140px', flexShrink: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {r.nome}
                                        </span>
                                        <div className="progress-bar" style={{ flex: 1 }}>
                                            <div
                                                className="progress-bar-fill"
                                                style={{
                                                    width: `${totalGeralGlobal > 0 ? (r.totalHoras / totalGeralGlobal) * 100 : 0}%`,
                                                    background: i === 0 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                                                        'linear-gradient(90deg, #06b6d4, #22d3ee)',
                                                }}
                                            />
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: 700, width: '70px', textAlign: 'right', color: 'var(--accent-tertiary)' }}>
                                            {r.totalHoras.toFixed(1)}h
                                        </span>
                                        <span style={{ fontSize: '12px', fontWeight: 600, width: '100px', textAlign: 'right', color: '#4ade80' }}>
                                            R$ {r.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Horas">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Funcionário</label>
                        <select
                            className="form-select"
                            value={form.funcionarioId}
                            onChange={e => setForm(prev => ({ ...prev, funcionarioId: e.target.value }))}
                            required
                            id="modal-select-funcionario"
                        >
                            <option value="">Selecione...</option>
                            {funcionariosAtivos.map(f => (
                                <option key={f.id} value={f.id}>{f.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Data</label>
                        <input
                            type="date"
                            className="form-input"
                            value={form.data}
                            onChange={e => setForm(prev => ({ ...prev, data: e.target.value }))}
                            required
                            id="input-data-ponto"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Hora Entrada</label>
                            <input
                                type="time"
                                className="form-input"
                                value={form.entrada}
                                onChange={e => setForm(prev => ({ ...prev, entrada: e.target.value }))}
                                required
                                id="input-entrada"
                            />
                        </div>
                        <div className="form-group">
                            <label>Hora Saída</label>
                            <input
                                type="time"
                                className="form-input"
                                value={form.saida}
                                onChange={e => setForm(prev => ({ ...prev, saida: e.target.value }))}
                                required
                                id="input-saida"
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary" id="btn-salvar-ponto">Registrar</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
