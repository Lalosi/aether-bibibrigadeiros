
import React from 'react';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import SimpleCard from '@/components/SimpleCard';
import ChartCard from '@/components/ChartCard';
import { Package, ArrowUpRight, ShoppingCart, Users, CreditCard } from 'lucide-react';
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

const produtosBaixoEstoque = [
  { nome: 'Trufas', quantidadeRestante: 10, total: 100 },
  { nome: 'Brigadeiros', quantidadeRestante: 15, total: 120 },
  { nome: 'Bolos', quantidadeRestante: 5, total: 50 },
];

const pedidosRecentes = [
  { id: 1, cliente: 'Maria Silva', produto: 'Bolo de Chocolate', valor: 'R$89,90', status: 'Entregue' },
  { id: 2, cliente: 'João Santos', produto: 'Torta de Morango', valor: 'R$75,50', status: 'Em Preparo' },
  { id: 3, cliente: 'Ana Oliveira', produto: 'Kit Festa', valor: 'R$250,00', status: 'Aguardando' },
];

const Dashboard = () => {
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
        <SimpleCard title="Pedidos Recentes" actions={<button className="text-sm text-primary-foreground hover:underline">Ver Todos</button>}>
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

        <SimpleCard title="Itens com Estoque Baixo" actions={<button className="text-sm text-primary-foreground hover:underline">Ver Todos</button>}>
          <div className="space-y-4">
            {produtosBaixoEstoque.map((produto, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg border border-confectionery-pink/20 hover:border-confectionery-pink animate-hover">
                <div className="w-12 h-12 rounded-lg bg-confectionery-pink flex items-center justify-center">
                  <ShoppingCart size={20} className="text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{produto.nome}</h3>
                  <p className="text-sm text-gray-500">Quantidade Restante: {produto.quantidadeRestante}</p>
                </div>
                <button className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-800">
                  Baixo
                </button>
              </div>
            ))}
          </div>
        </SimpleCard>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
