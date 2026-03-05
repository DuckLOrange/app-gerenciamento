'use client';

import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const categorias = [
    'Salários', 'Aluguel', 'Energia', 'Internet', 'Material', 'Transporte',
    'Alimentação', 'Serviços', 'Impostos', 'Honorários', 'Vendas', 'Outros',
];

export default function FinanceiroPage() {
    const { transacoes, addTransacao, deleteTransacao } = useData();
    const { isAdmin } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [filtroTipo, setFiltroTipo] = useState<'' | 'entrada' | 'saida'>('');
    const [selectedMes, setSelectedMes] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [form, setForm] = useState({
        data: new Date().toISOString().split('T')[0],
        descricao: '',
        tipo: 'saida' as 'entrada' | 'saida',
        valor: '',
        categoria: 'Outros',
    });

    const transacoesFiltradas = useMemo(() => {
        return transacoes
            .filter(t => {
                const matchTipo = !filtroTipo || t.tipo === filtroTipo;
                const matchMes = t.data.startsWith(selectedMes);
                return matchTipo && matchMes;
            })
            .sort((a, b) => b.data.localeCompare(a.data));
    }, [transacoes, filtroTipo, selectedMes]);

    const resumo = useMemo(() => {
        const mesTransacoes = transacoes.filter(t => t.data.startsWith(selectedMes));
        const entradas = mesTransacoes.filter(t => t.tipo === 'entrada').reduce((a, t) => a + t.valor, 0);
        const saidas = mesTransacoes.filter(t => t.tipo === 'saida').reduce((a, t) => a + t.valor, 0);
        return { entradas, saidas, saldo: entradas - saidas };
    }, [transacoes, selectedMes]);

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

    const openNew = () => {
        setForm({
            data: new Date().toISOString().split('T')[0],
            descricao: '',
            tipo: 'saida',
            valor: '',
            categoria: 'Outros',
        });
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.descricao || !form.valor || !form.data) return;
        addTransacao({
            data: form.data,
            descricao: form.descricao,
            tipo: form.tipo,
            valor: parseFloat(form.valor),
            categoria: form.categoria,
        });
        setModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Excluir esta transação?')) {
            deleteTransacao(id);
        }
    };

    // Gastos por categoria para o gráfico
    const gastosPorCategoria = useMemo(() => {
        const map = new Map<string, number>();
        transacoes
            .filter(t => t.data.startsWith(selectedMes) && t.tipo === 'saida')
            .forEach(t => {
                map.set(t.categoria, (map.get(t.categoria) || 0) + t.valor);
            });
        return Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);
    }, [transacoes, selectedMes]);

    const maxCategoria = Math.max(...gastosPorCategoria.map(g => g[1]), 1);

    return (
        <div>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div className="glass-card stat-card green animate-fade-in" style={{ padding: '24px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
                        Total Entradas
                    </span>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#4ade80' }}>
                        R$ {resumo.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="glass-card stat-card amber animate-fade-in animate-delay-100" style={{ padding: '24px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
                        Total Saídas
                    </span>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#fbbf24' }}>
                        R$ {resumo.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="glass-card stat-card purple animate-fade-in animate-delay-200" style={{ padding: '24px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Saldo</span>
                    <div style={{
                        fontSize: '28px',
                        fontWeight: 800,
                        marginTop: '8px',
                        color: resumo.saldo >= 0 ? '#4ade80' : '#f87171',
                    }}>
                        {resumo.saldo >= 0 ? '+' : ''}R$ {resumo.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            {/* Chart - Gastos por Categoria */}
            {gastosPorCategoria.length > 0 && (
                <div className="glass-card animate-fade-in" style={{ padding: '24px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 20px 0' }}>Saídas por Categoria</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {gastosPorCategoria.map(([cat, valor]) => (
                            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '13px', width: '100px', flexShrink: 0, color: 'var(--text-muted)' }}>{cat}</span>
                                <div className="progress-bar" style={{ flex: 1 }}>
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${(valor / maxCategoria) * 100}%`,
                                            background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 700, width: '110px', textAlign: 'right' }}>
                                    R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
                        <label>Mês</label>
                        <select className="form-select" value={selectedMes} onChange={e => setSelectedMes(e.target.value)} id="select-mes-financeiro">
                            {mesesOptions.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '160px' }}>
                        <label>Tipo</label>
                        <select className="form-select" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value as '' | 'entrada' | 'saida')} id="select-tipo-financeiro">
                            <option value="">Todos</option>
                            <option value="entrada">Entradas</option>
                            <option value="saida">Saídas</option>
                        </select>
                    </div>
                    <button className="btn-primary" onClick={openNew} id="btn-add-transacao">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Nova Transação
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card" style={{ overflow: 'hidden' }}>
                {transacoesFiltradas.length === 0 ? (
                    <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Nenhuma transação registrada</p>
                        <p style={{ fontSize: '13px' }}>Clique em &quot;Nova Transação&quot; para adicionar</p>
                    </div>
                ) : (
                    <table className="data-table" id="table-financeiro">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th>Categoria</th>
                                <th>Tipo</th>
                                <th>Valor</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transacoesFiltradas.map((t) => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 600 }}>
                                        {new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                                    </td>
                                    <td>{t.descricao}</td>
                                    <td>
                                        <span className="badge info">{t.categoria}</span>
                                    </td>
                                    <td>
                                        <span className={`badge ${t.tipo === 'entrada' ? 'success' : 'warning'}`}>
                                            {t.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                                        </span>
                                    </td>
                                    <td style={{
                                        fontWeight: 700,
                                        color: t.tipo === 'entrada' ? '#4ade80' : '#fbbf24',
                                    }}>
                                        {t.tipo === 'entrada' ? '+' : '-'}R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {isAdmin && (
                                            <button className="btn-danger" onClick={() => handleDelete(t.id)}>Excluir</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nova Transação">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tipo</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, tipo: 'entrada' }))}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: '10px',
                                    border: `2px solid ${form.tipo === 'entrada' ? '#4ade80' : 'var(--card-border)'}`,
                                    background: form.tipo === 'entrada' ? 'rgba(34,197,94,0.1)' : 'transparent',
                                    color: form.tipo === 'entrada' ? '#4ade80' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    transition: 'all 0.2s',
                                }}
                            >
                                ↑ Entrada
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, tipo: 'saida' }))}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: '10px',
                                    border: `2px solid ${form.tipo === 'saida' ? '#fbbf24' : 'var(--card-border)'}`,
                                    background: form.tipo === 'saida' ? 'rgba(245,158,11,0.1)' : 'transparent',
                                    color: form.tipo === 'saida' ? '#fbbf24' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    transition: 'all 0.2s',
                                }}
                            >
                                ↓ Saída
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Descrição</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.descricao}
                            onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                            placeholder="Ex: Pagamento de aluguel"
                            required
                            id="input-descricao-transacao"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Valor (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-input"
                                value={form.valor}
                                onChange={e => setForm(prev => ({ ...prev, valor: e.target.value }))}
                                placeholder="0.00"
                                required
                                id="input-valor-transacao"
                            />
                        </div>
                        <div className="form-group">
                            <label>Categoria</label>
                            <select
                                className="form-select"
                                value={form.categoria}
                                onChange={e => setForm(prev => ({ ...prev, categoria: e.target.value }))}
                                id="input-categoria-transacao"
                            >
                                {categorias.map(c => (<option key={c} value={c}>{c}</option>))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Data</label>
                        <input
                            type="date"
                            className="form-input"
                            value={form.data}
                            onChange={e => setForm(prev => ({ ...prev, data: e.target.value }))}
                            required
                            id="input-data-transacao"
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary" id="btn-salvar-transacao">Registrar</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
