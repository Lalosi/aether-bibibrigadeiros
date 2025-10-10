
import React, { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import SimpleCard from '@/components/SimpleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NovoClienteDialog } from '@/components/dialogs/NovoClienteDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Filter, 
  Mail, 
  Phone,
  MapPin,
  User,
  Edit,
  Trash2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Dados de exemplo - movido para estado
const clientesIniciais = [
  {
    id: 1,
    nome: 'Maria Silva',
    email: 'maria.silva@email.com',
    telefone: '(11) 98765-4321',
    endereco: 'Rua das Flores, 123',
    ultimaCompra: '15/05/2023',
    totalGasto: 'R$ 750,00',
    status: 'Ativo',
    tipo: 'Pessoa Física'
  },
  {
    id: 2,
    nome: 'Festas & Eventos Ltda',
    email: 'contato@festaseventos.com',
    telefone: '(11) 3456-7890',
    endereco: 'Av. Central, 456',
    ultimaCompra: '10/05/2023',
    totalGasto: 'R$ 2.450,00',
    status: 'Ativo',
    tipo: 'Pessoa Jurídica'
  },
  {
    id: 3,
    nome: 'João Santos',
    email: 'joao.santos@email.com',
    telefone: '(11) 98765-1234',
    endereco: 'Rua dos Pinheiros, 789',
    ultimaCompra: '05/05/2023',
    totalGasto: 'R$ 320,00',
    status: 'Ativo',
    tipo: 'Pessoa Física'
  },
  {
    id: 4,
    nome: 'Ana Oliveira',
    email: 'ana.oliveira@email.com',
    telefone: '(11) 97654-3210',
    endereco: 'Alameda Santos, 567',
    ultimaCompra: '02/05/2023',
    totalGasto: 'R$ 480,00',
    status: 'Inativo',
    tipo: 'Pessoa Física'
  },
  {
    id: 5,
    nome: 'Doces & Celebrações',
    email: 'contato@docesecelebracoes.com',
    telefone: '(11) 3333-4444',
    endereco: 'Rua Augusta, 1000',
    ultimaCompra: '01/05/2023',
    totalGasto: 'R$ 1.850,00',
    status: 'Ativo',
    tipo: 'Pessoa Jurídica'
  }
];

const ClientesPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientes, setClientes] = useState(clientesIniciais);

  const handleNovoCliente = (novoCliente: any) => {
    setClientes([novoCliente, ...clientes]);
  };

  return (
    <MainLayout title="Gerenciamento de Clientes">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <Button 
          className="bg-confectionery-pink hover:bg-confectionery-pink/80 text-primary-foreground"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filtrar</span>
          </Button>
          
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar clientes..." className="pl-8" />
          </div>
        </div>
      </div>
      
      <SimpleCard>
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-confectionery-pink/10">Todos</Button>
            <Button variant="outline" size="sm">Pessoa Física</Button>
            <Button variant="outline" size="sm">Pessoa Jurídica</Button>
            <Button variant="outline" size="sm">Ativos</Button>
            <Button variant="outline" size="sm">Inativos</Button>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Última Compra</TableHead>
              <TableHead>Total Gasto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((cliente) => (
              <TableRow key={cliente.id} className="animate-fade-in">
                <TableCell>{cliente.id}</TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback className={cliente.tipo === 'Pessoa Jurídica' ? 'bg-confectionery-blue text-white' : 'bg-confectionery-pink'}>
                        {cliente.nome.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      {cliente.nome}
                      <div className="text-xs text-gray-500">{cliente.tipo}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3" /> {cliente.email}
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3" /> {cliente.telefone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3" /> {cliente.endereco}
                  </div>
                </TableCell>
                <TableCell>{cliente.ultimaCompra}</TableCell>
                <TableCell>{cliente.totalGasto}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    cliente.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {cliente.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Mostrando 5 de 15 clientes
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

      <NovoClienteDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleNovoCliente}
      />
    </MainLayout>
  );
};

export default ClientesPage;
