'use client';

import { useState } from 'react';
import { useAuth, AppUser } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function UsuariosPage() {
    const { users, addUser, updateUser, deleteUser, isAdmin, currentUser } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ username: '', senha: '', nome: '', role: 'usuario' as 'admin' | 'usuario' });

    // Only admin can access this page
    if (!isAdmin) {
        return (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: '16px', opacity: 0.3 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Acesso restrito ao administrador
                </p>
            </div>
        );
    }

    const openNew = () => {
        setForm({ username: '', senha: '', nome: '', role: 'usuario' });
        setEditingId(null);
        setModalOpen(true);
    };

    const openEdit = (u: AppUser) => {
        setForm({ username: u.username, senha: '', nome: u.nome, role: u.role });
        setEditingId(u.id);
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.username || !form.nome) return;

        if (editingId) {
            const updateData: Partial<AppUser> = {
                username: form.username,
                nome: form.nome,
                role: form.role,
            };
            if (form.senha) updateData.senha = form.senha;
            updateUser(editingId, updateData);
        } else {
            if (!form.senha) return;
            addUser({
                username: form.username,
                senha: form.senha,
                nome: form.nome,
                role: form.role,
            });
        }
        setModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (id === currentUser?.id) {
            alert('Você não pode excluir seu próprio usuário!');
            return;
        }
        if (id === 'admin-default') {
            alert('O administrador padrão não pode ser excluído!');
            return;
        }
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            deleteUser(id);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
                </p>
                <button className="btn-primary" onClick={openNew} id="btn-add-usuario">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Novo Usuário
                </button>
            </div>

            <div className="glass-card animate-fade-in" style={{ overflow: 'hidden' }}>
                <table className="data-table" id="table-usuarios">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Usuário</th>
                            <th>Perfil</th>
                            <th>Criado em</th>
                            <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div className="avatar" style={{
                                            background: u.role === 'admin'
                                                ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
                                                : 'linear-gradient(135deg, #06b6d4, #22d3ee)',
                                        }}>
                                            {u.nome.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: 600 }}>{u.nome}</span>
                                            {u.id === currentUser?.id && (
                                                <span style={{ fontSize: '11px', color: 'var(--accent-primary)', marginLeft: '8px' }}>(você)</span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{u.username}</td>
                                <td>
                                    <span className={`badge ${u.role === 'admin' ? 'warning' : 'info'}`}>
                                        {u.role === 'admin' ? '👑 Admin' : '👤 Usuário'}
                                    </span>
                                </td>
                                <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                    {new Date(u.criadoEm).toLocaleDateString('pt-BR')}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button className="btn-secondary" onClick={() => openEdit(u)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                            Editar
                                        </button>
                                        {u.id !== 'admin-default' && u.id !== currentUser?.id && (
                                            <button className="btn-danger" onClick={() => handleDelete(u.id)}>
                                                Excluir
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Usuário' : 'Novo Usuário'}>
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
                            id="input-nome-usuario"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Nome de Usuário</label>
                            <input
                                type="text"
                                className="form-input"
                                value={form.username}
                                onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
                                placeholder="Ex: joao"
                                required
                                id="input-username"
                            />
                        </div>
                        <div className="form-group">
                            <label>{editingId ? 'Nova Senha (deixe vazio para manter)' : 'Senha'}</label>
                            <input
                                type="password"
                                className="form-input"
                                value={form.senha}
                                onChange={e => setForm(prev => ({ ...prev, senha: e.target.value }))}
                                placeholder="••••••"
                                required={!editingId}
                                id="input-senha-usuario"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Perfil de Acesso</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, role: 'admin' }))}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: `2px solid ${form.role === 'admin' ? '#fbbf24' : 'var(--card-border)'}`,
                                    background: form.role === 'admin' ? 'rgba(245,158,11,0.1)' : 'transparent',
                                    color: form.role === 'admin' ? '#fbbf24' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <div>👑 Administrador</div>
                                <div style={{ fontSize: '11px', fontWeight: 400, marginTop: '4px', opacity: 0.7 }}>
                                    Acesso total ao sistema
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, role: 'usuario' }))}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: `2px solid ${form.role === 'usuario' ? '#22d3ee' : 'var(--card-border)'}`,
                                    background: form.role === 'usuario' ? 'rgba(6,182,212,0.1)' : 'transparent',
                                    color: form.role === 'usuario' ? '#22d3ee' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <div>👤 Usuário</div>
                                <div style={{ fontSize: '11px', fontWeight: 400, marginTop: '4px', opacity: 0.7 }}>
                                    Horários ocultados
                                </div>
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary" id="btn-salvar-usuario">
                            {editingId ? 'Salvar Alterações' : 'Cadastrar'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
