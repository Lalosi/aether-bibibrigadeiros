import React, { useEffect } from 'react';
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
import { Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const clienteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  cpf_cnpj: z.string().min(11, 'CPF/CNPJ inválido').max(18),
  telefone: z.string().min(10, 'Telefone inválido').max(20),
  endereco: z.string().min(1, 'Endereço é obrigatório').max(200),
  email: z.string().email('E-mail inválido'),
  tipo: z.enum(['Pessoa Física', 'Pessoa Jurídica']),
  status: z.enum(['Ativo', 'Inativo']),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

export interface ClienteRow {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  endereco: string | null;
  email: string | null;
  tipo: string | null;
  status: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (saved?: ClienteRow) => void;
  onShowObject?: (title: string, className: string, data: Record<string, any>) => void;
  cliente?: ClienteRow | null;
  defaultNome?: string;
}

export const ClienteDialog = ({ open, onOpenChange, onSaved, onShowObject, cliente, defaultNome }: Props) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEdit = !!cliente;

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '', cpf_cnpj: '', telefone: '', endereco: '', email: '',
      tipo: 'Pessoa Física', status: 'Ativo',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        nome: cliente?.nome ?? defaultNome ?? '',
        cpf_cnpj: cliente?.cpf_cnpj ?? '',
        telefone: cliente?.telefone ?? '',
        endereco: cliente?.endereco ?? '',
        email: cliente?.email ?? '',
        tipo: (cliente?.tipo as any) ?? 'Pessoa Física',
        status: (cliente?.status as any) ?? 'Ativo',
      });
    }
  }, [open, cliente, defaultNome, form]);

  const onSubmit = async (data: ClienteFormData) => {
    setIsSubmitting(true);
    const payload = { ...data, tipo_pessoa: data.tipo };

    let error;
    if (isEdit && cliente) {
      const { error: e } = await supabase.from('clientes').update(payload).eq('id', cliente.id);
      error = e;
      onShowObject?.('Cliente Atualizado', 'Cliente', { id: cliente.id, ...payload });
    } else {
      const { data: inserted, error: e } = await supabase.from('clientes').insert(payload).select().single();
      error = e;
      if (!e && inserted) {
        onShowObject?.('Cliente Cadastrado', 'Cliente', inserted as any);
      }
    }

    setIsSubmitting(false);
    if (error) {
      toast.error('Erro ao salvar cliente', { description: error.message });
      return;
    }
    toast.success(isEdit ? 'Cliente atualizado!' : 'Cliente cadastrado!');
    onOpenChange(false);
    // Forward inserted row to parent (when available) for auto-select use cases
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = (typeof inserted !== 'undefined' ? (inserted as any) : null) as ClienteRow | null;
    onSaved(created ?? undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-confectionery-pink" />
            {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
          <DialogDescription>
            🧩 {isEdit ? 'Atualize os dados do cliente.' : 'Cadastre um novo cliente.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem><FormLabel>Nome Completo</FormLabel>
                <FormControl><Input placeholder="Maria Silva" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="tipo" render={({ field }) => (
                <FormItem><FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2">
                      <option value="Pessoa Física">Pessoa Física</option>
                      <option value="Pessoa Jurídica">Pessoa Jurídica</option>
                    </select>
                  </FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2">
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="cpf_cnpj" render={({ field }) => (
                <FormItem><FormLabel>CPF/CNPJ</FormLabel>
                  <FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="telefone" render={({ field }) => (
                <FormItem><FormLabel>Telefone</FormLabel>
                  <FormControl><Input placeholder="(11) 98765-4321" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>E-mail</FormLabel>
                <FormControl><Input type="email" placeholder="cliente@email.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="endereco" render={({ field }) => (
              <FormItem><FormLabel>Endereço</FormLabel>
                <FormControl><Input placeholder="Rua das Flores, 123" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-confectionery-pink hover:bg-confectionery-pink/80" disabled={isSubmitting}>
                {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>) : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
