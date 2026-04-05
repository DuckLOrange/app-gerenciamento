'use client';

import { useState } from 'react';
import { useAuth, AppUser } from '../context/AuthContext';
import Modal from '../components/Modal';
import ChangePasswordModal from '../components/ChangePasswordModal';

export default function UsuariosPage() {
    const { users, addUserProfile, updateUserProfile, deleteUserProfile, isAdmin, currentUser } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ id: '', username: '', nome: '', role: 'usuario' as 'admin' | 'usuario' });

    const displayedUsers = isAdmin ? users : users.filter(u => u.id === currentUser?.id);

    const openNew = () => {
        setForm({ id: '', username: '', nome: '', role: 'usuario' });
        setEditingId(null);
        setModalOpen(true);
    };

    const openEdit = (u: AppUser) => {
        setForm({ id: u.id, username: u.username, nome: u.nome, role: u.role });
        setEditingId(u.id);
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.username || !form.nome) return;

        if (editingId) {
            await updateUserProfile(editingId, {
                username: form.username,
                nome: form.nome,
                role: form.role,
            });
        } else {
            if (!form.id) {
                alert('Para novos usuários, insira o UID do Firebase (Gerado no painel do Firebase após criar o usuário)');
                return;
            }
            await addUserProfile({
                id: form.id,
                username: form.username,
                nome: form.nome,
                role: form.role,
            });
        }
        setModalOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (id === currentUser?.id) {
            alert('Você não pode excluir seu próprio usuário!');
            return;
        }
        if (confirm('Tem certeza que deseja desativar este perfil no Firestore?')) {
            await deleteUserProfile(id);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    {displayedUsers.length} usuário{displayedUsers.length !== 1 ? 's' : ''} {isAdmin ? 'cadastrado' : 'encontrado'}{displayedUsers.length !== 1 ? 's' : ''}
                </p>
                {isAdmin && (
                    <button className="btn-primary" onClick={openNew} id="btn-add-usuario">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Novo Usuário
                    </button>
                )}
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
                        {displayedUsers.map((u) => (
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
                                        {u.id === currentUser?.id && (
                                            <button className="btn-primary" onClick={() => setPasswordModalOpen(true)} style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--accent-primary)' }}>
                                                Alterar Senha
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button className="btn-secondary" onClick={() => openEdit(u)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                                Editar
                                            </button>
                                        )}
                                        {isAdmin && u.id !== 'admin-default' && u.id !== currentUser?.id && (
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
                            <label>E-mail ou Usuário</label>
                            <input
                                type="text"
                                className="form-input"
                                value={form.username}
                                onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
                                placeholder="Ex: joao@empresa.com"
                                required
                                id="input-username"
                            />
                        </div>
                        <div className="form-group">
                            <label>Firebase UID {editingId ? '(Não editável)' : '(Obrigatório)'}</label>
                            <input
                                type="text"
                                className="form-input"
                                value={form.id}
                                onChange={e => setForm(prev => ({ ...prev, id: e.target.value }))}
                                placeholder="Cole o UID do Firebase aqui"
                                required={!editingId}
                                disabled={!!editingId}
                                id="input-uid-usuario"
                            />
                        </div>
                    </div>
                    {isAdmin && (
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
                                        Funcionalidades básicas
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                    {!editingId && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
                            💡 <strong>Dica:</strong> Primeiro crie o usuário no Painel do Firebase (Authentication) e depois copie o &quot;User UID&quot; dele para colar acima.
                        </p>
                    )}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary" id="btn-salvar-usuario">
                            {editingId ? 'Salvar Perfil' : 'Vincular Usuário'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ChangePasswordModal
                isOpen={passwordModalOpen}
                onClose={() => setPasswordModalOpen(false)}
            />
        </div>
    );
}
