'use client';

import { useState } from 'react';
import { useData, Empresa } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const ESTADOS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export default function EmpresasPage() {
    const { empresas, addEmpresa, updateEmpresa, deleteEmpresa, funcionarios } = useData();
    const { isAdmin } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        razaoSocial: '', nomeFantasia: '', cnpj: '', inscricaoEstadual: '',
        endereco: '', cidade: '', estado: 'SP', cep: '', telefone: '', email: '',
    });

    const openNew = () => {
        setForm({ razaoSocial: '', nomeFantasia: '', cnpj: '', inscricaoEstadual: '', endereco: '', cidade: '', estado: 'SP', cep: '', telefone: '', email: '' });
        setEditingId(null);
        setModalOpen(true);
    };

    const openEdit = (e: Empresa) => {
        setForm({
            razaoSocial: e.razaoSocial, nomeFantasia: e.nomeFantasia, cnpj: e.cnpj,
            inscricaoEstadual: e.inscricaoEstadual, endereco: e.endereco, cidade: e.cidade,
            estado: e.estado, cep: e.cep, telefone: e.telefone, email: e.email,
        });
        setEditingId(e.id);
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.razaoSocial || !form.cnpj) return;
        if (editingId) {
            updateEmpresa(editingId, form);
        } else {
            addEmpresa(form);
        }
        setModalOpen(false);
    };

    const handleDelete = (id: string) => {
        const funcCount = funcionarios.filter(f => f.empresaId === id).length;
        if (funcCount > 0) {
            alert(`Esta empresa possui ${funcCount} funcionário(s) vinculado(s). Remova os vínculos antes de excluir.`);
            return;
        }
        if (confirm('Tem certeza que deseja excluir esta empresa?')) {
            deleteEmpresa(id);
        }
    };

    const formatCnpj = (value: string) => {
        const digits = value.replace(/\D/g, '').substring(0, 14);
        return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
            .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})/, '$1.$2.$3/$4')
            .replace(/^(\d{2})(\d{3})(\d{3})/, '$1.$2.$3')
            .replace(/^(\d{2})(\d{3})/, '$1.$2')
            .replace(/^(\d{2})/, '$1');
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    {empresas.length} empresa{empresas.length !== 1 ? 's' : ''} cadastrada{empresas.length !== 1 ? 's' : ''}
                </p>
                <button className="btn-primary" onClick={openNew} id="btn-add-empresa">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Nova Empresa
                </button>
            </div>

            {empresas.length === 0 ? (
                <div className="glass-card animate-fade-in">
                    <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
                            <path d="M9 9h1" /><path d="M9 13h1" /><path d="M9 17h1" />
                        </svg>
                        <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Nenhuma empresa cadastrada</p>
                        <p style={{ fontSize: '13px' }}>Cadastre suas empresas para vincular funcionários</p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {empresas.map(emp => {
                        const funcCount = funcionarios.filter(f => f.empresaId === emp.id).length;
                        return (
                            <div key={emp.id} className="glass-card animate-fade-in" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                            <div style={{
                                                width: '44px', height: '44px', borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '18px', fontWeight: 800, color: 'white',
                                            }}>
                                                {emp.nomeFantasia?.charAt(0).toUpperCase() || emp.razaoSocial.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                                                    {emp.nomeFantasia || emp.razaoSocial}
                                                </h3>
                                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                                                    {emp.razaoSocial}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '13px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>CNPJ:</span> {emp.cnpj}
                                            </div>
                                            {emp.telefone && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>Tel:</span> {emp.telefone}
                                                </div>
                                            )}
                                            {emp.email && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>Email:</span> {emp.email}
                                                </div>
                                            )}
                                            {emp.cidade && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>Local:</span> {emp.cidade}/{emp.estado}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                                        <span className="badge info" style={{ fontSize: '12px' }}>
                                            {funcCount} funcionário{funcCount !== 1 ? 's' : ''}
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn-secondary" onClick={() => openEdit(emp)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                                Editar
                                            </button>
                                            {isAdmin && (
                                                <button className="btn-danger" onClick={() => handleDelete(emp.id)}>
                                                    Excluir
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Empresa' : 'Nova Empresa'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Razão Social *</label>
                        <input type="text" className="form-input" value={form.razaoSocial}
                            onChange={e => setForm(p => ({ ...p, razaoSocial: e.target.value }))}
                            placeholder="Razão social da empresa" required id="input-razao-social" />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Nome Fantasia</label>
                            <input type="text" className="form-input" value={form.nomeFantasia}
                                onChange={e => setForm(p => ({ ...p, nomeFantasia: e.target.value }))}
                                placeholder="Nome fantasia" id="input-nome-fantasia" />
                        </div>
                        <div className="form-group">
                            <label>CNPJ *</label>
                            <input type="text" className="form-input" value={form.cnpj}
                                onChange={e => setForm(p => ({ ...p, cnpj: formatCnpj(e.target.value) }))}
                                placeholder="00.000.000/0000-00" required maxLength={18} id="input-cnpj" />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Inscrição Estadual</label>
                            <input type="text" className="form-input" value={form.inscricaoEstadual}
                                onChange={e => setForm(p => ({ ...p, inscricaoEstadual: e.target.value }))}
                                placeholder="Inscrição estadual" id="input-ie" />
                        </div>
                        <div className="form-group">
                            <label>Telefone</label>
                            <input type="text" className="form-input" value={form.telefone}
                                onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                                placeholder="(00) 00000-0000" id="input-telefone" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" className="form-input" value={form.email}
                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                            placeholder="empresa@email.com" id="input-email-empresa" />
                    </div>
                    <div className="form-group">
                        <label>Endereço</label>
                        <input type="text" className="form-input" value={form.endereco}
                            onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))}
                            placeholder="Rua, número, complemento" id="input-endereco" />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Cidade</label>
                            <input type="text" className="form-input" value={form.cidade}
                                onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))}
                                placeholder="Cidade" id="input-cidade" />
                        </div>
                        <div className="form-group">
                            <label>Estado</label>
                            <select className="form-select" value={form.estado}
                                onChange={e => setForm(p => ({ ...p, estado: e.target.value }))} id="input-estado">
                                {ESTADOS.map(uf => (<option key={uf} value={uf}>{uf}</option>))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>CEP</label>
                            <input type="text" className="form-input" value={form.cep}
                                onChange={e => setForm(p => ({ ...p, cep: e.target.value }))}
                                placeholder="00000-000" maxLength={9} id="input-cep" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary" id="btn-salvar-empresa">
                            {editingId ? 'Salvar Alterações' : 'Cadastrar'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
