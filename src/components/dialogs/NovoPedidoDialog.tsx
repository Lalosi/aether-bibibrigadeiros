import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Database, Loader2, Check, ChevronsUpDown, UserPlus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ClienteDialog, type ClienteRow } from './ClienteDialog';
import { cn } from '@/lib/utils';

const pedidoSchema = z.object({
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  metodo_pagamento: z.string().min(1),
  status: z.string().min(1),
  observacoes: z.string().optional(),
});

type PedidoFormData = z.infer<typeof pedidoSchema>;

interface ClienteOption { id: number | string; nome: string; }
interface ProdutoOption { id: string; nome: string; preco_venda: number; qtd_estoque: number; }
interface ItemPedido { produto_id: string; quantidade: number; preco_unitario: number; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onShowObject?: (title: string, className: string, data: Record<string, any>) => void;
}

export const NovoPedidoDialog = ({ open, onOpenChange, onSaved, onShowObject }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [produtos, setProdutos] = useState<ProdutoOption[]>([]);
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [comboOpen, setComboOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);

  const form = useForm<PedidoFormData>({
    resolver: zodResolver(pedidoSchema),
    defaultValues: {
      cliente_id: '',
      metodo_pagamento: 'Cartão',
      status: 'Aguardando Pagamento',
      observacoes: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset();
    setSearch('');
    setItens([]);
    loadClientes();
    loadProdutos();
  }, [open]);

  const loadClientes = async () => {
    const { data } = await supabase.from('clientes').select('id, nome').order('nome');
    setClientes((data as ClienteOption[]) ?? []);
  };

  const loadProdutos = async () => {
    const { data } = await supabase.from('produtos').select('id, nome, preco_venda, qtd_estoque').order('nome');
    // Normaliza o id para string (o <select> trabalha com string; o DB aceita bigint via coerção).
    const normalized: ProdutoOption[] = (data ?? []).map((p: any) => ({
      id: String(p.id),
      nome: p.nome,
      preco_venda: Number(p.preco_venda),
      qtd_estoque: Number(p.qtd_estoque),
    }));
    setProdutos(normalized);
  };

  const totalCalc = itens.reduce((acc, it) => acc + it.preco_unitario * it.quantidade, 0);

  const addItem = () => setItens((it) => [...it, { produto_id: '', quantidade: 1, preco_unitario: 0 }]);
  const removeItem = (i: number) => setItens((it) => it.filter((_, idx) => idx !== i));
  const updateItem = (i: number, patch: Partial<ItemPedido>) => {
    setItens((it) => it.map((x, idx) => {
      if (idx !== i) return x;
      const merged = { ...x, ...patch };
      if (patch.produto_id) {
        const p = produtos.find((pr) => String(pr.id) === String(patch.produto_id));
        if (p) merged.preco_unitario = Number(p.preco_venda);
      }
      return merged;
    }));
  };

  const handleClienteCreated = async (created?: ClienteRow) => {
    await loadClientes();
    if (created) {
      form.setValue('cliente_id', String(created.id), { shouldValidate: true });
    }
  };

  const onSubmit = async (data: PedidoFormData) => {
    if (itens.length === 0) {
      toast.error('Adicione pelo menos um item ao pedido.');
      return;
    }
    if (itens.some((it) => !it.produto_id || it.quantidade <= 0)) {
      toast.error('Existem itens incompletos no pedido.');
      return;
    }
    // ===== Reserva imediata: valida estoque para TODOS os itens antes de criar =====
    // Agrega quantidades por produto (caso o mesmo produto apareça em vários itens)
    const totals = new Map<string, number>();
    for (const it of itens) {
      totals.set(it.produto_id, (totals.get(it.produto_id) ?? 0) + Number(it.quantidade));
    }
    for (const [pid, qtd] of totals.entries()) {
      const p = produtos.find((pr) => String(pr.id) === String(pid));
      if (!p) {
        toast.error('Produto não encontrado', { description: `ID ${pid}` });
        return;
      }
      if (Number(p.qtd_estoque) < qtd) {
        toast.error(`Estoque insuficiente: ${p.nome}`, {
          description: `Necessário: ${qtd} | Disponível: ${p.qtd_estoque}`,
        });
        return;
      }
    }
    setIsSubmitting(true);
    const payload = {
      cliente_id: Number(data.cliente_id),
      valor_total: Number(totalCalc.toFixed(2)),
      metodo_pagamento: data.metodo_pagamento,
      status: data.status,
      observacoes: data.observacoes || null,
      data_pedido: new Date().toISOString(),
      estoque_baixado: true,
    };
    const { data: inserted, error } = await supabase
      .from('pedidos').insert(payload).select().single();
    if (error) {
      setIsSubmitting(false);
      toast.error('Erro ao criar pedido', { description: error.message });
      return;
    }
    // persist items
    const pedidoId = (inserted as any).id;
    const itemsPayload = itens.map((it) => ({
      pedido_id: pedidoId,
      produto_id: Number(it.produto_id),
      produto_nome:
        produtos.find((p) => String(p.id) === String(it.produto_id))?.nome ?? null,
      quantidade: Number(it.quantidade),
      preco_unitario: Number(it.preco_unitario),
    }));
    const { error: itErr } = await supabase.from('pedidos_itens').insert(itemsPayload);
    if (itErr) {
      setIsSubmitting(false);
      toast.error('Pedido criado, mas itens falharam', { description: itErr.message });
      return;
    }
    // ===== Baixa imediata de estoque (reserva) =====
    for (const [pid, qtd] of totals.entries()) {
      const p = produtos.find((pr) => String(pr.id) === String(pid));
      if (!p) continue;
      const novo = Number(p.qtd_estoque) - qtd;
      await supabase.from('produtos').update({ qtd_estoque: novo }).eq('id', Number(pid));
    }
    setIsSubmitting(false);
    toast.success('Pedido criado!');
    onShowObject?.('Pedido Cadastrado', 'Pedido', { ...(inserted as any), itens: itemsPayload });
    onSaved();
    onOpenChange(false);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-confectionery-pink" /> Novo Pedido
          </DialogTitle>
          <DialogDescription>
            🧩 Instancia um novo objeto <code className="bg-muted px-1 rounded">Pedido</code> e o persiste no banco.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="cliente_id" render={({ field }) => {
              const selected = clientes.find(c => String(c.id) === field.value);
              const filtered = clientes.filter(c =>
                c.nome.toLowerCase().includes(search.toLowerCase()),
              );
              return (
                <FormItem className="flex flex-col">
                  <FormLabel>Cliente</FormLabel>
                  <div className="flex gap-2">
                  <Popover open={comboOpen} onOpenChange={setComboOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className={cn('flex-1 justify-between font-normal', !field.value && 'text-muted-foreground')}
                          onClick={() => setComboOpen((o) => !o)}
                        >
                          {selected ? selected.nome : 'Buscar cliente...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0 z-[100]"
                      align="start"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <Command shouldFilter={false}>
                        <CommandInput placeholder="Digite o nome..." value={search} onValueChange={setSearch} />
                        <CommandList>
                          {filtered.length === 0 && (
                            <CommandEmpty className="py-6 text-center text-sm">
                              <p className="mb-2 text-muted-foreground">Nenhum cliente encontrado.</p>
                              <p className="text-xs text-muted-foreground">
                                Use o botão <strong>Novo</strong> ao lado para cadastrar.
                              </p>
                            </CommandEmpty>
                          )}
                          {filtered.length > 0 && (
                            <CommandGroup>
                              {filtered.map(c => (
                                <CommandItem
                                  key={c.id}
                                  value={String(c.id)}
                                  onSelect={() => {
                                    form.setValue('cliente_id', String(c.id), { shouldValidate: true });
                                    setComboOpen(false);
                                  }}
                                >
                                  <Check className={cn('mr-2 h-4 w-4', String(c.id) === field.value ? 'opacity-100' : 'opacity-0')} />
                                  {c.nome}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      setComboOpen(false);
                      setClienteDialogOpen(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-1" /> Novo
                  </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="metodo_pagamento" render={({ field }) => (
                <FormItem><FormLabel>Pagamento</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2">
                      <option>Cartão</option><option>Pix</option><option>Dinheiro</option>
                    </select>
                  </FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2">
                      <option>Aguardando Pagamento</option>
                      <option>Confirmado</option>
                      <option>Em Preparo</option>
                      <option>Em Entrega</option>
                      <option>Entregue</option>
                      <option>Cancelado</option>
                    </select>
                  </FormControl><FormMessage /></FormItem>
              )} />
            </div>

            {/* Itens do pedido */}
            <div className="space-y-2 border rounded-md p-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <FormLabel className="m-0">Itens do Pedido</FormLabel>
                <Button type="button" size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Item
                </Button>
              </div>
              {itens.length === 0 && <p className="text-xs text-muted-foreground italic">Nenhum item adicionado.</p>}
              {itens.map((it, idx) => {
                const subtotal = it.preco_unitario * it.quantidade;
                return (
                  <div key={idx} className="flex items-end gap-2">
                    <div className="flex-1">
                      <select value={it.produto_id}
                        onChange={(e) => updateItem(idx, { produto_id: e.target.value })}
                        className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm">
                        <option value="">Produto...</option>
                        {produtos.map((p) => (
                          <option key={p.id} value={p.id}>{p.nome} (estoque: {p.qtd_estoque})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-20">
                      <Input type="number" min={1} value={it.quantidade}
                        onChange={(e) => updateItem(idx, { quantidade: Number(e.target.value) })} />
                    </div>
                    <div className="w-24 text-sm font-mono text-right">
                      {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="text-destructive"
                      onClick={() => removeItem(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              <div className="flex justify-end pt-2 border-t font-semibold">
                Total: {totalCalc.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>

            <FormField control={form.control} name="observacoes" render={({ field }) => (
              <FormItem><FormLabel>Observações</FormLabel>
                <FormControl><Input placeholder="Opcional" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" className="bg-confectionery-pink hover:bg-confectionery-pink/80" disabled={isSubmitting}>
                {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>) : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    <ClienteDialog
      open={clienteDialogOpen}
      onOpenChange={setClienteDialogOpen}
      onSaved={handleClienteCreated}
      defaultNome={search}
    />
    </>
  );
};