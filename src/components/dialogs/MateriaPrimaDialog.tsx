import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  unidade_medida: z.enum(['g', 'kg', 'ml', 'L', 'un']),
  preco_compra: z.coerce.number().nonnegative(),
  quantidade_embalagem: z.coerce.number().positive(),
  estoque_atual: z.coerce.number().nonnegative().default(0),
  fornecedor: z.string().optional().or(z.literal('')),
});

export type MateriaPrimaForm = z.infer<typeof schema>;

export interface MateriaPrimaRow {
  id: string;
  nome: string;
  unidade_medida: string;
  preco_compra: number;
  quantidade_embalagem: number;
  estoque_atual: number;
  fornecedor: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
  materia?: MateriaPrimaRow | null;
}

export const MateriaPrimaDialog = ({ open, onOpenChange, onSaved, materia }: Props) => {
  const [saving, setSaving] = useState(false);
  const isEdit = !!materia;
  const form = useForm<MateriaPrimaForm>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', unidade_medida: 'g', preco_compra: 0, quantidade_embalagem: 1, estoque_atual: 0, fornecedor: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        nome: materia?.nome ?? '',
        unidade_medida: (materia?.unidade_medida as any) ?? 'g',
        preco_compra: Number(materia?.preco_compra ?? 0),
        quantidade_embalagem: Number(materia?.quantidade_embalagem ?? 1),
        estoque_atual: Number(materia?.estoque_atual ?? 0),
        fornecedor: materia?.fornecedor ?? '',
      });
    }
  }, [open, materia, form]);

  const onSubmit = async (data: MateriaPrimaForm) => {
    setSaving(true);
    const payload = { ...data, fornecedor: data.fornecedor || null };
    const { error } = isEdit && materia
      ? await supabase.from('materias_primas').update(payload).eq('id', materia.id)
      : await supabase.from('materias_primas').insert(payload);
    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar matéria-prima', { description: error.message });
      return;
    }
    toast.success(isEdit ? 'Matéria-prima atualizada!' : 'Matéria-prima cadastrada!');
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-confectionery-pink" />
            {isEdit ? 'Editar Matéria-Prima' : 'Nova Matéria-Prima'}
          </DialogTitle>
          <DialogDescription>🧩 Insumo cadastrado em <code>materias_primas</code>.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Ex: Farinha de Trigo" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="unidade_medida" render={({ field }) => (
                <FormItem><FormLabel>Unidade</FormLabel><FormControl>
                  <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2">
                    <option value="g">g</option><option value="kg">kg</option>
                    <option value="ml">ml</option><option value="L">L</option>
                    <option value="un">un</option>
                  </select>
                </FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="quantidade_embalagem" render={({ field }) => (
                <FormItem><FormLabel>Qtd da Embalagem</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="preco_compra" render={({ field }) => (
                <FormItem><FormLabel>Preço da Embalagem (R$)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="estoque_atual" render={({ field }) => (
                <FormItem><FormLabel>Estoque atual</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="fornecedor" render={({ field }) => (
              <FormItem><FormLabel>Fornecedor</FormLabel>
                <FormControl><Input placeholder="Opcional" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" className="bg-confectionery-pink hover:bg-confectionery-pink/80" disabled={saving}>
                {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>) : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};