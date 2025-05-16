
import React, { useState } from 'react';
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
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Dados de exemplo
const produtosEstoque = [
  { id: 1, nome: 'Bolo de Chocolate', categoria: 'Bolos', preco: 'R$ 40,00', estoque: 25, status: 'Disponível' },
  { id: 2, nome: 'Brigadeiros (20un)', categoria: 'Doces', preco: 'R$ 25,00', estoque: 8, status: 'Baixo' },
  { id: 3, nome: 'Torta de Morango', categoria: 'Tortas', preco: 'R$ 35,00', estoque: 12, status: 'Disponível' },
  { id: 4, nome: 'Cupcake de Baunilha', categoria: 'Cupcakes', preco: 'R$ 8,00', estoque: 30, status: 'Disponível' },
  { id: 5, nome: 'Trufas de Chocolate', categoria: 'Doces', preco: 'R$ 3,50', estoque: 5, status: 'Baixo' },
  { id: 6, nome: 'Bolo de Cenoura', categoria: 'Bolos', preco: 'R$ 38,00', estoque: 18, status: 'Disponível' },
  { id: 7, nome: 'Macarons (10un)', categoria: 'Doces', preco: 'R$ 30,00', estoque: 0, status: 'Indisponível' },
];

const categorias = ['Todos', 'Bolos', 'Tortas', 'Doces', 'Cupcakes'];

const EstoquePage = () => {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos');
  const [busca, setBusca] = useState('');
  
  const produtosFiltrados = produtosEstoque.filter(produto => {
    const matchesCategoria = categoriaSelecionada === 'Todos' || produto.categoria === categoriaSelecionada;
    const matchesBusca = produto.nome.toLowerCase().includes(busca.toLowerCase());
    return matchesCategoria && matchesBusca;
  });

  return (
    <MainLayout title="Gerenciamento de Estoque">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button className="bg-confectionery-pink hover:bg-confectionery-pink/80 text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Categoria:</span>
            <select
              value={categoriaSelecionada}
              onChange={(e) => setCategoriaSelecionada(e.target.value)}
              className="rounded-md border border-confectionery-pink/20 px-3 py-1"
            >
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar produtos..." 
            className="pl-8" 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>
      
      <SimpleCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Nome do Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtosFiltrados.map((produto) => (
              <TableRow key={produto.id} className="animate-fade-in">
                <TableCell>{produto.id}</TableCell>
                <TableCell className="font-medium">{produto.nome}</TableCell>
                <TableCell>{produto.categoria}</TableCell>
                <TableCell>{produto.preco}</TableCell>
                <TableCell>{produto.estoque}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    produto.status === 'Disponível' ? 'bg-green-100 text-green-800' : 
                    produto.status === 'Baixo' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {produto.status}
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
            Mostrando {produtosFiltrados.length} de {produtosEstoque.length} produtos
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="bg-confectionery-pink/10">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SimpleCard>
    </MainLayout>
  );
};

export default EstoquePage;
