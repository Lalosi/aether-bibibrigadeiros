
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import SimpleCard from '@/components/SimpleCard';
import ChartCard from '@/components/ChartCard';
import { Package, ArrowUpRight, ShoppingCart, Users, CreditCard, Wheat } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Dados de exemplo
const vendas = [
  { name: 'Jan', vendas: 40000, lucro: 24000 },
  { name: 'Fev', vendas: 30000, lucro: 18000 },
  { name: 'Mar', vendas: 20000, lucro: 12000 },
  { name: 'Abr', vendas: 27000, lucro: 16000 },
  { name: 'Mai', vendas: 18000, lucro: 11000 },
  { name: 'Jun', vendas: 23000, lucro: 14000 },
];

const vendasSemanais = [
  { name: 'Dom', vendas: 12000, compras: 8000 },
  { name: 'Seg', vendas: 19000, compras: 11000 },
  { name: 'Ter', vendas: 15000, compras: 9000 },
  { name: 'Qua', vendas: 22000, compras: 13000 },
  { name: 'Qui', vendas: 17000, compras: 10000 },
  { name: 'Sex', vendas: 25000, compras: 15000 },
  { name: 'Sáb', vendas: 30000, compras: 18000 },
];

const pedidosRecentes = [
  { id: 1, cliente: 'Maria Silva', produto: 'Bolo de Chocolate', valor: 'R$89,90', status: 'Entregue' },
  { id: 2, cliente: 'João Santos', produto: 'Torta de Morango', valor: 'R$75,50', status: 'Em Preparo' },
  { id: 3, cliente: 'Ana Oliveira', produto: 'Kit Festa', valor: 'R$250,00', status: 'Aguardando' },
];

const Dashboard = () => {
  const [finais, setFinais] = useState<{ id: string; nome: string; qtd_estoque: number }[]>([]);
  const [insumos, setInsumos] = useState<{ id: string; nome: string; estoque_atual: number; unidade: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: m }] = await Promise.all([
        supabase.from('produtos').select('id, nome, qtd_estoque').order('qtd_estoque', { ascending: true }).limit(5),
        supabase.from('materias_primas').select('id, nome, estoque_atual, unidade').order('estoque_atual', { ascending: true }).limit(5),
      ]);
      setFinais((p as any) ?? []);
      setInsumos((m as any) ?? []);
    })();
  }, []);

  return (
    <MainLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard 
          title="Faturamento Mensal" 
          value="R$ 18.300" 
          subtitle="Último mês"
          icon={<ArrowUpRight size={18} />} 
          color="pink"
        />
        <StatCard 
          title="Vendas" 
          value="R$ 950" 
          subtitle="Último dia"
          icon={<CreditCard size={18} />} 
          color="yellow"
        />
        <StatCard 
          title="Produtos em Estoque" 
          value="688" 
          subtitle="200 a receber"
          icon={<Package size={18} />} 
          color="green"
        />
        <StatCard 
          title="Total de Clientes" 
          value="31" 
          subtitle="5 novos este mês"
          icon={<Users size={18} />} 
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Lucro & Receita" actions={<span className="text-xs bg-confectionery-yellow/30 px-2 py-1 rounded-md">Mensal</span>}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={vendas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '0.5rem',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                }} 
              />
              <Legend />
              <Line type="monotone" dataKey="vendas" stroke="#F9A8D4" strokeWidth={2} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="lucro" stroke="#0B2559" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Vendas e Compras" actions={<span className="text-xs bg-confectionery-yellow/30 px-2 py-1 rounded-md">Semanal</span>}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vendasSemanais}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '0.5rem',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                }}
              />
              <Legend />
              <Bar dataKey="vendas" fill="#F9A8D4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="compras" fill="#0B2559" radius={[4, 4, 0, 0]} />
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
                  <th className="text-left font-medium text-gray-500 pb-3">Produto</th>
                  <th className="text-left font-medium text-gray-500 pb-3">Valor</th>
                  <th className="text-left font-medium text-gray-500 pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {pedidosRecentes.map((pedido) => (
                  <tr key={pedido.id} className="border-b border-gray-100 hover:bg-confectionery-pink/5 animate-hover">
                    <td className="py-4">{pedido.id}</td>
                    <td className="py-4">{pedido.cliente}</td>
                    <td className="py-4">{pedido.produto}</td>
                    <td className="py-4">{pedido.valor}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        pedido.status === 'Entregue' ? 'bg-green-100 text-green-800' : 
                        pedido.status === 'Em Preparo' ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pedido.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SimpleCard>

        <div className="space-y-6">
          <SimpleCard
            title="Produtos Finais (prontos para venda)"
            actions={<Link to="/estoque" className="text-sm text-primary-foreground hover:underline">Ver estoque</Link>}
          >
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
          <SimpleCard
            title="Matérias-Primas (insumos)"
            actions={<Link to="/materias-primas" className="text-sm text-primary-foreground hover:underline">Ver insumos</Link>}
          >
            <div className="space-y-3">
              {insumos.length === 0 && <p className="text-sm text-muted-foreground">Sem insumos cadastrados.</p>}
              {insumos.map((m) => (
                <div key={m.id} className="flex items-center gap-4 p-3 rounded-lg border border-confectionery-pink/20 hover:border-confectionery-pink animate-hover">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Wheat size={18} className="text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{m.nome}</h3>
                    <p className="text-xs text-gray-500">Estoque: {Number(m.estoque_atual).toFixed(2)} {m.unidade}</p>
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
