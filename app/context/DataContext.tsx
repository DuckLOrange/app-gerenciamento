'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ============ TYPES ============

export interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  criadoEm: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  valorHora: number;
  status: 'ativo' | 'inativo';
  empresaId: string;
  criadoEm: string;
}

export interface RegistroPonto {
  id: string;
  funcionarioId: string;
  data: string; // YYYY-MM-DD
  entrada: string; // HH:mm
  saida: string; // HH:mm
  horasTrabalhadas: number;
}

export interface Transacao {
  id: string;
  data: string; // YYYY-MM-DD
  descricao: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  categoria: string;
}

export interface NotaItem {
  funcionarioId: string;
  funcionarioNome: string;
  totalHoras: number;
  valorHora: number;
  subtotal: number;
}

export interface NotaFaturamento {
  id: string;
  itens: NotaItem[];
  empresaId: string;
  empresaNome: string;
  empresaCnpj: string;
  mes: string; // YYYY-MM
  totalValor: number;
  criadoEm: string;
  status: 'pendente' | 'pago';
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:mm
  categoria: 'reuniao' | 'tarefa' | 'lembrete';
  concluida: boolean;
  alertaMinutos: number; // minutes before to alert (0 = none)
  criadoEm: string;
}

export interface AnotacaoLivre {
  id: string;
  conteudo: string; // The free text content
  cor: string; // Optional color coding for notes
  criadoEm: string;
  atualizadoEm: string;
}

interface DataContextType {
  // Empresas
  empresas: Empresa[];
  addEmpresa: (e: Omit<Empresa, 'id' | 'criadoEm'>) => void;
  updateEmpresa: (id: string, e: Partial<Empresa>) => void;
  deleteEmpresa: (id: string) => void;

  // Funcionários
  funcionarios: Funcionario[];
  addFuncionario: (f: Omit<Funcionario, 'id' | 'criadoEm'>) => void;
  updateFuncionario: (id: string, f: Partial<Funcionario>) => void;
  deleteFuncionario: (id: string) => void;

  // Ponto
  registrosPonto: RegistroPonto[];
  addRegistroPonto: (r: Omit<RegistroPonto, 'id' | 'horasTrabalhadas'>) => void;
  deleteRegistroPonto: (id: string) => void;

  // Financeiro
  transacoes: Transacao[];
  addTransacao: (t: Omit<Transacao, 'id'>) => void;
  deleteTransacao: (id: string) => void;

  // Faturamento
  notas: NotaFaturamento[];
  addNota: (n: Omit<NotaFaturamento, 'id' | 'criadoEm'>) => void;
  updateNotaStatus: (id: string, status: 'pendente' | 'pago') => void;
  deleteNota: (id: string) => void;

  // Agenda
  tarefas: Tarefa[];
  addTarefa: (t: Omit<Tarefa, 'id' | 'criadoEm'>) => void;
  updateTarefa: (id: string, t: Partial<Tarefa>) => void;
  deleteTarefa: (id: string) => void;

  // Bloco de Notas Livre
  anotacoes: AnotacaoLivre[];
  addAnotacao: (a: Omit<AnotacaoLivre, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  updateAnotacao: (id: string, a: Partial<AnotacaoLivre>) => void;
  deleteAnotacao: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function calcularHoras(entrada: string, saida: string): number {
  const [hE, mE] = entrada.split(':').map(Number);
  const [hS, mS] = saida.split(':').map(Number);
  const totalMinutos = (hS * 60 + mS) - (hE * 60 + mE);
  return Math.max(0, Math.round((totalMinutos / 60) * 100) / 100);
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    console.error('Erro ao salvar dados no localStorage');
  }
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [registrosPonto, setRegistrosPonto] = useState<RegistroPonto[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [notas, setNotas] = useState<NotaFaturamento[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [anotacoes, setAnotacoes] = useState<AnotacaoLivre[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setEmpresas(loadFromStorage('empresas', []));
    setFuncionarios(loadFromStorage('funcionarios', []));
    setRegistrosPonto(loadFromStorage('registrosPonto', []));

    // Migrate old notas format to new format with itens[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawNotas = loadFromStorage<any[]>('notas', []);
    const migratedNotas: NotaFaturamento[] = rawNotas.map((n: any) => {
      if (n.itens && Array.isArray(n.itens)) {
        return n as NotaFaturamento; // Already new format
      }
      // Migrate old format: convert single employee fields to itens[]
      return {
        id: n.id,
        itens: [{
          funcionarioId: n.funcionarioId || '',
          funcionarioNome: n.funcionarioNome || '',
          totalHoras: n.totalHoras || 0,
          valorHora: n.valorHora || 0,
          subtotal: n.totalValor || 0,
        }],
        empresaId: n.empresaId || '',
        empresaNome: n.empresaNome || '',
        empresaCnpj: n.empresaCnpj || '',
        mes: n.mes || '',
        totalValor: n.totalValor || 0,
        criadoEm: n.criadoEm || new Date().toISOString(),
        status: n.status || 'pendente',
      } as NotaFaturamento;
    });
    setNotas(migratedNotas);

    // Sync: ensure all paid notas have a matching transaction in Financeiro
    // Deduplicate existing transactions first to clean up any past bugs
    const storedTransacoes: Transacao[] = loadFromStorage('transacoes', []);
    const uniqueTransacoes: Transacao[] = [];
    const seenIds = new Set<string>();
    for (const t of storedTransacoes) {
      if (!seenIds.has(t.id)) {
        uniqueTransacoes.push(t);
        seenIds.add(t.id);
      }
    }
    const newTransacoes = [...uniqueTransacoes];
    for (const nota of migratedNotas) {
      if (nota.status === 'pago') {
        const transacaoId = `nota-${nota.id}`;
        const exists = newTransacoes.find(t => t.id === transacaoId);
        if (!exists) {
          const nomes = nota.itens?.map(i => i.funcionarioNome).join(', ') || 'Nota';
          newTransacoes.push({
            id: transacaoId,
            data: nota.criadoEm?.split('T')[0] || new Date().toISOString().split('T')[0],
            descricao: `Nota de Honorários: ${nomes}`,
            tipo: 'entrada',
            valor: nota.totalValor,
            categoria: 'Faturamento',
          });
        }
      }
    }
    setTransacoes(newTransacoes);

    setTarefas(loadFromStorage('tarefas', []));
    setAnotacoes(loadFromStorage('anotacoes', []));

    setLoaded(true);
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    if (loaded) saveToStorage('empresas', empresas);
  }, [empresas, loaded]);
  useEffect(() => {
    if (loaded) saveToStorage('funcionarios', funcionarios);
  }, [funcionarios, loaded]);
  useEffect(() => {
    if (loaded) saveToStorage('registrosPonto', registrosPonto);
  }, [registrosPonto, loaded]);
  useEffect(() => {
    if (loaded) saveToStorage('transacoes', transacoes);
  }, [transacoes, loaded]);
  useEffect(() => {
    if (loaded) saveToStorage('notas', notas);
  }, [notas, loaded]);
  useEffect(() => {
    if (loaded) saveToStorage('tarefas', tarefas);
  }, [tarefas, loaded]);
  useEffect(() => {
    if (loaded) saveToStorage('anotacoes', anotacoes);
  }, [anotacoes, loaded]);

  // ---- Empresas ----
  const addEmpresa = useCallback((e: Omit<Empresa, 'id' | 'criadoEm'>) => {
    setEmpresas(prev => [...prev, { ...e, id: generateId(), criadoEm: new Date().toISOString() }]);
  }, []);

  const updateEmpresa = useCallback((id: string, data: Partial<Empresa>) => {
    setEmpresas(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  }, []);

  const deleteEmpresa = useCallback((id: string) => {
    setEmpresas(prev => prev.filter(e => e.id !== id));
  }, []);

  // ---- Funcionários ----
  const addFuncionario = useCallback((f: Omit<Funcionario, 'id' | 'criadoEm'>) => {
    setFuncionarios(prev => [...prev, { ...f, id: generateId(), criadoEm: new Date().toISOString() }]);
  }, []);

  const updateFuncionario = useCallback((id: string, data: Partial<Funcionario>) => {
    setFuncionarios(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
  }, []);

  const deleteFuncionario = useCallback((id: string) => {
    setFuncionarios(prev => prev.filter(f => f.id !== id));
  }, []);

  // ---- Ponto ----
  const addRegistroPonto = useCallback((r: Omit<RegistroPonto, 'id' | 'horasTrabalhadas'>) => {
    const horasTrabalhadas = calcularHoras(r.entrada, r.saida);
    setRegistrosPonto(prev => [...prev, { ...r, id: generateId(), horasTrabalhadas }]);
  }, []);

  const deleteRegistroPonto = useCallback((id: string) => {
    setRegistrosPonto(prev => prev.filter(r => r.id !== id));
  }, []);

  // ---- Financeiro ----
  const addTransacao = useCallback((t: Omit<Transacao, 'id'>) => {
    setTransacoes(prev => [...prev, { ...t, id: generateId() }]);
  }, []);

  const deleteTransacao = useCallback((id: string) => {
    setTransacoes(prev => prev.filter(t => t.id !== id));
  }, []);

  // ---- Faturamento ----
  const addNota = useCallback((n: Omit<NotaFaturamento, 'id' | 'criadoEm'>) => {
    setNotas(prev => [...prev, { ...n, id: generateId(), criadoEm: new Date().toISOString() }]);
  }, []);

  const updateNotaStatus = useCallback((id: string, status: 'pendente' | 'pago') => {
    const nota = notas.find(n => n.id === id);
    if (!nota || nota.status === status) return;

    if (status === 'pago') {
      // Create financial entry when marking as paid
      const nomes = nota.itens?.map(i => i.funcionarioNome).join(', ') || 'Nota';
      const transacaoId = `nota-${id}`;
      setTransacoes(t => {
        if (t.some(tr => tr.id === transacaoId)) return t;
        return [...t, {
          id: transacaoId,
          data: new Date().toISOString().split('T')[0],
          descricao: `Nota de Honorários: ${nomes}`,
          tipo: 'entrada',
          valor: nota.totalValor,
          categoria: 'Faturamento',
        }];
      });
    } else if (status === 'pendente') {
      // Remove financial entry when reverting to pending
      const transacaoId = `nota-${id}`;
      setTransacoes(t => t.filter(tr => tr.id !== transacaoId));
    }

    setNotas(prev => prev.map(n => n.id === id ? { ...n, status } : n));
  }, [notas]);

  const deleteNota = useCallback((id: string) => {
    setNotas(prev => prev.filter(n => n.id !== id));
  }, []);

  // ---- Agenda ----
  const addTarefa = useCallback((t: Omit<Tarefa, 'id' | 'criadoEm'>) => {
    setTarefas(prev => [...prev, { ...t, id: generateId(), criadoEm: new Date().toISOString() }]);
  }, []);

  const updateTarefa = useCallback((id: string, data: Partial<Tarefa>) => {
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  const deleteTarefa = useCallback((id: string) => {
    setTarefas(prev => prev.filter(t => t.id !== id));
  }, []);

  // ---- Bloco de Notas Livre ----
  const addAnotacao = useCallback((a: Omit<AnotacaoLivre, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const now = new Date().toISOString();
    setAnotacoes(prev => [{ ...a, id: generateId(), criadoEm: now, atualizadoEm: now }, ...prev]);
  }, []);

  const updateAnotacao = useCallback((id: string, data: Partial<AnotacaoLivre>) => {
    setAnotacoes(prev => prev.map(a => a.id === id ? { ...a, ...data, atualizadoEm: new Date().toISOString() } : a));
  }, []);

  const deleteAnotacao = useCallback((id: string) => {
    setAnotacoes(prev => prev.filter(a => a.id !== id));
  }, []);

  return (
    <DataContext.Provider value={{
      empresas, addEmpresa, updateEmpresa, deleteEmpresa,
      funcionarios, addFuncionario, updateFuncionario, deleteFuncionario,
      registrosPonto, addRegistroPonto, deleteRegistroPonto,
      transacoes, addTransacao, deleteTransacao,
      notas, addNota, updateNotaStatus, deleteNota,
      tarefas, addTarefa, updateTarefa, deleteTarefa,
      anotacoes, addAnotacao, updateAnotacao, deleteAnotacao,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
