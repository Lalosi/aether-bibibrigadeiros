import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import SimpleCard from '@/components/SimpleCard';
import ChartCard from '@/components/ChartCard';
import { Package, ArrowUpRight, ShoppingCart, Users, CreditCard, Wheat } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const fmtBRL = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const Dashboard = () => {
  const [faturamentoMes, setFaturamentoMes] = useState(0);
  const [vendasDia, setVendasDia] = useState(0);
  const [totalEstoque, setTotalEstoque] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [recentes, setRecentes] = useState<any[]>([]);
  const [finais, setFinais] = useState<{ id: string; nome: string; qtd_estoque: number }[]>([]);
  const [insumos, setInsumos] = useState<{ id: string; nome: string; estoque_atual: number; unidade_medida: string }[]>([]);
  const [serieMensal, setSerieMensal] = useState<{ name: string; vendas: number }[]>([]);
  const [serieSemanal, setSerieSemanal] = useState<{ name: string; vendas: number }[]>([]);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startYear = new Date(now.getFullYear(), 0, 1).toISOString();
      const start7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        pedidosMes, pedidosDia, prodEstoque, clientesCount, recentesData,
        topFinais, topInsumos, pedidosAno, pedidos7d,
      ] = await Promise.all([
        supabase.from('pedidos').select('valor_total, status').gte('data_pedido', startMonth).eq('status', 'Entregue'),
        supabase.from('pedidos').select('valor_total, status').gte('data_pedido', startDay).eq('status', 'Entregue'),
        supabase.from('produtos').select('qtd_estoque'),
        supabase.from('clientes').select('id', { count: 'exact', head: true }),
        supabase.from('pedidos').select('id, valor_total, status, data_pedido, cliente:clientes(nome)').order('data_pedido', { ascending: false }).limit(5),
        supabase.from('produtos').select('id, nome, qtd_estoque').order('qtd_estoque', { ascending: true }).limit(5),
        supabase.from('materias_primas').select('id, nome, estoque_atual, unidade_medida').order('estoque_atual', { ascending: true }).limit(5),
        supabase.from('pedidos').select('valor_total, data_pedido, status').gte('data_pedido', startYear).eq('status', 'Entregue'),
        supabase.from('pedidos').select('valor_total, data_pedido, status').gte('data_pedido', start7d).eq('status', 'Entregue'),
      ]);

      setFaturamentoMes((pedidosMes.data ?? []).reduce((s, p: any) => s + Number(p.valor_total || 0), 0));
      setVendasDia((pedidosDia.data ?? []).reduce((s, p: any) => s + Number(p.valor_total || 0), 0));
      setTotalEstoque((prodEstoque.data ?? []).reduce((s, p: any) => s + Number(p.qtd_estoque || 0), 0));
      setTotalClientes(clientesCount.count ?? 0);
      setRecentes(recentesData.data ?? []);
      setFinais((topFinais.data as any) ?? []);
      setInsumos((topInsumos.data as any) ?? []);

      const mensal = Array.from({ length: 12 }, (_, i) => ({ name: MESES_PT[i], vendas: 0 }));
      (pedidosAno.data ?? []).forEach((p: any) => {
        const m = new Date(p.data_pedido).getMonth();
        mensal[m].vendas += Number(p.valor_total || 0);
      });
      setSerieMensal(mensal);

      const semanal = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        return { name: DIAS_PT[d.getDay()], vendas: 0, _date: d.toDateString() };
      });
      (pedidos7d.data ?? []).forEach((p: any) => {
        const dStr = new Date(p.data_pedido).toDateString();
        const bucket = semanal.find((b) => b._date === dStr);
        if (bucket) bucket.vendas += Number(p.valor_total || 0);
      });
      setSerieSemanal(semanal.map(({ _date, ...r }) => r));
    })();
  }, []);

  return (
    <MainLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Faturamento Mensal" value={fmtBRL(faturamentoMes)} subtitle="Pedidos entregues no mês" icon={<ArrowUpRight size={18} />} color="pink" />
        <StatCard title="Vendas do Dia" value={fmtBRL(vendasDia)} subtitle="Pedidos entregues hoje" icon={<CreditCard size={18} />} color="yellow" />
        <StatCard title="Produtos em Estoque" value={String(totalEstoque)} subtitle="Soma das unidades" icon={<Package size={18} />} color="green" />
        <StatCard title="Total de Clientes" value={String(totalClientes)} subtitle="Cadastrados" icon={<Users size={18} />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Faturamento Mensal" actions={<span className="text-xs bg-confectionery-yellow/30 px-2 py-1 rounded-md">Ano atual</span>}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={serieMensal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
              <Legend />
              <Line type="monotone" dataKey="vendas" name="Vendas" stroke="#F9A8D4" strokeWidth={2} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Vendas dos últimos 7 dias" actions={<span className="text-xs bg-confectionery-yellow/30 px-2 py-1 rounded-md">Semanal</span>}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serieSemanal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
              <Legend />
              <Bar dataKey="vendas" name="Vendas" fill="#F9A8D4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleCard title="Pedidos Recentes" actions={<Link to="/pedidos" className="text-sm text-primary-foreground hover:underline">Ver Todos</Link>}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-confectionery-pink/20">
                  <th className="text-left font-medium text-gray-500 pb-3">ID</th>
                  <th className="text-left font-medium text-gray-500 pb-3">Cliente</th>
                  <th className="text-left font-medium text-gray-500 pb-3">Data</th>
                  <th className="text-left font-medium text-gray-500 pb-3">Valor</th>
                  <th className="text-left font-medium text-gray-500 pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentes.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Sem pedidos.</td></tr>
                )}
                {recentes.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-confectionery-pink/5 animate-hover">
                    <td className="py-4">#{String(p.id).padStart(3, '0')}</td>
                    <td className="py-4">{p.cliente?.nome ?? '—'}</td>
                    <td className="py-4">{new Date(p.data_pedido).toLocaleDateString('pt-BR')}</td>
                    <td className="py-4">{fmtBRL(Number(p.valor_total))}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        p.status === 'Entregue' ? 'bg-green-100 text-green-800' :
                        p.status === 'Cancelado' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SimpleCard>

        <div className="space-y-6">
          <SimpleCard title="Produtos Finais (prontos para venda)" actions={<Link to="/estoque" className="text-sm text-primary-foreground hover:underline">Ver estoque</Link>}>
            <div className="space-y-3">
              {finais.length === 0 && <p className="text-sm text-muted-foreground">Sem dados.</p>}
              {finais.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg border border-confectionery-pink/20 hover:border-confectionery-pink animate-hover">
                  <div className="w-10 h-10 rounded-lg bg-confectionery-pink flex items-center justify-center">
                    <ShoppingCart size={18} className="text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{p.nome}</h3>
                    <p className="text-xs text-gray-500">Estoque: {p.qtd_estoque} un</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${p.qtd_estoque > 10 ? 'bg-green-100 text-green-800' : p.qtd_estoque > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {p.qtd_estoque > 10 ? 'Disponível' : p.qtd_estoque > 0 ? 'Baixo' : 'Indisponível'}
                  </span>
                </div>
              ))}
            </div>
          </SimpleCard>
          <SimpleCard title="Matérias-Primas (insumos)" actions={<Link to="/materias-primas" className="text-sm text-primary-foreground hover:underline">Ver insumos</Link>}>
            <div className="space-y-3">
              {insumos.length === 0 && <p className="text-sm text-muted-foreground">Sem insumos cadastrados.</p>}
              {insumos.map((m) => (
                <div key={m.id} className="flex items-center gap-4 p-3 rounded-lg border border-confectionery-pink/20 hover:border-confectionery-pink animate-hover">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Wheat size={18} className="text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{m.nome}</h3>
                    <p className="text-xs text-gray-500">Estoque: {Number(m.estoque_atual).toFixed(2)} {m.unidade_medida}</p>
                  </div>
                </div>
              ))}
            </div>
          </SimpleCard>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
