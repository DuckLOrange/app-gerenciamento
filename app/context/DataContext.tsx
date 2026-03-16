'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query
} from 'firebase/firestore';

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

export interface ItemEstoque {
  id: string;
  nome: string;
  categoria: 'EPI' | 'Uniforme' | 'Ferramenta' | 'Consumível';
  quantidade: number;
  unidade: string; // 'un', 'par', 'kg', 'm', 'caixa'
  estoqueMinimo: number;
  criadoEm: string;
}

export interface MovimentacaoEstoque {
  id: string;
  itemId: string;
  tipo: 'entrada' | 'saida' | 'devolucao';
  quantidade: number;
  data: string; // YYYY-MM-DD
  funcionarioId?: string; // Optional, only for saida/devolucao
  observacao: string;
  criadoEm: string;
}

export interface Ferias {
  id: string;
  funcionarioId: string;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
  status: 'pendente' | 'aprovado' | 'concluido' | 'cancelado';
  observacao: string;
  criadoEm: string;
}

interface DataContextType {
  // Empresas
  empresas: Empresa[];
  addEmpresa: (e: Omit<Empresa, 'id' | 'criadoEm'>) => Promise<void>;
  updateEmpresa: (id: string, e: Partial<Empresa>) => Promise<void>;
  deleteEmpresa: (id: string) => Promise<void>;

  // Funcionários
  funcionarios: Funcionario[];
  addFuncionario: (f: Omit<Funcionario, 'id' | 'criadoEm'>) => Promise<void>;
  updateFuncionario: (id: string, f: Partial<Funcionario>) => Promise<void>;
  deleteFuncionario: (id: string) => Promise<void>;

  // Ponto
  registrosPonto: RegistroPonto[];
  addRegistroPonto: (r: Omit<RegistroPonto, 'id' | 'horasTrabalhadas'>) => Promise<void>;
  deleteRegistroPonto: (id: string) => Promise<void>;

  // Financeiro
  transacoes: Transacao[];
  addTransacao: (t: Omit<Transacao, 'id'>) => Promise<void>;
  deleteTransacao: (id: string) => Promise<void>;

  // Faturamento
  notas: NotaFaturamento[];
  addNota: (n: Omit<NotaFaturamento, 'id' | 'criadoEm'>) => Promise<void>;
  updateNotaStatus: (id: string, status: 'pendente' | 'pago') => Promise<void>;
  deleteNota: (id: string) => Promise<void>;

  // Agenda
  tarefas: Tarefa[];
  addTarefa: (t: Omit<Tarefa, 'id' | 'criadoEm'>) => Promise<void>;
  updateTarefa: (id: string, t: Partial<Tarefa>) => Promise<void>;
  deleteTarefa: (id: string) => Promise<void>;

  // Bloco de Notas Livre
  anotacoes: AnotacaoLivre[];
  addAnotacao: (a: Omit<AnotacaoLivre, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<void>;
  updateAnotacao: (id: string, a: Partial<AnotacaoLivre>) => Promise<void>;
  deleteAnotacao: (id: string) => Promise<void>;

  // Almoxarifado
  itensEstoque: ItemEstoque[];
  addItemEstoque: (i: Omit<ItemEstoque, 'id' | 'criadoEm' | 'quantidade'>) => Promise<void>;
  updateItemEstoque: (id: string, i: Partial<ItemEstoque>) => Promise<void>;
  deleteItemEstoque: (id: string) => Promise<void>;

  movimentacoesEstoque: MovimentacaoEstoque[];
  registrarMovimentacaoEstoque: (m: Omit<MovimentacaoEstoque, 'id' | 'criadoEm'>) => Promise<void>;

  // Férias
  ferias: Ferias[];
  addFerias: (f: Omit<Ferias, 'id' | 'criadoEm'>) => Promise<void>;
  updateFerias: (id: string, f: Partial<Ferias>) => Promise<void>;
  deleteFerias: (id: string) => Promise<void>;

  // Util
  isMigrationLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function calcularHoras(entrada: string, saida: string): number {
  if (!entrada || !saida) return 0;
  const [hE, mE] = entrada.split(':').map(Number);
  const [hS, mS] = saida.split(':').map(Number);
  const totalMinutos = (hS * 60 + mS) - (hE * 60 + mE);
  return Math.max(0, Math.round((totalMinutos / 60) * 100) / 100);
}

// Keep loadFromStorage/saveToStorage specifically for the backup file creation script & migration loading state
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
  const [itensEstoque, setItensEstoque] = useState<ItemEstoque[]>([]);
  const [movimentacoesEstoque, setMovimentacoesEstoque] = useState<MovimentacaoEstoque[]>([]);
  const [ferias, setFerias] = useState<Ferias[]>([]);

  const [loaded, setLoaded] = useState(false);
  const [isMigrationLoading] = useState(false);

  // Setup Firebase Listeners
  useEffect(() => {
    // Escuta empresas
    const unsubEmpresas = onSnapshot(query(collection(db, 'empresas')), (querySnapshot) => {
      const docs: Empresa[] = [];
      querySnapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() } as Empresa));
      setEmpresas(docs);
    });

    const unsubFuncionarios = onSnapshot(query(collection(db, 'funcionarios')), (querySnapshot) => {
      const docs: Funcionario[] = [];
      querySnapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() } as Funcionario));
      setFuncionarios(docs);
    });

    const unsubPonto = onSnapshot(query(collection(db, 'registrosPonto')), (querySnapshot) => {
      const docs: RegistroPonto[] = [];
      querySnapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() } as RegistroPonto));
      setRegistrosPonto(docs);
    });

    const unsubTransacoes = onSnapshot(query(collection(db, 'transacoes')), (querySnapshot) => {
      const docs: Transacao[] = [];
      querySnapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() } as Transacao));
      setTransacoes(docs);
    });

    const unsubNotas = onSnapshot(query(collection(db, 'notas')), (querySnapshot) => {
      const docs: NotaFaturamento[] = [];
      querySnapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() } as NotaFaturamento));
      setNotas(docs);
    });

    const unsubTarefas = onSnapshot(query(collection(db, 'tarefas')), (querySnapshot) => {
      const docs: Tarefa[] = [];
      querySnapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() } as Tarefa));
      setTarefas(docs);
    });

    const unsubAnotacoes = onSnapshot(query(collection(db, 'anotacoes')), (querySnapshot) => {
      const docs: AnotacaoLivre[] = [];
      querySnapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() } as AnotacaoLivre));
      setAnotacoes(docs);
    });

    const unsubItens = onSnapshot(query(collection(db, 'itensEstoque')), (querySnapshot) => {
      const docs: ItemEstoque[] = [];
      querySnapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() } as ItemEstoque));
      setItensEstoque(docs);
    });

    const unsubMovimentacoes = onSnapshot(query(collection(db, 'movimentacoesEstoque')), (querySnapshot) => {
      const docs: MovimentacaoEstoque[] = [];
      querySnapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() } as MovimentacaoEstoque));
      setMovimentacoesEstoque(docs);
    });

    const unsubFerias = onSnapshot(query(collection(db, 'ferias')), (querySnapshot) => {
      const docs: Ferias[] = [];
      querySnapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() } as Ferias));
      setFerias(docs);
    });

    setLoaded(true);

    // Initial Migration Script Option:
    // If the database is completely empty on first load, maybe trigger migration or show a UI banner?
    // We will leave the migration logic strictly isolated via an explicit file/action.

    return () => {
      unsubEmpresas();
      unsubFuncionarios();
      unsubPonto();
      unsubTransacoes();
      unsubNotas();
      unsubTarefas();
      unsubAnotacoes();
      unsubItens();
      unsubMovimentacoes();
      unsubFerias();
    };
  }, []);

  // Backup Diário Automático
  useEffect(() => {
    if (!loaded) return;

    // Apenas fazemos backup se já tiver dados em memória local para evitar baixar Firebase vazio nos primeiros millissecs
    if (empresas.length === 0 && funcionarios.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const lastBackup = loadFromStorage('lastBackupDate', '');

    if (lastBackup !== today) {
      const allData = {
        empresas,
        funcionarios,
        registrosPonto,
        transacoes,
        notas,
        tarefas,
        anotacoes,
        itensEstoque,
        movimentacoesEstoque,
        ferias,
        dataBackup: new Date().toISOString()
      };

      try {
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', url);
        downloadAnchorNode.setAttribute('download', `backup_app_gerenciamento_${today}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        URL.revokeObjectURL(url);

        saveToStorage('lastBackupDate', today);
      } catch (error) {
        console.error("Erro ao gerar backup diário", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, empresas.length, funcionarios.length]);

  // ---- Empresas ----
  const addEmpresa = async (e: Omit<Empresa, 'id' | 'criadoEm'>) => {
    await addDoc(collection(db, 'empresas'), {
      ...e,
      criadoEm: new Date().toISOString()
    });
  };

  const updateEmpresa = async (id: string, data: Partial<Empresa>) => {
    await updateDoc(doc(db, 'empresas', id), data);
  };

  const deleteEmpresa = async (id: string) => {
    await deleteDoc(doc(db, 'empresas', id));
  };

  // ---- Funcionários ----
  const addFuncionario = async (f: Omit<Funcionario, 'id' | 'criadoEm'>) => {
    await addDoc(collection(db, 'funcionarios'), {
      ...f,
      criadoEm: new Date().toISOString()
    });
  };

  const updateFuncionario = async (id: string, data: Partial<Funcionario>) => {
    await updateDoc(doc(db, 'funcionarios', id), data);
  };

  const deleteFuncionario = async (id: string) => {
    await deleteDoc(doc(db, 'funcionarios', id));
  };

  // ---- Ponto ----
  const addRegistroPonto = async (r: Omit<RegistroPonto, 'id' | 'horasTrabalhadas'>) => {
    const horasTrabalhadas = calcularHoras(r.entrada, r.saida);
    await addDoc(collection(db, 'registrosPonto'), {
      ...r,
      horasTrabalhadas
    });
  };

  const deleteRegistroPonto = async (id: string) => {
    await deleteDoc(doc(db, 'registrosPonto', id));
  };

  // ---- Financeiro ----
  // Adding transacao is an independent action or a side effect. Usually Firebase side effects can be executed async side-by-side
  const addTransacao = async (t: Omit<Transacao, 'id'>) => {
    await addDoc(collection(db, 'transacoes'), t);
  };

  const deleteTransacao = async (id: string) => {
    await deleteDoc(doc(db, 'transacoes', id));
  };

  // ---- Faturamento ----
  const addNota = async (n: Omit<NotaFaturamento, 'id' | 'criadoEm'>) => {
    await addDoc(collection(db, 'notas'), {
      ...n,
      criadoEm: new Date().toISOString()
    });
  };

  const updateNotaStatus = async (id: string, status: 'pendente' | 'pago') => {
    const nota = notas.find(n => n.id === id);
    if (!nota || nota.status === status) return;

    // Handle financial side effects manually
    if (status === 'pago') {
      const nomes = nota.itens?.map(i => i.funcionarioNome).join(', ') || 'Nota';
      const transacaoRef = 'nota-' + id;

      const exists = transacoes.some(tr => tr.id === transacaoRef);
      if (!exists) {
        // Technically this ID override logic via addDoc does NOT apply IDs directly. Usually we'd specify setDoc. 
        // For standardising, let's keep it clean: adding a transaction.
        await addDoc(collection(db, 'transacoes'), {
          idReferencia: transacaoRef, // Use internal ID to not override Firebase AutoID
          data: new Date().toISOString().split('T')[0],
          descricao: `Nota de Honorários: ${nomes}`,
          tipo: 'entrada',
          valor: nota.totalValor,
          categoria: 'Faturamento',
        });
      }
    } else if (status === 'pendente') {
      // Logic expects to remove the specific transaction if reverting to pending. 
      // We search via idReferencia:
      // In a real application, consider a cloud function or avoiding removing paid log.
      const transacaoToRemove = transacoes.find(tr => (tr as Transacao & { idReferencia?: string })?.idReferencia === `nota-${id}` || tr.id === `nota-${id}`);
      if (transacaoToRemove) {
        await deleteDoc(doc(db, 'transacoes', transacaoToRemove.id));
      }
    }

    // Update status:
    await updateDoc(doc(db, 'notas', id), { status });
  };

  const deleteNota = async (id: string) => {
    await deleteDoc(doc(db, 'notas', id));
  };

  // ---- Agenda ----
  const addTarefa = async (t: Omit<Tarefa, 'id' | 'criadoEm'>) => {
    await addDoc(collection(db, 'tarefas'), {
      ...t,
      criadoEm: new Date().toISOString()
    });
  };

  const updateTarefa = async (id: string, data: Partial<Tarefa>) => {
    await updateDoc(doc(db, 'tarefas', id), data);
  };

  const deleteTarefa = async (id: string) => {
    await deleteDoc(doc(db, 'tarefas', id));
  };

  // ---- Bloco de Notas Livre ----
  const addAnotacao = async (a: Omit<AnotacaoLivre, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const now = new Date().toISOString();
    await addDoc(collection(db, 'anotacoes'), {
      ...a,
      criadoEm: now,
      atualizadoEm: now
    });
  };

  const updateAnotacao = async (id: string, data: Partial<AnotacaoLivre>) => {
    await updateDoc(doc(db, 'anotacoes', id), {
      ...data,
      atualizadoEm: new Date().toISOString()
    });
  };

  const deleteAnotacao = async (id: string) => {
    await deleteDoc(doc(db, 'anotacoes', id));
  };

  // ---- Almoxarifado ----
  const addItemEstoque = async (i: Omit<ItemEstoque, 'id' | 'criadoEm' | 'quantidade'>) => {
    await addDoc(collection(db, 'itensEstoque'), {
      ...i,
      quantidade: 0,
      criadoEm: new Date().toISOString()
    });
  };

  const updateItemEstoque = async (id: string, data: Partial<ItemEstoque>) => {
    await updateDoc(doc(db, 'itensEstoque', id), data);
  };

  const deleteItemEstoque = async (id: string) => {
    await deleteDoc(doc(db, 'itensEstoque', id));
  };

  const registrarMovimentacaoEstoque = async (m: Omit<MovimentacaoEstoque, 'id' | 'criadoEm'>) => {
    // Cleaning data: Remove fields with undefined values (JSON stringify trick)
    const cleanedData = JSON.parse(JSON.stringify(m));

    await addDoc(collection(db, 'movimentacoesEstoque'), {
      ...cleanedData,
      criadoEm: new Date().toISOString()
    });

    const itemRef = doc(db, 'itensEstoque', m.itemId);
    const itemSnap = await getDoc(itemRef);
    if (!itemSnap.exists()) return;

    const data = itemSnap.data();
    let novaQtd = Number(data.quantidade) || 0;
    const tipo = m.tipo.toLowerCase();

    if (tipo.includes('entrada') || tipo.includes('devolucao')) {
      novaQtd += Number(m.quantidade);
    } else if (tipo.includes('saida')) {
      novaQtd -= Number(m.quantidade);
    }

    await updateDoc(itemRef, {
      quantidade: Math.max(0, novaQtd)
    });
  };

  // ---- Férias ----
  const addFerias = async (f: Omit<Ferias, 'id' | 'criadoEm'>) => {
    await addDoc(collection(db, 'ferias'), {
      ...f,
      criadoEm: new Date().toISOString()
    });
  };

  const updateFerias = async (id: string, data: Partial<Ferias>) => {
    await updateDoc(doc(db, 'ferias', id), data);
  };

  const deleteFerias = async (id: string) => {
    await deleteDoc(doc(db, 'ferias', id));
  };

  return (
    <DataContext.Provider value={{
      empresas, addEmpresa, updateEmpresa, deleteEmpresa,
      funcionarios, addFuncionario, updateFuncionario, deleteFuncionario,
      registrosPonto, addRegistroPonto, deleteRegistroPonto,
      transacoes, addTransacao, deleteTransacao,
      notas, addNota, updateNotaStatus, deleteNota,
      tarefas, addTarefa, updateTarefa, deleteTarefa,
      anotacoes, addAnotacao, updateAnotacao, deleteAnotacao,
      itensEstoque, addItemEstoque, updateItemEstoque, deleteItemEstoque,
      movimentacoesEstoque, registrarMovimentacaoEstoque,
      ferias, addFerias, updateFerias, deleteFerias,
      isMigrationLoading
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

