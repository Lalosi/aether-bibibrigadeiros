import React, { useCallback, useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import SimpleCard from '@/components/SimpleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NovoPedidoDialog } from '@/components/dialogs/NovoPedidoDialog';
import { ObjectPopup } from '@/components/ObjectPopup';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Package, CreditCard, Truck, Check, XCircle, Loader2, Ban, Eye, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';

interface PedidoRow {
  id: number;
  cliente_id: number | null;
  data_pedido: string;
  valor_total: number;
  metodo_pagamento: string | null;
  status: string;
  observacoes: string | null;
  cliente?: { nome: string } | null;
}

const STATUS_OPTIONS = [
  'Aguardando Pagamento', 'Confirmado', 'Em Preparo', 'Em Entrega', 'Entregue', 'Cancelado',
];

const statusIconMap: Record<string, JSX.Element> = {
  'Aguardando Pagamento': <CreditCard className="h-4 w-4" />,
  'Confirmado': <Check className="h-4 w-4" />,
  'Em Preparo': <Package className="h-4 w-4" />,
  'Em Entrega': <Truck className="h-4 w-4" />,
  'Entregue': <Check className="h-4 w-4" />,
  'Cancelado': <XCircle className="h-4 w-4" />,
};

const statusColorMap: Record<string, string> = {
  'Aguardando Pagamento': 'bg-yellow-100 text-yellow-800',
  'Confirmado': 'bg-blue-100 text-blue-800',
  'Em Preparo': 'bg-purple-100 text-purple-800',
  'Em Entrega': 'bg-indigo-100 text-indigo-800',
  'Entregue': 'bg-green-100 text-green-800',
  'Cancelado': 'bg-red-100 text-red-800',
};

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PedidosPage = () => {
  const { role } = useAuth();
  const canEdit = role === 'admin' || role === 'master';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [detalhe, setDetalhe] = useState<PedidoRow | null>(null);
  const [toCancel, setToCancel] = useState<PedidoRow | null>(null);
  const [popup, setPopup] = useState<{ title: string; cls: string; data: any } | null>(null);

  const showObject = (title: string, cls: string, data: any) =>
    setPopup({ title, cls, data });

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pedidos')
      .select('id, cliente_id, data_pedido, valor_total, metodo_pagamento, status, observacoes, cliente:clientes(nome)')
      .order('data_pedido', { ascending: false });
    if (error) toast.error('Erro ao carregar pedidos', { description: error.message });
    setPedidos((data as any) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  const handleStatusChange = async (pedido: PedidoRow, novo: string) => {
    if (novo === pedido.status) return;
    const { data, error } = await supabase
      .from('pedidos').update({ status: novo }).eq('id', pedido.id).select().single();
    if (error) {
      toast.error('Erro ao atualizar status', { description: error.message });
      return;
    }
    toast.success(`Status atualizado para "${novo}"`);
    showObject('Pedido Atualizado', 'Pedido', data);
    fetchPedidos();
  };

  const confirmCancel = async () => {
    if (!toCancel) return;
    const { data, error } = await supabase
      .from('pedidos').update({ status: 'Cancelado' }).eq('id', toCancel.id).select().single();
    if (error) {
      toast.error('Erro ao cancelar', { description: error.message });
    } else {
      toast.success('Pedido cancelado!');
      showObject('Pedido Cancelado', 'Pedido', data);
      fetchPedidos();
    }
    setToCancel(null);
  };

  const filtrados = pedidos.filter(p => {
    if (!busca) return true;
    const s = busca.toLowerCase();
    return String(p.id).includes(s) || (p.cliente?.nome ?? '').toLowerCase().includes(s);
  });

  return (
    <MainLayout title="Gerenciamento de Pedidos">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <Button
          className="bg-confectionery-pink hover:bg-confectionery-pink/80 text-primary-foreground"
          onClick={() => setDialogOpen(true)}
        >
          Novo Pedido
        </Button>
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar por ID/cliente..." className="pl-8" value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </div>

      <SimpleCard>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando pedidos...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map(p => (
                <TableRow key={p.id} className="animate-fade-in">
                  <TableCell className="font-medium">#PED{String(p.id).padStart(3, '0')}</TableCell>
                  <TableCell>{p.cliente?.nome ?? '—'}</TableCell>
                  <TableCell>{new Date(p.data_pedido).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{fmtBRL(Number(p.valor_total))}</TableCell>
                  <TableCell>{p.metodo_pagamento ?? '—'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs inline-flex items-center gap-1 w-fit ${statusColorMap[p.status] ?? 'bg-gray-100 text-gray-800'}`}>
                      {statusIconMap[p.status]}
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" title="Detalhes" onClick={() => setDetalhe(p)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" title="Editar pedido">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2" align="end">
                            <div className="text-xs font-medium px-2 py-1 text-muted-foreground">Alterar status</div>
                            <div className="grid gap-1">
                              {STATUS_OPTIONS.map(s => (
                                <Button
                                  key={s} variant="ghost" size="sm"
                                  className="justify-start h-8"
                                  disabled={s === p.status}
                                  onClick={() => handleStatusChange(p, s)}
                                >
                                  {statusIconMap[s]} <span className="ml-2">{s}</span>
                                </Button>
                              ))}
                              <div className="my-1 h-px bg-border" />
                              <Button
                                variant="ghost" size="sm"
                                className="justify-start h-8 text-destructive hover:text-destructive"
                                disabled={p.status === 'Cancelado'}
                                onClick={() => setToCancel(p)}
                              >
                                <Ban className="h-4 w-4 mr-2" /> Cancelar pedido
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtrados.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
        <div className="text-sm text-gray-500 mt-4">
          Mostrando {filtrados.length} de {pedidos.length} pedidos
        </div>
      </SimpleCard>

      <NovoPedidoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={fetchPedidos}
        onShowObject={showObject}
      />

      <AlertDialog open={!!toCancel} onOpenChange={(o) => !o && setToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              O pedido terá seu status alterado para <strong>Cancelado</strong>. Esta ação pode ser revertida alterando o status novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive text-destructive-foreground">
              Cancelar Pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ObjectPopup
        open={!!detalhe}
        onOpenChange={(o) => !o && setDetalhe(null)}
        title="Detalhes do Pedido"
        className="Pedido"
        data={detalhe ? {
          id: detalhe.id,
          cliente: detalhe.cliente?.nome ?? null,
          cliente_id: detalhe.cliente_id,
          data_pedido: new Date(detalhe.data_pedido).toLocaleString('pt-BR'),
          valor_total: Number(detalhe.valor_total),
          metodo_pagamento: detalhe.metodo_pagamento,
          status: detalhe.status,
          observacoes: detalhe.observacoes,
        } : null}
      />

      <ObjectPopup
        open={!!popup}
        onOpenChange={(o) => !o && setPopup(null)}
        title={popup?.title ?? ''}
        className={popup?.cls ?? ''}
        data={popup?.data ?? null}
      />
    </MainLayout>
  );
};

export default PedidosPage;
