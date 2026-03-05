'use client';

import { useState } from 'react';
import { useData, Funcionario } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function FuncionariosPage() {
    const { funcionarios, addFuncionario, updateFuncionario, deleteFuncionario, empresas } = useData();
    const { isAdmin } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ nome: '', cpf: '', cargo: '', valorHora: '', status: 'ativo' as 'ativo' | 'inativo', empresaId: '' });

    const openNew = () => {
        setForm({ nome: '', cpf: '', cargo: '', valorHora: '', status: 'ativo', empresaId: '' });
        setEditingId(null);
        setModalOpen(true);
    };

    const openEdit = (f: Funcionario) => {
        setForm({ nome: f.nome, cpf: f.cpf || '', cargo: f.cargo, valorHora: String(f.valorHora), status: f.status, empresaId: f.empresaId || '' });
        setEditingId(f.id);
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nome || !form.cargo || !form.valorHora) return;

        if (editingId) {
            updateFuncionario(editingId, {
                nome: form.nome,
                cpf: form.cpf,
                cargo: form.cargo,
                valorHora: parseFloat(form.valorHora),
                status: form.status,
                empresaId: form.empresaId,
            });
        } else {
            addFuncionario({
                nome: form.nome,
                cpf: form.cpf,
                cargo: form.cargo,
                valorHora: parseFloat(form.valorHora),
                status: form.status,
                empresaId: form.empresaId,
            });
        }
        setModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este funcionário?')) {
            deleteFuncionario(id);
        }
    };

    return (
        <div>
            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    {funcionarios.length} funcionário{funcionarios.length !== 1 ? 's' : ''} cadastrado{funcionarios.length !== 1 ? 's' : ''}
                </p>
                <button className="btn-primary" onClick={openNew} id="btn-add-funcionario">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Novo Funcionário
                </button>
            </div>

            {/* Table */}
            <div className="glass-card animate-fade-in" style={{ overflow: 'hidden' }}>
                {funcionarios.length === 0 ? (
                    <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Nenhum funcionário cadastrado</p>
                        <p style={{ fontSize: '13px' }}>Clique em &quot;Novo Funcionário&quot; para começar</p>
                    </div>
                ) : (
                    <table className="data-table" id="table-funcionarios">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>CPF</th>
                                <th>Empresa</th>
                                <th>Cargo</th>
                                <th>Valor/Hora</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {funcionarios.map((f) => (
                                <tr key={f.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="avatar" style={{
                                                background: f.status === 'ativo'
                                                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                                    : 'rgba(100,116,139,0.3)',
                                            }}>
                                                {f.nome.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{f.nome}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                        {f.cpf || '—'}
                                    </td>
                                    <td>
                                        {(() => {
                                            const emp = empresas.find(e => e.id === f.empresaId);
                                            return emp ? (
                                                <span className="badge info" style={{ fontSize: '11px' }}>
                                                    {emp.nomeFantasia || emp.razaoSocial}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Sem empresa</span>
                                            );
                                        })()}
                                    </td>
                                    <td>{f.cargo}</td>
                                    <td style={{ fontWeight: 600 }}>R$ {f.valorHora.toFixed(2)}</td>
                                    <td>
                                        <span className={`badge ${f.status === 'ativo' ? 'success' : 'warning'}`}>
                                            {f.status === 'ativo' ? '● Ativo' : '● Inativo'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
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
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Funcionário' : 'Novo Funcionário'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nome Completo</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.nome}
                            onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                            placeholder="Ex: João Silva"
                            required
                            id="input-nome"
                        />
                    </div>
                    <div className="form-group">
                        <label>CPF</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.cpf}
                            onChange={e => {
                                const digits = e.target.value.replace(/\D/g, '').substring(0, 11);
                                const formatted = digits
                                    .replace(/^(\d{3})(\d)/, '$1.$2')
                                    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
                                    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
                                setForm(prev => ({ ...prev, cpf: formatted }));
                            }}
                            placeholder="000.000.000-00"
                            maxLength={14}
                            id="input-cpf"
                        />
                    </div>
                    <div className="form-group">
                        <label>Cargo</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.cargo}
                            onChange={e => setForm(prev => ({ ...prev, cargo: e.target.value }))}
                            placeholder="Ex: Desenvolvedor"
                            required
                            id="input-cargo"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Valor por Hora (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-input"
                                value={form.valorHora}
                                onChange={e => setForm(prev => ({ ...prev, valorHora: e.target.value }))}
                                placeholder="0.00"
                                required
                                id="input-valor-hora"
                            />
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                className="form-select"
                                value={form.status}
                                onChange={e => setForm(prev => ({ ...prev, status: e.target.value as 'ativo' | 'inativo' }))}
                                id="input-status"
                            >
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Empresa</label>
                        <select
                            className="form-select"
                            value={form.empresaId}
                            onChange={e => setForm(prev => ({ ...prev, empresaId: e.target.value }))}
                            id="input-empresa-func"
                        >
                            <option value="">Sem vínculo</option>
                            {empresas.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.nomeFantasia || emp.razaoSocial} — {emp.cnpj}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary" id="btn-salvar-funcionario">
                            {editingId ? 'Salvar Alterações' : 'Cadastrar'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
