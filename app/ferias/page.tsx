'use client';

import { useState } from 'react';
import { useData, Ferias } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function FeriasPage() {
    const { ferias, addFerias, updateFerias, deleteFerias, funcionarios } = useData();
    const { isAdmin } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        funcionarioId: '',
        dataInicio: '',
        dataFim: '',
        status: 'pendente' as 'pendente' | 'aprovado' | 'concluido' | 'cancelado',
        observacao: ''
    });

    const openNew = () => {
        setForm({ funcionarioId: '', dataInicio: '', dataFim: '', status: 'pendente', observacao: '' });
        setEditingId(null);
        setModalOpen(true);
    };

    const openEdit = (f: Ferias) => {
        setForm({
            funcionarioId: f.funcionarioId,
            dataInicio: f.dataInicio,
            dataFim: f.dataFim,
            status: f.status,
            observacao: f.observacao || ''
        });
        setEditingId(f.id);
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.funcionarioId || !form.dataInicio || !form.dataFim) return;

        if (editingId) {
            updateFerias(editingId, { ...form });
        } else {
            addFerias({ ...form });
        }
        setModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este agendamento de férias?')) {
            deleteFerias(id);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aprovado': return <span className="badge success">● Aprovado</span>;
            case 'concluido': return <span className="badge info">● Concluído</span>;
            case 'cancelado': return <span className="badge danger">● Cancelado</span>;
            default: return <span className="badge warning">● Pendente</span>;
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <div>
            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    {ferias.length} agendamento{ferias.length !== 1 ? 's' : ''} de férias
                </p>
                <button className="btn-primary" onClick={openNew}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Novo Agendamento
                </button>
            </div>

            {/* Table */}
            <div className="glass-card animate-fade-in" style={{ overflow: 'hidden' }}>
                {ferias.length === 0 ? (
                    <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                            <path d="M8 14h.01"></path>
                            <path d="M12 14h.01"></path>
                            <path d="M16 14h.01"></path>
                            <path d="M8 18h.01"></path>
                            <path d="M12 18h.01"></path>
                            <path d="M16 18h.01"></path>
                        </svg>
                        <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Nenhum agendamento de férias</p>
                        <p style={{ fontSize: '13px' }}>Clique em &quot;Novo Agendamento&quot; para começar</p>
                    </div>
                ) : (
                    <div className="table-responsive-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Funcionário</th>
                                    <th>Início</th>
                                    <th>Fim</th>
                                    <th>Status</th>
                                    <th>Observação</th>
                                    <th style={{ textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ferias.map((f) => {
                                    const funcionario = funcionarios.find(func => func.id === f.funcionarioId);
                                    return (
                                        <tr key={f.id}>
                                            <td data-label="Funcionário" style={{ fontWeight: 600 }}>
                                                {funcionario ? funcionario.nome : 'Funcionário Excluído'}
                                            </td>
                                            <td data-label="Início">{formatDate(f.dataInicio)}</td>
                                            <td data-label="Fim">{formatDate(f.dataFim)}</td>
                                            <td data-label="Status">{getStatusBadge(f.status)}</td>
                                            <td data-label="Observação" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {f.observacao || '—'}
                                            </td>
                                            <td data-label="Ações" style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button className="btn-secondary" onClick={() => openEdit(f)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                                        Editar
                                                    </button>
                                                    <button className="btn-danger" onClick={() => handleDelete(f.id)}>
                                                        Excluir
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Agendamento' : 'Novo Agendamento de Férias'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Funcionário</label>
                        <select
                            className="form-select"
                            value={form.funcionarioId}
                            onChange={e => setForm(prev => ({ ...prev, funcionarioId: e.target.value }))}
                            required
                        >
                            <option value="">Selecione um funcionário</option>
                            {funcionarios.map(func => (
                                <option key={func.id} value={func.id} disabled={func.status !== 'ativo'}>
                                    {func.nome} {func.status !== 'ativo' ? '(Inativo)' : (func.cargo ? `— ${func.cargo}` : '')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Data de Início</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.dataInicio}
                                onChange={e => setForm(prev => ({ ...prev, dataInicio: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Data de Fim</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.dataFim}
                                onChange={e => setForm(prev => ({ ...prev, dataFim: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Status</label>
                        <select
                            className="form-select"
                            value={form.status}
                            onChange={e => setForm(prev => ({ ...prev, status: e.target.value as any }))}
                        >
                            <option value="pendente">Pendente</option>
                            <option value="aprovado">Aprovado</option>
                            <option value="concluido">Concluído</option>
                            <option value="cancelado">Cancelado</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Observações Adicionais</label>
                        <textarea
                            className="form-input"
                            style={{ height: '80px', resize: 'vertical' }}
                            value={form.observacao}
                            onChange={e => setForm(prev => ({ ...prev, observacao: e.target.value }))}
                            placeholder="Ex: Férias relativas ao período 2024-2025."
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary">
                            {editingId ? 'Salvar Alterações' : 'Agendar'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
