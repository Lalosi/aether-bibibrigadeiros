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

const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  preco_venda: z.coerce.number().positive('Preço de venda inválido'),
  preco_custo: z.coerce.number().nonnegative('Preço de custo inválido'),
  qtd_estoque: z.coerce.number().int().nonnegative('Quantidade inválida'),
  fornecedor: z.string().max(100).optional().or(z.literal('')),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

export interface ProdutoRow {
  id: string;
  nome: string;
  categoria: string | null;
  preco_venda: number;
  preco_custo: number | null;
  qtd_estoque: number;
  fornecedor: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onShowSQL?: (title: string, command: string) => void;
  produto?: ProdutoRow | null;
}

export const ProdutoDialog = ({ open, onOpenChange, onSaved, onShowSQL, produto }: Props) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEdit = !!produto;

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '', categoria: '', preco_venda: 0, preco_custo: 0, qtd_estoque: 0, fornecedor: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        nome: produto?.nome ?? '',
        categoria: produto?.categoria ?? '',
        preco_venda: Number(produto?.preco_venda ?? 0),
        preco_custo: Number(produto?.preco_custo ?? 0),
        qtd_estoque: produto?.qtd_estoque ?? 0,
        fornecedor: produto?.fornecedor ?? '',
      });
    }
  }, [open, produto, form]);

  const onSubmit = async (data: ProdutoFormData) => {
    setIsSubmitting(true);
    const payload = {
      nome: data.nome,
      categoria: data.categoria,
      preco_venda: data.preco_venda,
      preco_custo: data.preco_custo,
      qtd_estoque: data.qtd_estoque,
      fornecedor: data.fornecedor || null,
    };

    let error;
    if (isEdit && produto) {
      ({ error } = await supabase.from('produtos').update(payload).eq('id', produto.id));
      onShowSQL?.(
        'Comando: Atualizar Produto',
        `UPDATE produtos\nSET nome='${data.nome}', categoria='${data.categoria}',\n    preco_venda=${data.preco_venda}, preco_custo=${data.preco_custo},\n    qtd_estoque=${data.qtd_estoque}, fornecedor='${data.fornecedor || ''}'\nWHERE id='${produto.id}';`,
      );
    } else {
      ({ error } = await supabase.from('produtos').insert(payload));
      onShowSQL?.(
        'Comando: Inserir Novo Produto',
        `INSERT INTO produtos (nome, categoria, preco_venda, preco_custo, qtd_estoque, fornecedor)\nVALUES ('${data.nome}', '${data.categoria}', ${data.preco_venda}, ${data.preco_custo}, ${data.qtd_estoque}, '${data.fornecedor || ''}');`,
      );
    }

    setIsSubmitting(false);
    if (error) {
      toast.error('Erro ao salvar produto', { description: error.message });
      return;
    }
    toast.success(isEdit ? 'Produto atualizado!' : 'Produto cadastrado!');
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-confectionery-pink" />
            {isEdit ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <DialogDescription>
            🧩 {isEdit ? 'Será executado UPDATE' : 'Será executado INSERT'} na tabela{' '}
            <code className="bg-muted px-1 rounded">produtos</code>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Produto</FormLabel>
                <FormControl><Input placeholder="Ex: Bolo de Chocolate" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="categoria" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <FormControl><Input placeholder="Ex: Bolos" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="preco_venda" render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço de Venda</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="40.00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="preco_custo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço de Custo</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="15.20" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="qtd_estoque" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estoque</FormLabel>
                  <FormControl><Input type="number" placeholder="25" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="fornecedor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <FormControl><Input placeholder="Distribuidora ABC" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

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
