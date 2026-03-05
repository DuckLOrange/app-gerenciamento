'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useData, Tarefa, AnotacaoLivre } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const CATEGORIAS = [
    { value: 'reuniao', label: '🤝 Reunião', color: '#6366f1' },
    { value: 'tarefa', label: '📋 Tarefa', color: '#22c55e' },
    { value: 'lembrete', label: '🔔 Lembrete', color: '#f59e0b' },
];

const ALERTAS = [
    { value: 0, label: 'Sem alerta' },
    { value: 5, label: '5 minutos antes' },
    { value: 10, label: '10 minutos antes' },
    { value: 15, label: '15 minutos antes' },
    { value: 30, label: '30 minutos antes' },
    { value: 60, label: '1 hora antes' },
];

export default function AgendaPage() {
    const { tarefas, addTarefa, updateTarefa, deleteTarefa, anotacoes, addAnotacao, updateAnotacao, deleteAnotacao } = useData();
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState<'agenda' | 'notas'>('agenda');

    // --- Agenda State ---
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filtroCategoria, setFiltroCategoria] = useState('todos');
    const [filtroStatus, setFiltroStatus] = useState('todos');
    const [alertasExibidos, setAlertasExibidos] = useState<Set<string>>(new Set());

    const today = new Date().toISOString().split('T')[0];
    const nowTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

    const [form, setForm] = useState({
        titulo: '',
        descricao: '',
        data: today,
        hora: nowTime,
        categoria: 'tarefa' as 'reuniao' | 'tarefa' | 'lembrete',
        alertaMinutos: 15,
    });

    // --- Notas Livres State ---
    const [notaModalOpen, setNotaModalOpen] = useState(false);
    const [notaEditingId, setNotaEditingId] = useState<string | null>(null);
    const [notaForm, setNotaForm] = useState({
        conteudo: '',
        cor: '#ffffff',
    });

    // --- Agenda Actions ---
    const openNew = () => {
        setForm({
            titulo: '', descricao: '', data: today,
            hora: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
            categoria: 'tarefa', alertaMinutos: 15,
        });
        setEditingId(null);
        setModalOpen(true);
    };

    const openEdit = (t: Tarefa) => {
        setForm({
            titulo: t.titulo, descricao: t.descricao, data: t.data,
            hora: t.hora, categoria: t.categoria, alertaMinutos: t.alertaMinutos,
        });
        setEditingId(t.id);
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.titulo || !form.data || !form.hora) return;

        if (editingId) {
            updateTarefa(editingId, { ...form });
        } else {
            addTarefa({ ...form, concluida: false });
        }
        setModalOpen(false);
    };

    const handleDelete = (id: string) => {
        deleteTarefa(id);
    };

    const toggleConcluida = (id: string, concluida: boolean) => {
        updateTarefa(id, { concluida: !concluida });
    };

    // --- Notas Livres Actions ---
    const openNewNota = () => {
        setNotaForm({ conteudo: '', cor: '#ffffff' });
        setNotaEditingId(null);
        setNotaModalOpen(true);
    };

    const openEditNota = (a: AnotacaoLivre) => {
        setNotaForm({ conteudo: a.conteudo, cor: a.cor });
        setNotaEditingId(a.id);
        setNotaModalOpen(true);
    };

    const handleSubmitNota = (e: React.FormEvent) => {
        e.preventDefault();
        if (!notaForm.conteudo.trim()) return;

        if (notaEditingId) {
            updateAnotacao(notaEditingId, { ...notaForm });
        } else {
            addAnotacao({ ...notaForm });
        }
        setNotaModalOpen(false);
    };

    const handleDeleteNota = (id: string) => {
        deleteAnotacao(id);
    };

    // Filtered & sorted tasks
    const tarefasFiltradas = useMemo(() => {
        return tarefas
            .filter(t => filtroCategoria === 'todos' || t.categoria === filtroCategoria)
            .filter(t => {
                if (filtroStatus === 'pendente') return !t.concluida;
                if (filtroStatus === 'concluida') return t.concluida;
                return true;
            })
            .sort((a, b) => {
                // Sort by date then time
                const dateCompare = a.data.localeCompare(b.data);
                if (dateCompare !== 0) return dateCompare;
                return a.hora.localeCompare(b.hora);
            });
    }, [tarefas, filtroCategoria, filtroStatus]);

    // Group by date
    const grouped = useMemo(() => {
        const groups: Record<string, typeof tarefasFiltradas> = {};
        for (const t of tarefasFiltradas) {
            if (!groups[t.data]) groups[t.data] = [];
            groups[t.data].push(t);
        }
        return groups;
    }, [tarefasFiltradas]);

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const tomorrow = new Date(todayDate);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.getTime() === todayDate.getTime()) return '📅 Hoje';
        if (date.getTime() === tomorrow.getTime()) return '📅 Amanhã';
        return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    // Alert system
    const checkAlerts = useCallback(() => {
        const now = new Date();
        tarefas.forEach(t => {
            if (t.concluida || t.alertaMinutos === 0) return;
            const alertKey = t.id;
            if (alertasExibidos.has(alertKey)) return;

            const [y, m, d] = t.data.split('-').map(Number);
            const [h, min] = t.hora.split(':').map(Number);
            const tarefaTime = new Date(y, m - 1, d, h, min);
            const alertTime = new Date(tarefaTime.getTime() - t.alertaMinutos * 60 * 1000);

            if (now >= alertTime && now <= tarefaTime) {
                const cat = CATEGORIAS.find(c => c.value === t.categoria);
                const minutesLeft = Math.round((tarefaTime.getTime() - now.getTime()) / 60000);

                if (Notification.permission === 'granted') {
                    new Notification(`${cat?.label || '📋'} ${t.titulo}`, {
                        body: minutesLeft > 0 ? `Em ${minutesLeft} minutos — ${t.hora}` : `Agora! — ${t.hora}`,
                        icon: '/favicon.ico',
                    });
                } else {
                    alert(`⏰ ${cat?.label || ''} ${t.titulo}\n${minutesLeft > 0 ? `Em ${minutesLeft} minutos — ${t.hora}` : `Agora! — ${t.hora}`}`);
                }

                setAlertasExibidos(prev => new Set(prev).add(alertKey));
            }
        });
    }, [tarefas, alertasExibidos]);

    // Request notification permission & start alert interval
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        const interval = setInterval(checkAlerts, 30000); // Check every 30s
        checkAlerts(); // Also check immediately
        return () => clearInterval(interval);
    }, [checkAlerts]);

    // Summary
    const resumo = useMemo(() => {
        const hojeCount = tarefas.filter(t => t.data === today && !t.concluida).length;
        const pendentes = tarefas.filter(t => !t.concluida).length;
        const reunioes = tarefas.filter(t => t.categoria === 'reuniao' && !t.concluida).length;
        return { hojeCount, pendentes, reunioes };
    }, [tarefas, today]);

    const getCatInfo = (cat: string) => CATEGORIAS.find(c => c.value === cat) || CATEGORIAS[1];

    return (
        <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
                <button
                    className={`btn-${activeTab === 'agenda' ? 'primary' : 'secondary'}`}
                    onClick={() => setActiveTab('agenda')}
                    style={{ borderRadius: '20px', padding: '8px 20px' }}>
                    📅 Agenda de Tarefas
                </button>
                <button
                    className={`btn-${activeTab === 'notas' ? 'primary' : 'secondary'}`}
                    onClick={() => setActiveTab('notas')}
                    style={{ borderRadius: '20px', padding: '8px 20px' }}>
                    📝 Bloco de Notas
                </button>
            </div>

            {activeTab === 'agenda' ? (
                <>
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                        <div className="glass-card stat-card purple animate-fade-in" style={{ padding: '24px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Hoje</span>
                            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{resumo.hojeCount}</div>
                        </div>
                        <div className="glass-card stat-card amber animate-fade-in animate-delay-100" style={{ padding: '24px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Pendentes</span>
                            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#fbbf24' }}>{resumo.pendentes}</div>
                        </div>
                        <div className="glass-card stat-card green animate-fade-in animate-delay-200" style={{ padding: '24px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Reuniões</span>
                            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#6366f1' }}>{resumo.reunioes}</div>
                        </div>
                    </div>

                    {/* Filters + Add Button */}
                    <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <select className="form-select" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
                            style={{ width: 'auto', minWidth: '150px' }}>
                            <option value="todos">Todas categorias</option>
                            {CATEGORIAS.map(c => (<option key={c.value} value={c.value}>{c.label}</option>))}
                        </select>
                        <select className="form-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
                            style={{ width: 'auto', minWidth: '150px' }}>
                            <option value="todos">Todos status</option>
                            <option value="pendente">Pendentes</option>
                            <option value="concluida">Concluídas</option>
                        </select>
                        <div style={{ flex: 1 }} />
                        <button className="btn-primary" onClick={openNew} id="btn-nova-tarefa">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Nova Tarefa
                        </button>
                    </div>

                    {/* Task List grouped by date */}
                    {Object.keys(grouped).length === 0 ? (
                        <div className="glass-card animate-fade-in" style={{ padding: '48px 24px' }}>
                            <div className="empty-state">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Nenhuma tarefa encontrada</p>
                                <p style={{ fontSize: '13px' }}>Adicione tarefas, reuniões e lembretes à sua agenda</p>
                            </div>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([date, tasks]) => (
                            <div key={date} style={{ marginBottom: '24px' }}>
                                <h3 style={{
                                    fontSize: '14px', fontWeight: 700, color: date === today ? '#6366f1' : 'var(--text-muted)',
                                    textTransform: 'capitalize', marginBottom: '12px', paddingLeft: '4px',
                                }}>
                                    {formatDate(date)}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {tasks.map(t => {
                                        const catInfo = getCatInfo(t.categoria);
                                        const isPast = t.data < today || (t.data === today && t.hora < nowTime);
                                        return (
                                            <div
                                                key={t.id}
                                                className="glass-card animate-fade-in"
                                                style={{
                                                    padding: '16px 20px',
                                                    borderLeft: `4px solid ${catInfo.color}`,
                                                    opacity: t.concluida ? 0.5 : 1,
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                                    {/* Checkbox */}
                                                    <div
                                                        onClick={() => toggleConcluida(t.id, t.concluida)}
                                                        style={{
                                                            width: '22px', height: '22px', borderRadius: '6px', marginTop: '2px',
                                                            border: `2px solid ${t.concluida ? '#22c55e' : 'var(--card-border)'}`,
                                                            background: t.concluida ? '#22c55e' : 'transparent',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s ease',
                                                        }}
                                                    >
                                                        {t.concluida && (
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                                            <span style={{
                                                                fontWeight: 700, fontSize: '15px',
                                                                textDecoration: t.concluida ? 'line-through' : 'none',
                                                            }}>
                                                                {t.titulo}
                                                            </span>
                                                            <span style={{
                                                                fontSize: '11px', padding: '2px 8px', borderRadius: '6px',
                                                                background: `${catInfo.color}20`, color: catInfo.color, fontWeight: 600,
                                                            }}>
                                                                {catInfo.label}
                                                            </span>
                                                            {isPast && !t.concluida && (
                                                                <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 600 }}>
                                                                    ⚠ Atrasado
                                                                </span>
                                                            )}
                                                        </div>
                                                        {t.descricao && (
                                                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                                                                {t.descricao}
                                                            </p>
                                                        )}
                                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                                                            <span>🕐 {t.hora}</span>
                                                            {t.alertaMinutos > 0 && (
                                                                <span>🔔 {ALERTAS.find(a => a.value === t.alertaMinutos)?.label}</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                                        <button className="btn-secondary" onClick={() => openEdit(t)}
                                                            style={{ padding: '6px 10px', fontSize: '11px' }}>
                                                            Editar
                                                        </button>
                                                        <button className="btn-danger" onClick={() => handleDelete(t.id)}
                                                            style={{ padding: '6px 10px', fontSize: '11px' }}>
                                                            Excluir
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </>
            ) : (
                /* Bloco de Notas View */
                <>
                    <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Minhas Anotações</h2>
                        <button className="btn-primary" onClick={openNewNota}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Nova Anotação
                        </button>
                    </div>

                    {anotacoes.length === 0 ? (
                        <div className="glass-card animate-fade-in" style={{ padding: '48px 24px' }}>
                            <div className="empty-state">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Nenhuma anotação livre</p>
                                <p style={{ fontSize: '13px' }}>Use este espaço para escrever ideias, rascunhos e notas rápidas.</p>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {anotacoes.sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm)).map(nota => (
                                <div key={nota.id} className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <div style={{
                                        height: '6px', width: '100%',
                                        backgroundColor: nota.cor !== '#ffffff' ? nota.cor : 'var(--border-color)',
                                        borderTopLeftRadius: '12px', borderTopRightRadius: '12px'
                                    }}></div>
                                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ whiteSpace: 'pre-wrap', flex: 1, fontSize: '14px', lineHeight: 1.6, color: 'var(--text-color)', marginBottom: '16px' }}>
                                            {nota.conteudo}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--card-border)' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                Atualizado: {new Date(nota.atualizadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn-secondary" onClick={() => openEditNota(nota)} style={{ padding: '4px 8px', fontSize: '11px' }}>Editar</button>
                                                <button className="btn-danger" onClick={() => handleDeleteNota(nota.id)} style={{ padding: '4px 8px', fontSize: '11px' }}>Excluir</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Modal Agenda */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Tarefa' : 'Nova Tarefa'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Título</label>
                        <input
                            type="text" className="form-input" value={form.titulo}
                            onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                            placeholder="Ex: Reunião com cliente" required id="input-titulo-tarefa"
                        />
                    </div>
                    <div className="form-group">
                        <label>Descrição (opcional)</label>
                        <textarea
                            className="form-input" value={form.descricao}
                            onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                            placeholder="Detalhes da tarefa..."
                            rows={3}
                            style={{ resize: 'vertical' }}
                            id="input-descricao-tarefa"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Data</label>
                            <input
                                type="date" className="form-input" value={form.data}
                                onChange={e => setForm(p => ({ ...p, data: e.target.value }))}
                                required id="input-data-tarefa"
                            />
                        </div>
                        <div className="form-group">
                            <label>Horário</label>
                            <input
                                type="time" className="form-input" value={form.hora}
                                onChange={e => setForm(p => ({ ...p, hora: e.target.value }))}
                                required id="input-hora-tarefa"
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Categoria</label>
                            <select className="form-select" value={form.categoria}
                                onChange={e => setForm(p => ({ ...p, categoria: e.target.value as 'reuniao' | 'tarefa' | 'lembrete' }))}
                                id="select-categoria-tarefa">
                                {CATEGORIAS.map(c => (<option key={c.value} value={c.value}>{c.label}</option>))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Alerta</label>
                            <select className="form-select" value={form.alertaMinutos}
                                onChange={e => setForm(p => ({ ...p, alertaMinutos: parseInt(e.target.value) }))}
                                id="select-alerta-tarefa">
                                {ALERTAS.map(a => (<option key={a.value} value={a.value}>{a.label}</option>))}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary" id="btn-salvar-tarefa">
                            {editingId ? 'Salvar Alterações' : 'Adicionar Tarefa'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Bloco de Notas */}
            <Modal isOpen={notaModalOpen} onClose={() => setNotaModalOpen(false)} title={notaEditingId ? 'Editar Anotação' : 'Nova Anotação'} width="600px">
                <form onSubmit={handleSubmitNota}>
                    <div className="form-group">
                        <label>Conteúdo da Nota</label>
                        <textarea
                            className="form-input" value={notaForm.conteudo}
                            onChange={e => setNotaForm(p => ({ ...p, conteudo: e.target.value }))}
                            placeholder="Escreva livremente aqui..."
                            rows={10}
                            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.6' }}
                            required autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label>Cor de marcação (opcional)</label>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            {['#ffffff', '#fecaca', '#fef08a', '#bbf7d0', '#bfdbfe', '#e9d5ff'].map(cor => (
                                <div
                                    key={cor}
                                    onClick={() => setNotaForm(p => ({ ...p, cor }))}
                                    style={{
                                        width: '32px', height: '32px', borderRadius: '50%', backgroundColor: cor, cursor: 'pointer',
                                        border: notaForm.cor === cor ? '3px solid var(--text-color)' : '1px solid var(--border-color)',
                                        boxShadow: notaForm.cor === cor ? '0 0 0 2px var(--background)' : 'none'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setNotaModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary">
                            {notaEditingId ? 'Salvar Anotação' : 'Criar Anotação'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
