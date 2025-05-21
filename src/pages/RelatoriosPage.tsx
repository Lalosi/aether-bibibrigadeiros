
import React, { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import SimpleCard from '@/components/SimpleCard';
import ChartCard from '@/components/ChartCard';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { FileDown, Filter } from 'lucide-react';

// Dados de exemplo para os gráficos
const vendasMensais = [
  { mes: 'Jan', receita: 42000, despesa: 30000, lucro: 12000 },
  { mes: 'Fev', receita: 38000, despesa: 28000, lucro: 10000 },
  { mes: 'Mar', receita: 45000, despesa: 31000, lucro: 14000 },
  { mes: 'Abr', receita: 50000, despesa: 32000, lucro: 18000 },
  { mes: 'Mai', receita: 48000, despesa: 31000, lucro: 17000 },
  { mes: 'Jun', receita: 52000, despesa: 34000, lucro: 18000 },
];

const produtosMaisVendidos = [
  { nome: 'Bolo de Chocolate', quantidade: 120, valor: 10800 },
  { nome: 'Torta de Morango', quantidade: 95, valor: 7600 },
  { nome: 'Brigadeiro', quantidade: 300, valor: 6000 },
  { nome: 'Cupcake', quantidade: 150, valor: 5250 },
  { nome: 'Docinhos Diversos', quantidade: 250, valor: 5000 },
];

const dadosProdutosGrafico = [
  { nome: 'Bolo de Chocolate', valor: 10800, cor: '#f9a8d4' },
  { nome: 'Torta de Morango', valor: 7600, cor: '#a8a8f9' },
  { nome: 'Brigadeiro', valor: 6000, cor: '#a8f9a8' },
  { nome: 'Cupcake', valor: 5250, cor: '#f9f9a8' },
  { nome: 'Docinhos Diversos', valor: 5000, cor: '#f9a8a8' },
];

const RelatoriosPage = () => {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mensal');

  // Funções simuladas
  const handleExportarRelatorio = () => {
    alert('Relatório exportado com sucesso!');
  };

  const handleFiltrarPeriodo = (periodo: string) => {
    setPeriodoSelecionado(periodo);
  };

  return (
    <MainLayout title="Relatórios">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-x-2">
          <Button 
            variant={periodoSelecionado === 'semanal' ? 'default' : 'outline'} 
            onClick={() => handleFiltrarPeriodo('semanal')}
            className={periodoSelecionado === 'semanal' ? 'bg-confectionery-pink hover:bg-confectionery-pink/80' : ''}
          >
            Semanal
          </Button>
          <Button 
            variant={periodoSelecionado === 'mensal' ? 'default' : 'outline'} 
            onClick={() => handleFiltrarPeriodo('mensal')}
            className={periodoSelecionado === 'mensal' ? 'bg-confectionery-pink hover:bg-confectionery-pink/80' : ''}
          >
            Mensal
          </Button>
          <Button 
            variant={periodoSelecionado === 'anual' ? 'default' : 'outline'} 
            onClick={() => handleFiltrarPeriodo('anual')}
            className={periodoSelecionado === 'anual' ? 'bg-confectionery-pink hover:bg-confectionery-pink/80' : ''}
          >
            Anual
          </Button>
        </div>
        
        <Button onClick={handleExportarRelatorio} className="bg-confectionery-pink hover:bg-confectionery-pink/80">
          <FileDown className="mr-2 h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Desempenho Financeiro" actions={<span className="text-xs bg-confectionery-yellow/30 px-2 py-1 rounded-md">Mensal</span>}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={vendasMensais}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
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
              <Line type="monotone" dataKey="receita" stroke="#F9A8D4" strokeWidth={2} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="despesa" stroke="#0B2559" strokeWidth={2} />
              <Line type="monotone" dataKey="lucro" stroke="#4ade80" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        
        <ChartCard title="Produtos Mais Vendidos" actions={<Filter size={16} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosProdutosGrafico}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {dadosProdutosGrafico.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`R$ ${value}`, 'Valor']}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '0.5rem',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="overflow-y-auto h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosMaisVendidos.map((produto) => (
                    <TableRow key={produto.nome}>
                      <TableCell>{produto.nome}</TableCell>
                      <TableCell className="text-right">R$ {produto.valor.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ChartCard>
      </div>
      
      <SimpleCard title="Detalhamento de Vendas" actions={<Button variant="outline" size="sm"><Filter size={14} className="mr-2" /> Filtrar</Button>}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Lucro Estimado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtosMaisVendidos.map((produto) => (
                <TableRow key={produto.nome}>
                  <TableCell className="font-medium">{produto.nome}</TableCell>
                  <TableCell>{produto.quantidade} unid.</TableCell>
                  <TableCell>R$ {produto.valor.toLocaleString()}</TableCell>
                  <TableCell className="text-green-600">R$ {Math.round(produto.valor * 0.4).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SimpleCard>
    </MainLayout>
  );
};

export default RelatoriosPage;
