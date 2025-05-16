
import React from 'react';
import MainLayout from '@/components/MainLayout';
import SimpleCard from '@/components/SimpleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Search,
  Filter,
  Calendar,
  Package,
  CreditCard,
  Truck,
  Check
} from 'lucide-react';

// Dados de exemplo
const pedidos = [
  { 
    id: '#PED001', 
    cliente: 'Maria Silva', 
    data: '15/05/2023', 
    itens: 5, 
    total: 'R$ 180,00', 
    pagamento: 'Cartão', 
    status: 'Entregue' 
  },
  { 
    id: '#PED002', 
    cliente: 'João Santos', 
    data: '16/05/2023', 
    itens: 3, 
    total: 'R$ 75,50', 
    pagamento: 'Pix', 
    status: 'Em Preparo' 
  },
  { 
    id: '#PED003', 
    cliente: 'Ana Oliveira', 
    data: '16/05/2023', 
    itens: 8, 
    total: 'R$ 250,00', 
    pagamento: 'Dinheiro', 
    status: 'Aguardando Pagamento' 
  },
  { 
    id: '#PED004', 
    cliente: 'Carlos Ferreira', 
    data: '17/05/2023', 
    itens: 2, 
    total: 'R$ 65,00', 
    pagamento: 'Cartão', 
    status: 'Em Entrega' 
  },
  { 
    id: '#PED005', 
    cliente: 'Fernanda Lima', 
    data: '18/05/2023', 
    itens: 4, 
    total: 'R$ 120,00', 
    pagamento: 'Pix', 
    status: 'Confirmado' 
  },
];

const statusIconMap = {
  'Aguardando Pagamento': <CreditCard className="h-4 w-4" />,
  'Confirmado': <Check className="h-4 w-4" />,
  'Em Preparo': <Package className="h-4 w-4" />,
  'Em Entrega': <Truck className="h-4 w-4" />,
  'Entregue': <Check className="h-4 w-4" />
};

const statusColorMap = {
  'Aguardando Pagamento': 'bg-yellow-100 text-yellow-800',
  'Confirmado': 'bg-blue-100 text-blue-800',
  'Em Preparo': 'bg-purple-100 text-purple-800',
  'Em Entrega': 'bg-indigo-100 text-indigo-800',
  'Entregue': 'bg-green-100 text-green-800'
};

const PedidosPage = () => {
  return (
    <MainLayout title="Gerenciamento de Pedidos">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <Button className="bg-confectionery-pink hover:bg-confectionery-pink/80 text-primary-foreground">
            Novo Pedido
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Filtrar por Data</span>
            </Button>
            
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filtrar</span>
            </Button>
          </div>
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar pedidos..." className="pl-8" />
        </div>
      </div>
      
      <SimpleCard>
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-confectionery-pink/10">Todos</Button>
            <Button variant="outline" size="sm">Hoje</Button>
            <Button variant="outline" size="sm">Esta Semana</Button>
            <Button variant="outline" size="sm">Este Mês</Button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">Ordenar por:</span>
            <select className="rounded-md border border-confectionery-pink/20 px-3 py-1 text-sm">
              <option>Mais Recentes</option>
              <option>Mais Antigos</option>
              <option>Maior Valor</option>
              <option>Menor Valor</option>
            </select>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidos.map((pedido) => (
              <TableRow key={pedido.id} className="animate-fade-in">
                <TableCell className="font-medium">{pedido.id}</TableCell>
                <TableCell>{pedido.cliente}</TableCell>
                <TableCell>{pedido.data}</TableCell>
                <TableCell>{pedido.itens}</TableCell>
                <TableCell>{pedido.total}</TableCell>
                <TableCell>{pedido.pagamento}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${statusColorMap[pedido.status as keyof typeof statusColorMap]}`}>
                    {statusIconMap[pedido.status as keyof typeof statusIconMap]}
                    {pedido.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Mostrando 5 de 25 pedidos
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Anterior
            </Button>
            <Button variant="outline" size="sm" className="bg-confectionery-pink/10">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <Button variant="outline" size="sm">
              Próximo
            </Button>
          </div>
        </div>
      </SimpleCard>
    </MainLayout>
  );
};

export default PedidosPage;
