import React, { useCallback, useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import SimpleCard from '@/components/SimpleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Loader2, Wheat } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MateriaPrimaDialog, type MateriaPrimaRow } from '@/components/dialogs/MateriaPrimaDialog';

const fmtBRL = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n ?? 0));

const MateriasPrimasPage = () => {
  const [rows, setRows] = useState<MateriaPrimaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MateriaPrimaRow | null>(null);
  const [toDelete, setToDelete] = useState<MateriaPrimaRow | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('materias_primas').select('*').order('nome');
    if (error) toast.error('Erro ao carregar matérias-primas', { description: error.message });
    setRows((data as any) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const filtered = rows.filter(r => r.nome.toLowerCase().includes(busca.toLowerCase()));

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('materias_primas').delete().eq('id', toDelete.id);
    if (error) toast.error('Erro ao excluir', { description: error.message });
    else { toast.success('Matéria-prima excluída!'); fetchRows(); }
    setToDelete(null);
  };

  return (
    <MainLayout title="Matérias-Primas">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <Button className="bg-confectionery-pink hover:bg-confectionery-pink/80 text-primary-foreground"
          onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nova Matéria-Prima
        </Button>
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar..." className="pl-8" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>
      <SimpleCard>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
          </div>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead><TableHead>Unidade</TableHead>
              <TableHead>Embalagem</TableHead><TableHead>Preço</TableHead>
              <TableHead>Custo unit.</TableHead><TableHead>Estoque</TableHead>
              <TableHead>Fornecedor</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(m => {
                const custoUnit = m.quantidade_embalagem ? Number(m.preco_compra) / Number(m.quantidade_embalagem) : 0;
                return (
                  <TableRow key={m.id} className="animate-fade-in">
                    <TableCell className="font-medium flex items-center gap-2">
                      <Wheat className="h-4 w-4 text-confectionery-pink" />{m.nome}
                    </TableCell>
                    <TableCell>{m.unidade_medida}</TableCell>
                    <TableCell>{m.quantidade_embalagem} {m.unidade_medida}</TableCell>
                    <TableCell>{fmtBRL(Number(m.preco_compra))}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtBRL(custoUnit)}/{m.unidade_medida}
                    </TableCell>
                    <TableCell>{Number(m.estoque_atual).toFixed(2)} {m.unidade_medida}</TableCell>
                    <TableCell>{m.fornecedor ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(m); setOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setToDelete(m)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma matéria-prima cadastrada.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
        <div className="text-sm text-gray-500 mt-4">
          Mostrando {filtered.length} de {rows.length} insumos
        </div>
      </SimpleCard>

      <MateriaPrimaDialog open={open} onOpenChange={setOpen} onSaved={fetchRows} materia={editing} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir matéria-prima?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação executará <code>DELETE FROM materias_primas</code> e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default MateriasPrimasPage;