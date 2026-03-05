'use client';

import { useData } from './context/DataContext';
import { useAuth } from './context/AuthContext';
import { useMemo } from 'react';

export default function Dashboard() {
  const { funcionarios, registrosPonto, transacoes, notas } = useData();
  const { isAdmin } = useAuth();

  const stats = useMemo(() => {
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const horasMes = registrosPonto
      .filter(r => r.data.startsWith(mesAtual))
      .reduce((acc, r) => acc + r.horasTrabalhadas, 0);

    const entradasMes = transacoes
      .filter(t => t.data.startsWith(mesAtual) && t.tipo === 'entrada')
      .reduce((acc, t) => acc + t.valor, 0);

    const saidasMes = transacoes
      .filter(t => t.data.startsWith(mesAtual) && t.tipo === 'saida')
      .reduce((acc, t) => acc + t.valor, 0);

    return {
      totalFuncionarios: funcionarios.filter(f => f.status === 'ativo').length,
      horasMes: horasMes.toFixed(1),
      entradasMes,
      saidasMes,
    };
  }, [funcionarios, registrosPonto, transacoes]);

  // últimos 6 meses para gráfico
  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short' });

      const entradas = transacoes
        .filter(t => t.data.startsWith(key) && t.tipo === 'entrada')
        .reduce((acc, t) => acc + t.valor, 0);
      const saidas = transacoes
        .filter(t => t.data.startsWith(key) && t.tipo === 'saida')
        .reduce((acc, t) => acc + t.valor, 0);

      months.push({ key, label, entradas, saidas });
    }
    return months;
  }, [transacoes]);

  const maxChartValue = Math.max(...chartData.flatMap(d => [d.entradas, d.saidas]), 1);

  // atividades recentes
  const atividadesRecentes = useMemo(() => {
    const items: { texto: string; tipo: string; data: string }[] = [];

    registrosPonto.slice(-5).reverse().forEach(r => {
      const func = funcionarios.find(f => f.id === r.funcionarioId);
      items.push({
        texto: `${func?.nome || 'Funcionário'} registrou ${r.horasTrabalhadas}h`,
        tipo: 'ponto',
        data: r.data,
      });
    });

    transacoes.slice(-5).reverse().forEach(t => {
      items.push({
        texto: `${t.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}: ${t.descricao} - R$ ${t.valor.toFixed(2)}`,
        tipo: t.tipo,
        data: t.data,
      });
    });

    notas.slice(-3).reverse().forEach(n => {
      const nomes = n.itens?.map(i => i.funcionarioNome).join(', ') || 'Nota';
      items.push({
        texto: `Nota emitida: ${nomes} - R$ ${n.totalValor.toFixed(2)}`,
        tipo: 'nota',
        data: n.criadoEm.split('T')[0],
      });
    });

    return items.sort((a, b) => b.data.localeCompare(a.data)).slice(0, 8);
  }, [registrosPonto, transacoes, notas, funcionarios]);

  return (
    <div>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-card stat-card purple animate-fade-in" style={{ padding: '24px' }} id="stat-funcionarios">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Funcionários Ativos</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>{stats.totalFuncionarios}</div>
        </div>

        <div className="glass-card stat-card cyan animate-fade-in animate-delay-100" style={{ padding: '24px' }} id="stat-horas">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Horas no Mês</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6,182,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>{stats.horasMes}h</div>
        </div>

        <div className="glass-card stat-card green animate-fade-in animate-delay-200" style={{ padding: '24px' }} id="stat-entradas">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Entradas (Mês)</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', color: '#4ade80' }}>
            R$ {stats.entradasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-card stat-card amber animate-fade-in animate-delay-300" style={{ padding: '24px' }} id="stat-saidas">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Saídas (Mês)</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fbbf24' }}>
            R$ {stats.saidasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Chart + Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Chart */}
        <div className="glass-card animate-fade-in" style={{ padding: '24px' }} id="chart-gastos">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px', margin: '0 0 24px 0' }}>
            Movimentação Financeira
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '200px', paddingBottom: '28px', position: 'relative' }}>
            {chartData.map((month) => (
              <div key={month.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', width: '100%', justifyContent: 'center', height: '100%' }}>
                  <div
                    className="chart-bar"
                    style={{
                      height: `${Math.max(4, (month.entradas / maxChartValue) * 100)}%`,
                      background: 'linear-gradient(180deg, #4ade80, #22c55e)',
                      flex: 1,
                      maxWidth: '20px',
                    }}
                    title={`Entradas: R$ ${month.entradas.toFixed(2)}`}
                  />
                  <div
                    className="chart-bar"
                    style={{
                      height: `${Math.max(4, (month.saidas / maxChartValue) * 100)}%`,
                      background: 'linear-gradient(180deg, #fbbf24, #f59e0b)',
                      flex: 1,
                      maxWidth: '20px',
                    }}
                    title={`Saídas: R$ ${month.saidas.toFixed(2)}`}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {month.label}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#4ade80' }} /> Entradas
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#fbbf24' }} /> Saídas
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card animate-fade-in animate-delay-200" style={{ padding: '24px' }} id="recent-activity">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', margin: '0 0 20px 0' }}>
            Atividade Recente
          </h3>
          {atividadesRecentes.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: '13px' }}>Nenhuma atividade ainda</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {atividadesRecentes.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    marginTop: '5px',
                    flexShrink: 0,
                    background: a.tipo === 'entrada' ? '#4ade80' : a.tipo === 'saida' ? '#fbbf24' : a.tipo === 'ponto' ? '#22d3ee' : '#818cf8',
                  }} />
                  <div>
                    <div style={{ color: 'var(--foreground)', lineHeight: 1.4 }}>{a.texto}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                      {new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
