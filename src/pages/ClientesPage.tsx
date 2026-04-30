import React, { useCallback, useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import SimpleCard from '@/components/SimpleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClienteDialog, type ClienteRow } from '@/components/dialogs/ClienteDialog';
import { SQLPopup } from '@/components/SQLPopup';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Mail, Phone, MapPin, Edit, Trash2, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type FiltroTipo = 'Todos' | 'Pessoa Física' | 'Pessoa Jurídica' | 'Ativos' | 'Inativos';

const ClientesPage = () => {
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<FiltroTipo>('Todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClienteRow | null>(null);
  const [toDelete, setToDelete] = useState<ClienteRow | null>(null);
  const [sqlPopupOpen, setSqlPopupOpen] = useState(false);
  const [sqlPopupTitle, setSqlPopupTitle] = useState('');
  const [sqlPopupCommand, setSqlPopupCommand] = useState('');

  const showSQLPopup = (title: string, command: string) => {
    setSqlPopupTitle(title); setSqlPopupCommand(command); setSqlPopupOpen(true);
  };

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome, cpf_cnpj, telefone, endereco, email, tipo, status')
      .order('nome', { ascending: true });
    if (error) toast.error('Erro ao carregar clientes', { description: error.message });
    setClientes((data as ClienteRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const clientesFiltrados = clientes.filter(c => {
    const buscaOK = !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(busca.toLowerCase());
    let filtroOK = true;
    if (filtro === 'Pessoa Física') filtroOK = c.tipo === 'Pessoa Física';
    else if (filtro === 'Pessoa Jurídica') filtroOK = c.tipo === 'Pessoa Jurídica';
    else if (filtro === 'Ativos') filtroOK = c.status === 'Ativo';
    else if (filtro === 'Inativos') filtroOK = c.status === 'Inativo';
    return buscaOK && filtroOK;
  });

  const handleNovo = () => { setEditing(null); setDialogOpen(true); };
  const handleEditar = (c: ClienteRow) => { setEditing(c); setDialogOpen(true); };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('clientes').delete().eq('id', toDelete.id);
    if (error) {
      toast.error('Erro ao excluir', { description: error.message });
    } else {
      toast.success('Cliente excluído!');
      showSQLPopup('Comando: Excluir Cliente', `DELETE FROM clientes WHERE id='${toDelete.id}';`);
      fetchClientes();
    }
    setToDelete(null);
  };

  const filtros: FiltroTipo[] = ['Todos', 'Pessoa Física', 'Pessoa Jurídica', 'Ativos', 'Inativos'];

  return (
    <MainLayout title="Gerenciamento de Clientes">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <Button className="bg-confectionery-pink hover:bg-confectionery-pink/80 text-primary-foreground" onClick={handleNovo}>
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar clientes..." className="pl-8" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      <SimpleCard>
        <div className="flex gap-2 mb-4 flex-wrap">
          {filtros.map(f => (
            <Button
              key={f} variant="outline" size="sm"
              className={filtro === f ? 'bg-confectionery-pink/10' : ''}
              onClick={() => setFiltro(f)}
            >{f}</Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando clientes...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesFiltrados.map((c) => (
                <TableRow key={c.id} className="animate-fade-in">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback className={c.tipo === 'Pessoa Jurídica' ? 'bg-confectionery-blue text-white' : 'bg-confectionery-pink'}>
                          {c.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        {c.nome}
                        <div className="text-xs text-gray-500">{c.tipo ?? '—'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3" /> {c.email ?? '—'}</div>
                      <div className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3" /> {c.telefone ?? '—'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm"><MapPin className="h-3 w-3" /> {c.endereco ?? '—'}</div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      c.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>{c.status ?? '—'}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditar(c)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setToDelete(c)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {clientesFiltrados.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <div className="text-sm text-gray-500 mt-4">
          Mostrando {clientesFiltrados.length} de {clientes.length} clientes
        </div>
      </SimpleCard>

      <ClienteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={fetchClientes}
        onShowSQL={showSQLPopup}
        cliente={editing}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação executará <code>DELETE FROM clientes</code> e não pode ser desfeita.
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

export default ClientesPage;
