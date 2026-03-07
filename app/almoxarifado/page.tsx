'use client';

import { useState, useMemo } from 'react';
import { useData, ItemEstoque } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

type TabType = 'todos' | 'EPI' | 'Uniforme' | 'Ferramenta' | 'Consumível' | 'histórico';

export default function AlmoxarifadoPage() {
    const { itensEstoque, addItemEstoque, updateItemEstoque, deleteItemEstoque, movimentacoesEstoque, registrarMovimentacaoEstoque, funcionarios } = useData();
    const { isAdmin } = useAuth();

    const [activeTab, setActiveTab] = useState<TabType>('todos');
    const [buscaHistórico, setBuscaHistórico] = useState('');
    const [modalItemOpen, setModalItemOpen] = useState(false);
    const [modalMovOpen, setModalMovOpen] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    // Form Item
    const [formItem, setFormItem] = useState({
        nome: '',
        categoria: 'Ferramenta' as 'EPI' | 'Uniforme' | 'Ferramenta' | 'Consumível',
        unidade: 'un',
        estoqueMinimo: 5
    });

    // Form Movimentação
    const [formMov, setFormMov] = useState({
        itemId: '',
        tipo: 'saida' as 'entrada' | 'saida' | 'devolucao',
        quantidade: 1,
        funcionarioId: '',
        observacao: ''
    });

    // Filtros e Derivações
    const itensFiltrados = useMemo(() => {
        if (activeTab === 'todos') return itensEstoque;
        return itensEstoque.filter(i => i.categoria === activeTab);
    }, [itensEstoque, activeTab]);

    const itensBaixoEstoque = useMemo(() => {
        return itensEstoque.filter(i => i.quantidade <= i.estoqueMinimo);
    }, [itensEstoque]);

    // Resumo
    const resumo = {
        totalItens: itensEstoque.length,
        ferramentas: itensEstoque.filter(i => i.categoria === 'Ferramenta').length,
        epis: itensEstoque.filter(i => i.categoria === 'EPI').length,
        uniformes: itensEstoque.filter(i => i.categoria === 'Uniforme').length,
        alertaBaixo: itensBaixoEstoque.length
    };

    // Handlers Item
    const openNewItem = () => {
        setFormItem({ nome: '', categoria: 'Ferramenta', unidade: 'un', estoqueMinimo: 5 });
        setEditingItemId(null);
        setModalItemOpen(true);
    };

    const openEditItem = (item: ItemEstoque) => {
        setFormItem({ nome: item.nome, categoria: item.categoria, unidade: item.unidade, estoqueMinimo: item.estoqueMinimo });
        setEditingItemId(item.id);
        setModalItemOpen(true);
    };

    const handleSalvarItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formItem.nome) return;

        if (editingItemId) {
            updateItemEstoque(editingItemId, formItem);
        } else {
            addItemEstoque(formItem);
        }
        setModalItemOpen(false);
    };

    const handleDeleteItem = (id: string) => {
        const temMovimentacao = movimentacoesEstoque.some(m => m.itemId === id);
        if (temMovimentacao) {
            alert('Não é possível excluir este item pois ele já possui histórico de movimentação. Ajuste o estoque para 0 se necessário.');
            return;
        }
        if (confirm('Tem certeza que deseja excluir este item do catálogo?')) {
            deleteItemEstoque(id);
        }
    };

    // Handlers Movimentação
    const openMovimentacao = (itemId?: string) => {
        setFormMov({
            itemId: itemId || '',
            tipo: 'saida',
            quantidade: 1,
            funcionarioId: '',
            observacao: ''
        });
        setModalMovOpen(true);
    };

    const handleSalvarMovimentacao = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formMov.itemId || formMov.quantidade <= 0) return;

        // Validação: Saída não pode ser maior que o estoque atual se não for permitido estoque negativo
        if (formMov.tipo === 'saida') {
            const item = itensEstoque.find(i => i.id === formMov.itemId);
            if (item && formMov.quantidade > item.quantidade) {
                if (!confirm(`Atenção: A quantidade de saída (${formMov.quantidade}) é maior que o estoque atual (${item.quantidade}). Deseja continuar mesmo assim (estoque ficará zerado ou negativo)?`)) {
                    return;
                }
            }
        }

        // Validação de funcionário
        if ((formMov.tipo === 'saida' || formMov.tipo === 'devolucao') && !formMov.funcionarioId) {
            alert('Por favor, selecione o funcionário responsável pela retirada/devolução.');
            return;
        }

        registrarMovimentacaoEstoque({
            itemId: formMov.itemId,
            tipo: formMov.tipo,
            quantidade: Number(formMov.quantidade),
            data: new Date().toISOString().split('T')[0],
            funcionarioId: formMov.funcionarioId || undefined,
            observacao: formMov.observacao
        });

        setModalMovOpen(false);
    };

    return (
        <div>
            {/* Header / Resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div className="glass-card stat-card purple animate-fade-in" style={{ padding: '24px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Catálogo de Itens</span>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{resumo.totalItens}</div>
                </div>
                <div className="glass-card stat-card blue animate-fade-in animate-delay-100" style={{ padding: '24px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Ferramentas, EPIs & Uniformes</span>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#60a5fa' }}>
                        {resumo.ferramentas} / {resumo.epis} / {resumo.uniformes}
                    </div>
                </div>
                <div className="glass-card stat-card red animate-fade-in animate-delay-200" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    {resumo.alertaBaixo > 0 && (
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: '#ef4444' }} />
                    )}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Estoque Baixo/Zcrado</span>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: resumo.alertaBaixo > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                        {resumo.alertaBaixo} Itens
                    </div>
                </div>
            </div>

            {/* Ações e Filtros */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                    {(['todos', 'EPI', 'Uniforme', 'Ferramenta', 'Consumível', 'histórico'] as TabType[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                                background: activeTab === tab ? 'rgba(99,102,241,0.15)' : 'transparent',
                                color: activeTab === tab ? '#818cf8' : 'var(--text-muted)',
                                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                textTransform: (tab === 'todos' || tab === 'histórico') ? 'capitalize' : 'none'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-secondary" onClick={() => openMovimentacao()} id="btn-movimentar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        </svg>
                        Movimentar Estoque
                    </button>
                    <button className="btn-primary" onClick={openNewItem} id="btn-add-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Novo Item
                    </button>
                </div>
            </div>

            {/* Tabela de Estoque / Histórico */}
            <div className="glass-card animate-fade-in" style={{ overflow: 'hidden' }}>
                {activeTab === 'histórico' ? (
                    <div>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div className="search-bar" style={{ flex: 1, maxWidth: '400px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }}
                                >
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Pesquisar por nome do funcionário, item ou tipo..."
                                    className="search-input"
                                    value={buscaHistórico}
                                    onChange={(e) => setBuscaHistórico(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="table-responsive-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Funcionário</th>
                                        <th>Item</th>
                                        <th style={{ textAlign: 'center' }}>Qtd</th>
                                        <th>Tipo</th>
                                        <th>Observação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movimentacoesEstoque
                                        .filter(mov => {
                                            if (!buscaHistórico) return true;
                                            const termo = buscaHistórico.toLowerCase();
                                            const item = itensEstoque.find(i => i.id === mov.itemId);
                                            const func = funcionarios.find(f => f.id === mov.funcionarioId);

                                            const matchNomeFuncionario = func?.nome.toLowerCase().includes(termo);
                                            const matchNomeItem = item?.nome.toLowerCase().includes(termo);
                                            const matchTipo = mov.tipo.toLowerCase().includes(termo);
                                            const matchObs = mov.observacao?.toLowerCase().includes(termo);

                                            return matchNomeFuncionario || matchNomeItem || matchTipo || matchObs;
                                        })
                                        .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
                                        .map(mov => {
                                            const item = itensEstoque.find(i => i.id === mov.itemId);
                                            const func = funcionarios.find(f => f.id === mov.funcionarioId);

                                            const corTipo = mov.tipo === 'entrada' ? '#34d399' : mov.tipo === 'saida' ? '#f87171' : '#60a5fa';
                                            const bgTipo = mov.tipo === 'entrada' ? 'rgba(16,185,129,0.1)' : mov.tipo === 'saida' ? 'rgba(239,68,68,0.1)' : 'rgba(56,189,248,0.1)';

                                            return (
                                                <tr key={mov.id}>
                                                    <td data-label="Data">
                                                        <div style={{ fontWeight: 600 }}>{new Date(mov.data).toLocaleDateString('pt-BR')}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                            {new Date(mov.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    <td data-label="Funcionário">
                                                        {func ? (
                                                            <>
                                                                <div style={{ fontWeight: 600 }}>{func.nome}</div>
                                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{func.cargo}</div>
                                                            </>
                                                        ) : '-'}
                                                    </td>
                                                    <td data-label="Item">
                                                        <div style={{ fontWeight: 600 }}>{item?.nome || 'Item Excluído'}</div>
                                                        {item?.categoria && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.categoria}</div>}
                                                    </td>
                                                    <td data-label="Qtd" style={{ textAlign: 'center' }}>
                                                        <span style={{ fontSize: '15px', fontWeight: 700, color: corTipo }}>
                                                            {mov.tipo === 'saida' ? '-' : '+'}{mov.quantidade}
                                                        </span>
                                                    </td>
                                                    <td data-label="Tipo">
                                                        <span className="badge" style={{ background: bgTipo, color: corTipo }}>
                                                            {mov.tipo === 'saida' ? 'Retirada' : mov.tipo === 'entrada' ? 'Entrada' : 'Devolução'}
                                                        </span>
                                                    </td>
                                                    <td data-label="Observação">
                                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{mov.observacao || '-'}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    {movimentacoesEstoque.length === 0 && (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                                                Nenhuma movimentação registrada.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : itensFiltrados.length === 0 ? (
                    <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                        <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Nenhum item encontrado</p>
                        <p style={{ fontSize: '13px' }}>Cadastre ferramentas, EPIs, uniformes e materiais de consumo</p>
                    </div>
                ) : (
                    <div className="table-responsive-wrapper">
                        <table className="data-table" id="table-estoque">
                            <thead>
                                <tr>
                                    <th>Item / Descrição</th>
                                    <th>Categoria</th>
                                    <th style={{ textAlign: 'center' }}>Quantidade</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itensFiltrados.sort((a, b) => a.nome.localeCompare(b.nome)).map(item => {
                                    const baixoEstoque = item.quantidade <= item.estoqueMinimo;
                                    const zerado = item.quantidade === 0;

                                    return (
                                        <tr key={item.id} style={{ background: zerado ? 'rgba(239,68,68,0.03)' : baixoEstoque ? 'rgba(245,158,11,0.03)' : 'transparent' }}>
                                            <td data-label="Item / Descrição">
                                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.nome}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mínimo ideal: {item.estoqueMinimo} {item.unidade}</div>
                                            </td>
                                            <td data-label="Categoria">
                                                <span className="badge info" style={{
                                                    fontSize: '11px',
                                                    background: item.categoria === 'EPI' ? 'rgba(16,185,129,0.1)' : item.categoria === 'Uniforme' ? 'rgba(168,85,247,0.1)' : item.categoria === 'Ferramenta' ? 'rgba(56,189,248,0.1)' : 'rgba(244,63,94,0.1)',
                                                    color: item.categoria === 'EPI' ? '#34d399' : item.categoria === 'Uniforme' ? '#c084fc' : item.categoria === 'Ferramenta' ? '#7dd3fc' : '#fb7185'
                                                }}>
                                                    {item.categoria}
                                                </span>
                                            </td>
                                            <td data-label="Quantidade" style={{ textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: '16px', fontWeight: 800,
                                                    color: zerado ? '#ef4444' : baixoEstoque ? '#fbbf24' : '#4ade80'
                                                }}>
                                                    {item.quantidade}
                                                </span>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>{item.unidade}</span>
                                            </td>
                                            <td data-label="Status">
                                                {zerado ? (
                                                    <span className="badge warning" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>● Faltando</span>
                                                ) : baixoEstoque ? (
                                                    <span className="badge warning">● Baixo</span>
                                                ) : (
                                                    <span className="badge success">● OK</span>
                                                )}
                                            </td>
                                            <td data-label="Ações" style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '11px' }} onClick={() => openMovimentacao(item.id)}>
                                                        Saída/Entrada
                                                    </button>
                                                    {isAdmin && (
                                                        <>
                                                            <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '11px' }} onClick={() => openEditItem(item)}>
                                                                Editar
                                                            </button>
                                                            <button className="btn-danger" style={{ padding: '6px 10px', fontSize: '11px' }} onClick={() => handleDeleteItem(item.id)}>
                                                                Excluir
                                                            </button>
                                                        </>
                                                    )}
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

            {/* Modal: Novo/Editar Item */}
            <Modal isOpen={modalItemOpen} onClose={() => setModalItemOpen(false)} title={editingItemId ? 'Editar Item' : 'Novo Item no Catálogo'}>
                <form onSubmit={handleSalvarItem}>
                    <div className="form-group">
                        <label>Nome do Item / Descrição *</label>
                        <input type="text" className="form-input" value={formItem.nome} onChange={e => setFormItem(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Luva de Raspa, Disco de Corte 9 polegadas..." required />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Categoria</label>
                            <select className="form-select" value={formItem.categoria} onChange={e => setFormItem(p => ({ ...p, categoria: e.target.value as 'EPI' | 'Uniforme' | 'Ferramenta' | 'Consumível' }))}>
                                <option value="EPI">EPI (Segurança)</option>
                                <option value="Uniforme">Uniforme</option>
                                <option value="Ferramenta">Ferramenta</option>
                                <option value="Consumível">Material Consumível</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Unidade de Medida</label>
                            <select className="form-select" value={formItem.unidade} onChange={e => setFormItem(p => ({ ...p, unidade: e.target.value }))}>
                                <option value="un">Unidade (un)</option>
                                <option value="par">Par</option>
                                <option value="cx">Caixa (cx)</option>
                                <option value="kg">Quilos (kg)</option>
                                <option value="m">Metros (m)</option>
                                <option value="l">Litros (l)</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Alerta de Estoque Mínimo</label>
                        <input type="number" min="0" className="form-input" value={formItem.estoqueMinimo} onChange={e => setFormItem(p => ({ ...p, estoqueMinimo: Number(e.target.value) }))} placeholder="Avisar quando chegar a..." />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setModalItemOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary">Salvar</button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Movimentação (Entrada/Saída) */}
            <Modal isOpen={modalMovOpen} onClose={() => setModalMovOpen(false)} title="Registrar Movimentação">
                <form onSubmit={handleSalvarMovimentacao}>
                    <div className="form-group">
                        <label>Tipo de Movimentação</label>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            {(['entrada', 'saida', 'devolucao'] as const).map(tipo => (
                                <label key={tipo} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: formMov.tipo === tipo ? (tipo === 'entrada' || tipo === 'devolucao' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)') : 'rgba(255,255,255,0.03)', border: `1px solid ${formMov.tipo === tipo ? (tipo === 'entrada' || tipo === 'devolucao' ? '#22c55e' : '#ef4444') : 'var(--card-border)'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <input type="radio" name="tipoMov" value={tipo} checked={formMov.tipo === tipo} onChange={() => setFormMov(p => ({ ...p, tipo }))} style={{ display: 'none' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: formMov.tipo === tipo ? (tipo === 'entrada' || tipo === 'devolucao' ? '#4ade80' : '#f87171') : 'var(--text-muted)', textTransform: 'capitalize' }}>
                                        {tipo === 'saida' ? 'Retirada (Saída)' : tipo === 'entrada' ? 'Nova Compra (Entrada)' : 'Devolução'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Qual Item?</label>
                        <select className="form-select" value={formMov.itemId} onChange={e => setFormMov(p => ({ ...p, itemId: e.target.value }))} required>
                            <option value="">Selecione um item...</option>
                            {itensEstoque.sort((a, b) => a.nome.localeCompare(b.nome)).map(i => (
                                <option key={i.id} value={i.id}>{i.nome} (Estoque: {i.quantidade} {i.unidade})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Quantidade ({itensEstoque.find(i => i.id === formMov.itemId)?.unidade || 'un'})</label>
                        <input type="number" min="0.01" step="0.01" className="form-input" value={formMov.quantidade} onChange={e => setFormMov(p => ({ ...p, quantidade: Number(e.target.value) }))} required />
                    </div>

                    {(formMov.tipo === 'saida' || formMov.tipo === 'devolucao') && (
                        <div className="form-group animate-fade-in">
                            <label>Funcionário Responsável</label>
                            <select className="form-select" value={formMov.funcionarioId} onChange={e => setFormMov(p => ({ ...p, funcionarioId: e.target.value }))} required>
                                <option value="">Selecione quem está retirando/devolvendo...</option>
                                {funcionarios.filter(f => f.status === 'ativo').map(f => (
                                    <option key={f.id} value={f.id}>{f.nome} - {f.cargo}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Observação (Opcional)</label>
                        <input type="text" className="form-input" value={formMov.observacao} onChange={e => setFormMov(p => ({ ...p, observacao: e.target.value }))} placeholder="Motivo, máquina em que será usado, etc." />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setModalMovOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary" style={{ background: formMov.tipo === 'saida' ? '#ef4444' : '#22c55e', color: 'white' }}>
                            Confirmar {formMov.tipo === 'saida' ? 'Retirada' : formMov.tipo === 'entrada' ? 'Entrada' : 'Devolução'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
