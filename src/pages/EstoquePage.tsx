import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import SimpleCard from '@/components/SimpleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProdutoDialog, type ProdutoRow } from '@/components/dialogs/ProdutoDialog';
import { SQLPopup } from '@/components/SQLPopup';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const formatBRL = (n: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n ?? 0));

const statusFor = (qtd: number) =>
  qtd > 10 ? 'Disponível' : qtd > 0 ? 'Baixo' : 'Indisponível';

const EstoquePage = () => {
  const [produtos, setProdutos] = useState<ProdutoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProdutoRow | null>(null);
  const [toDelete, setToDelete] = useState<ProdutoRow | null>(null);
  const [sqlPopupOpen, setSqlPopupOpen] = useState(false);
  const [sqlPopupTitle, setSqlPopupTitle] = useState('');
  const [sqlPopupCommand, setSqlPopupCommand] = useState('');

  const showSQLPopup = (title: string, command: string) => {
    setSqlPopupTitle(title);
    setSqlPopupCommand(command);
    setSqlPopupOpen(true);
  };

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('produtos')
      .select('id, nome, categoria, preco_venda, preco_custo, qtd_estoque, fornecedor')
      .order('nome', { ascending: true });
    if (error) toast.error('Erro ao carregar produtos', { description: error.message });
    setProdutos((data as ProdutoRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProdutos(); }, [fetchProdutos]);

  const categorias = ['Todos', ...Array.from(new Set(produtos.map(p => p.categoria).filter(Boolean) as string[]))];

  const produtosFiltrados = produtos.filter(p => {
    const matchCat = categoriaSelecionada === 'Todos' || p.categoria === categoriaSelecionada;
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    return matchCat && matchBusca;
  });

  const handleNovo = () => { setEditing(null); setDialogOpen(true); };
  const handleEditar = (p: ProdutoRow) => { setEditing(p); setDialogOpen(true); };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('produtos').delete().eq('id', toDelete.id);
    if (error) {
      toast.error('Erro ao excluir', { description: error.message });
    } else {
      toast.success('Produto excluído!');
      showSQLPopup('Comando: Excluir Produto', `DELETE FROM produtos WHERE id='${toDelete.id}';`);
      fetchProdutos();
    }
    setToDelete(null);
  };

  return (
    <MainLayout title="Gerenciamento de Estoque">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button className="bg-confectionery-pink hover:bg-confectionery-pink/80 text-primary-foreground" onClick={handleNovo}>
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Categoria:</span>
            <select
              value={categoriaSelecionada}
              onChange={(e) => setCategoriaSelecionada(e.target.value)}
              className="rounded-md border border-confectionery-pink/20 px-3 py-1"
            >
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar produtos..." className="pl-8" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      <SimpleCard>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando produtos...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço Venda</TableHead>
                <TableHead>Preço Custo</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtosFiltrados.map((p) => {
                const status = statusFor(p.qtd_estoque);
                return (
                  <TableRow key={p.id} className="animate-fade-in">
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>{p.categoria ?? '—'}</TableCell>
                    <TableCell>{formatBRL(p.preco_venda)}</TableCell>
                    <TableCell>{formatBRL(p.preco_custo)}</TableCell>
                    <TableCell>{p.qtd_estoque}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        status === 'Disponível' ? 'bg-green-100 text-green-800' :
                        status === 'Baixo' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>{status}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditar(p)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setToDelete(p)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {produtosFiltrados.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <div className="text-sm text-gray-500 mt-4">
          Mostrando {produtosFiltrados.length} de {produtos.length} produtos
        </div>
      </SimpleCard>

      <ProdutoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={fetchProdutos}
        onShowSQL={showSQLPopup}
        produto={editing}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação executará <code>DELETE FROM produtos</code> e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SQLPopup open={sqlPopupOpen} onOpenChange={setSqlPopupOpen} title={sqlPopupTitle} sqlCommand={sqlPopupCommand} />
    </MainLayout>
  );
};

export default EstoquePage;
