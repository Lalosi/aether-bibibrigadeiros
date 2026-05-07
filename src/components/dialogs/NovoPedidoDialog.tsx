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
import { Database, Loader2, Check, ChevronsUpDown, UserPlus } from 'lucide-react';
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
  valor_total: z.coerce.number().min(0.01, 'Valor inválido'),
  metodo_pagamento: z.string().min(1),
  status: z.string().min(1),
  observacoes: z.string().optional(),
});

type PedidoFormData = z.infer<typeof pedidoSchema>;

interface ClienteOption { id: number | string; nome: string; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onShowObject?: (title: string, className: string, data: Record<string, any>) => void;
}

export const NovoPedidoDialog = ({ open, onOpenChange, onSaved, onShowObject }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [comboOpen, setComboOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);

  const form = useForm<PedidoFormData>({
    resolver: zodResolver(pedidoSchema),
    defaultValues: {
      cliente_id: '',
      valor_total: 0,
      metodo_pagamento: 'Cartão',
      status: 'Aguardando Pagamento',
      observacoes: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset();
    setSearch('');
    loadClientes();
  }, [open]);

  const loadClientes = async () => {
    const { data } = await supabase.from('clientes').select('id, nome').order('nome');
    setClientes((data as ClienteOption[]) ?? []);
  };

  const handleClienteCreated = async (created?: ClienteRow) => {
    await loadClientes();
    if (created) {
      form.setValue('cliente_id', String(created.id), { shouldValidate: true });
    }
  };

  const onSubmit = async (data: PedidoFormData) => {
    setIsSubmitting(true);
    const payload = {
      cliente_id: Number(data.cliente_id),
      valor_total: data.valor_total,
      metodo_pagamento: data.metodo_pagamento,
      status: data.status,
      observacoes: data.observacoes || null,
      data_pedido: new Date().toISOString(),
    };
    const { data: inserted, error } = await supabase
      .from('pedidos').insert(payload).select().single();
    setIsSubmitting(false);
    if (error) {
      toast.error('Erro ao criar pedido', { description: error.message });
      return;
    }
    toast.success('Pedido criado!');
    onShowObject?.('Pedido Cadastrado', 'Pedido', inserted as any);
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
                  <Popover open={comboOpen} onOpenChange={setComboOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className={cn('w-full justify-between font-normal', !field.value && 'text-muted-foreground')}
                        >
                          {selected ? selected.nome : 'Buscar cliente...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput placeholder="Digite o nome..." value={search} onValueChange={setSearch} />
                        <CommandList>
                          {filtered.length === 0 && (
                            <CommandEmpty className="py-6 text-center text-sm">
                              <p className="mb-2 text-muted-foreground">Nenhum cliente encontrado.</p>
                              <Button
                                type="button" size="sm"
                                className="bg-confectionery-pink hover:bg-confectionery-pink/80"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setComboOpen(false);
                                  setTimeout(() => setClienteDialogOpen(true), 50);
                                }}
                              >
                                <UserPlus className="mr-2 h-4 w-4" /> Adicionar Novo Cliente
                              </Button>
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
                              <CommandItem
                                value="__new__"
                                onSelect={() => {
                                  setComboOpen(false);
                                  setTimeout(() => setClienteDialogOpen(true), 50);
                                }}
                                className="text-confectionery-pink"
                              >
                                <UserPlus className="mr-2 h-4 w-4" /> Adicionar novo cliente
                              </CommandItem>
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="valor_total" render={({ field }) => (
                <FormItem><FormLabel>Valor Total (R$)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="metodo_pagamento" render={({ field }) => (
                <FormItem><FormLabel>Pagamento</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2">
                      <option>Cartão</option><option>Pix</option><option>Dinheiro</option>
                    </select>
                  </FormControl><FormMessage /></FormItem>
              )} />
            </div>
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