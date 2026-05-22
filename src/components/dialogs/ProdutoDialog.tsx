import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Database, Loader2, Plus, Trash2, Factory, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { config } from '@/lib/config';

const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  categoria_id: z.string().min(1, 'Categoria é obrigatória'),
  preco_venda: z.coerce.number().nonnegative(),
  preco_custo: z.coerce.number().nonnegative(),
  qtd_estoque: z.coerce.number().int().nonnegative(),
  fornecedor: z.string().max(100).optional().or(z.literal('')),
  tempo_producao_min: z.coerce.number().nonnegative().default(0),
  margem_desejada_pct: z.coerce.number().nonnegative().default(50),
  custo_fixo_pct: z.coerce.number().nonnegative().default(10),
  valor_hora_trabalho: z.coerce.number().nonnegative().default(25),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

export interface ProdutoRow {
  id: string;
  nome: string;
  categoria: string | null;
  categoria_id?: number | string | null;
  preco_venda: number;
  preco_custo: number | null;
  qtd_estoque: number;
  fornecedor: string | null;
  tempo_producao_min?: number | null;
  margem_desejada_pct?: number | null;
  custo_fixo_pct?: number | null;
  valor_hora_trabalho?: number | null;
}

interface MateriaPrima {
  id: string;
  nome: string;
  unidade_medida: string;
  preco_compra: number;
  quantidade_embalagem: number;
  estoque_atual: number;
}

interface FichaItem {
  id?: string;
  materia_prima_id: string;
  quantidade_usada: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onShowObject?: (title: string, className: string, data: Record<string, any>) => void;
  produto?: ProdutoRow | null;
}

const fmtBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(n) ? n : 0);

export const ProdutoDialog = ({ open, onOpenChange, onSaved, onShowObject, produto }: Props) => {
  const { user, isBypass } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categorias, setCategorias] = useState<{ id: number; nome: string }[]>([]);
  const [materias, setMaterias] = useState<MateriaPrima[]>([]);
  const [ficha, setFicha] = useState<FichaItem[]>([]);
  const [profileValorHora, setProfileValorHora] = useState(25);
  const [produzirQty, setProduzirQty] = useState(1);
  const [producing, setProducing] = useState(false);
  const isEdit = !!produto;

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '', categoria_id: '', preco_venda: 0, preco_custo: 0, qtd_estoque: 0, fornecedor: '',
      tempo_producao_min: 0,
      margem_desejada_pct: config.defaultMargemPct,
      custo_fixo_pct: config.defaultCustoFixoPct,
      valor_hora_trabalho: 25,
    },
  });

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [catsRes, mpsRes] = await Promise.all([
        supabase.from('categorias').select('id, nome').order('nome'),
        supabase.from('materias_primas').select('*').order('nome'),
      ]);
      setCategorias((catsRes.data as any) ?? []);
      setMaterias((mpsRes.data as any) ?? []);

      if (user && !isBypass) {
        const { data: prof } = await supabase
          .from('profiles').select('valor_hora_trabalho').eq('id', (user as any).id).maybeSingle();
        setProfileValorHora(Number((prof as any)?.valor_hora_trabalho ?? 25));
      }

      if (produto?.id) {
        const { data: f } = await supabase
          .from('fichas_tecnicas').select('*').eq('produto_id', produto.id);
        setFicha(((f as any[]) ?? []).map((r) => ({
          id: r.id, materia_prima_id: String(r.materia_prima_id), quantidade_usada: Number(r.quantidade_usada),
        })));
      } else {
        setFicha([]);
      }
      setProduzirQty(1);
    })();

    form.reset({
      nome: produto?.nome ?? '',
      categoria_id: produto?.categoria_id != null ? String(produto.categoria_id) : '',
      preco_venda: Number(produto?.preco_venda ?? 0),
      preco_custo: Number(produto?.preco_custo ?? 0),
      qtd_estoque: produto?.qtd_estoque ?? 0,
      fornecedor: produto?.fornecedor ?? '',
      tempo_producao_min: Number(produto?.tempo_producao_min ?? 0),
      margem_desejada_pct: Number(produto?.margem_desejada_pct ?? config.defaultMargemPct),
      custo_fixo_pct: Number(produto?.custo_fixo_pct ?? config.defaultCustoFixoPct),
      valor_hora_trabalho: Number(
        produto?.valor_hora_trabalho ?? profileValorHora ?? 25,
      ),
    });
  }, [open, produto, form, user, isBypass]);

  // ===== BI Calculations (live) =====
  const tempoMin = form.watch('tempo_producao_min') ?? 0;
  const margem = form.watch('margem_desejada_pct') ?? 0;
  const fixoPct = form.watch('custo_fixo_pct') ?? 0;
  const valorHora = form.watch('valor_hora_trabalho') ?? 0;

  const calc = useMemo(() => {
    const custoInsumos = ficha.reduce((acc, item) => {
      const mp = materias.find((m) => String(m.id) === String(item.materia_prima_id));
      if (!mp || !mp.quantidade_embalagem) return acc;
      return acc + (Number(item.quantidade_usada) / Number(mp.quantidade_embalagem)) * Number(mp.preco_compra);
    }, 0);
    const custoMaoObra = (Number(tempoMin) / 60) * Number(valorHora);
    // Custo fixo aplicado SOMENTE sobre o custo de insumos
    const custoFixo = custoInsumos * (Number(fixoPct) / 100);
    const custoTotal = custoInsumos + custoMaoObra + custoFixo;
    const precoMinimo = custoTotal;
    const precoSugerido = custoTotal * (1 + Number(margem) / 100);
    return { custoInsumos, custoMaoObra, custoFixo, custoTotal, precoMinimo, precoSugerido };
  }, [ficha, materias, tempoMin, margem, fixoPct, valorHora]);

  const aplicarPrecoSugerido = () => {
    form.setValue('preco_venda', Number(calc.precoSugerido.toFixed(2)));
    form.setValue('preco_custo', Number(calc.custoTotal.toFixed(2)));
    toast.success('Preço sugerido aplicado!');
  };

  // ===== Ficha técnica handlers =====
  const addInsumo = () => setFicha((f) => [...f, { materia_prima_id: '', quantidade_usada: 0 }]);
  const removeInsumo = (i: number) => setFicha((f) => f.filter((_, idx) => idx !== i));
  const updateInsumo = (i: number, patch: Partial<FichaItem>) =>
    setFicha((f) => f.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const persistFicha = async (produtoId: string) => {
    await supabase.from('fichas_tecnicas').delete().eq('produto_id', produtoId);
    const rows = ficha
      .filter((it) => it.materia_prima_id && Number(it.quantidade_usada) > 0)
      .map((it) => ({
        produto_id: produtoId,
        materia_prima_id: it.materia_prima_id,
        quantidade_usada: Number(it.quantidade_usada),
      }));
    if (rows.length) await supabase.from('fichas_tecnicas').insert(rows);
  };

  const onSubmit = async (data: ProdutoFormData) => {
    setIsSubmitting(true);
    const catId = data.categoria_id ? Number(data.categoria_id) : null;
    const catNome = categorias.find((c) => c.id === catId)?.nome ?? null;
    const payload = {
      nome: data.nome,
      categoria: catNome,
      categoria_id: catId,
      preco_venda: data.preco_venda,
      preco_custo: data.preco_custo,
      qtd_estoque: data.qtd_estoque,
      fornecedor: data.fornecedor || null,
      tempo_producao_min: data.tempo_producao_min,
      margem_desejada_pct: data.margem_desejada_pct,
      custo_fixo_pct: data.custo_fixo_pct,
      valor_hora_trabalho: data.valor_hora_trabalho,
    };

    let savedId = produto?.id;
    if (isEdit && produto) {
      const { error } = await supabase.from('produtos').update(payload).eq('id', produto.id);
      if (error) { setIsSubmitting(false); toast.error('Erro ao salvar', { description: error.message }); return; }
      onShowObject?.('Produto Atualizado', 'Produto', { id: produto.id, ...payload });
    } else {
      const { data: inserted, error } = await supabase.from('produtos').insert(payload).select().single();
      if (error) { setIsSubmitting(false); toast.error('Erro ao salvar', { description: error.message }); return; }
      savedId = (inserted as any)?.id;
      onShowObject?.('Produto Cadastrado', 'Produto', inserted as any);
    }

    if (savedId) await persistFicha(String(savedId));
    setIsSubmitting(false);
    toast.success(isEdit ? 'Produto atualizado!' : 'Produto cadastrado!');
    onSaved();
    onOpenChange(false);
  };

  // ===== Produzir =====
  const handleProduzir = async () => {
    if (!produto?.id) { toast.error('Salve o produto antes de produzir.'); return; }
    if (ficha.length === 0) { toast.error('Cadastre a Ficha Técnica antes de produzir.'); return; }
    if (produzirQty <= 0) { toast.error('Quantidade inválida.'); return; }

    // Validate stock for each insumo
    for (const it of ficha) {
      const mp = materias.find((m) => String(m.id) === String(it.materia_prima_id));
      if (!mp) continue;
      const needed = Number(it.quantidade_usada) * produzirQty;
      if (Number(mp.estoque_atual) < needed) {
        toast.error(`Estoque insuficiente de ${mp.nome}`, {
          description: `Necessário: ${needed} ${mp.unidade_medida} | Disponível: ${mp.estoque_atual} ${mp.unidade_medida}`,
        });
        return;
      }
    }

    setProducing(true);
    // Decrement each materia prima
    for (const it of ficha) {
      const mp = materias.find((m) => String(m.id) === String(it.materia_prima_id));
      if (!mp) continue;
      const novoEstoque = Number(mp.estoque_atual) - Number(it.quantidade_usada) * produzirQty;
      const { error } = await supabase.from('materias_primas')
        .update({ estoque_atual: novoEstoque }).eq('id', mp.id);
      if (error) {
        setProducing(false);
        toast.error('Erro ao baixar insumo', { description: error.message });
        return;
      }
    }
    // Increment product stock
    const novoEstoqueProd = Number(produto.qtd_estoque ?? 0) + produzirQty;
    const { error } = await supabase.from('produtos')
      .update({ qtd_estoque: novoEstoqueProd }).eq('id', produto.id);
    setProducing(false);
    if (error) { toast.error('Erro ao atualizar estoque', { description: error.message }); return; }

    toast.success(`Produção registrada: +${produzirQty} ${produto.nome}`);
    onShowObject?.('Produção Registrada', 'OrdemProducao', {
      produto: produto.nome, quantidade: produzirQty,
      novo_estoque_produto: novoEstoqueProd,
      insumos_baixados: ficha.length,
    });
    // Refresh material list to get updated stock
    const { data: mpsRes } = await supabase.from('materias_primas').select('*').order('nome');
    setMaterias((mpsRes as any) ?? []);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-confectionery-pink" />
            {isEdit ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <DialogDescription>
            🧩 {isEdit ? 'Atualize dados, ficha técnica e precificação.' : 'Cadastre o produto. A ficha técnica fica disponível após o primeiro salvamento.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados">
          <TabsList>
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="ficha">Ficha Técnica</TabsTrigger>
            <TabsTrigger value="precificacao"><Calculator className="h-3 w-3 mr-1" />Precificação</TabsTrigger>
            {isEdit && <TabsTrigger value="produzir"><Factory className="h-3 w-3 mr-1" />Produzir</TabsTrigger>}
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TabsContent value="dados" className="space-y-4 mt-4">
                <FormField control={form.control} name="nome" render={({ field }) => (
                  <FormItem><FormLabel>Nome do Produto</FormLabel>
                    <FormControl><Input placeholder="Ex: Bolo de Chocolate" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="categoria_id" render={({ field }) => (
                  <FormItem><FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2">
                        <option value="">Selecione...</option>
                        {categorias.map(c => <option key={c.id} value={String(c.id)}>{c.nome}</option>)}
                      </select>
                    </FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="preco_venda" render={({ field }) => (
                    <FormItem><FormLabel>Preço de Venda</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="preco_custo" render={({ field }) => (
                    <FormItem><FormLabel>Preço de Custo</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="qtd_estoque" render={({ field }) => (
                    <FormItem><FormLabel>Estoque</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="fornecedor" render={({ field }) => (
                    <FormItem><FormLabel>Fornecedor</FormLabel>
                      <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </TabsContent>

              <TabsContent value="ficha" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Adicione os insumos consumidos por <strong>1 unidade</strong> do produto.</p>
                  <Button type="button" size="sm" variant="outline" onClick={addInsumo}>
                    <Plus className="h-4 w-4 mr-1" /> Insumo
                  </Button>
                </div>
                {ficha.length === 0 && <p className="text-sm text-muted-foreground italic">Nenhum insumo adicionado.</p>}
                <div className="space-y-2">
                  {ficha.map((it, idx) => {
                    const mp = materias.find((m) => String(m.id) === String(it.materia_prima_id));
                    return (
                      <div key={idx} className="flex items-end gap-2 p-2 border rounded-md">
                        <div className="flex-1">
                          <FormLabel className="text-xs">Insumo</FormLabel>
                          <select
                            value={it.materia_prima_id}
                            onChange={(e) => updateInsumo(idx, { materia_prima_id: e.target.value })}
                            className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
                          >
                            <option value="">Selecionar...</option>
                            {materias.map((m) => (
                              <option key={m.id} value={m.id}>{m.nome} ({m.unidade_medida})</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <FormLabel className="text-xs">Qtd usada {mp ? `(${mp.unidade_medida})` : ''}</FormLabel>
                          <Input type="number" step="0.01" value={it.quantidade_usada}
                            onChange={(e) => updateInsumo(idx, { quantidade_usada: Number(e.target.value) })} />
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="text-destructive"
                          onClick={() => removeInsumo(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">A ficha será persistida ao salvar o produto.</p>
              </TabsContent>

              <TabsContent value="precificacao" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="valor_hora_trabalho" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor hora trabalho (R$)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      <p className="text-xs text-muted-foreground">
                        Sugestão inicial vinda do seu perfil ({fmtBRL(profileValorHora)}). Editável e salvo por produto.
                      </p>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="tempo_producao_min" render={({ field }) => (
                    <FormItem><FormLabel>Tempo (min)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="margem_desejada_pct" render={({ field }) => (
                    <FormItem><FormLabel>Margem desejada (%)</FormLabel>
                      <FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="custo_fixo_pct" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo fixo (%)</FormLabel>
                      <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                      <p className="text-xs text-muted-foreground">
                        Percentual aplicado sobre o custo de insumos para cobrir gastos indiretos como gás, energia e limpeza.
                      </p>
                    </FormItem>
                  )} />
                </div>
                <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm space-y-1">
                  <div className="flex justify-between"><span>Custo de Insumos</span><span>{fmtBRL(calc.custoInsumos)}</span></div>
                  <div className="flex justify-between">
                    <span>Mão de Obra ({tempoMin}min × {fmtBRL(valorHora)}/h)</span>
                    <span>{fmtBRL(calc.custoMaoObra)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custos Fixos ({fixoPct}% sobre insumos)</span>
                    <span>{fmtBRL(calc.custoFixo)}</span>
                  </div>
                  <div className="border-t border-border my-1" />
                  <div className="flex justify-between font-semibold">
                    <span>Custo Total de Produção</span><span>{fmtBRL(calc.custoTotal)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Preço Mínimo (lucro zero)</span><span>{fmtBRL(calc.precoMinimo)}</span>
                  </div>
                  <div className="flex justify-between text-green-700 font-semibold">
                    <span>Preço Sugerido (margem {margem}%)</span><span>{fmtBRL(calc.precoSugerido)}</span>
                  </div>
                </div>
                {Number(valorHora) === 0 && (
                  <p className="text-xs text-amber-700">⚠️ Defina o <strong>valor hora trabalho</strong> acima para calcular mão de obra.</p>
                )}
                <Button type="button" variant="outline" onClick={aplicarPrecoSugerido}>
                  <Calculator className="h-4 w-4 mr-2" /> Aplicar preço sugerido
                </Button>
              </TabsContent>

              {isEdit && (
                <TabsContent value="produzir" className="space-y-4 mt-4">
                  <div className="rounded-lg border p-4 space-y-3">
                    <p className="text-sm">
                      Produzir uma quantidade aumenta o estoque do <strong>produto final</strong> e
                      baixa proporcionalmente os insumos da ficha técnica.
                    </p>
                    <div className="flex items-end gap-3">
                      <div className="w-40">
                        <FormLabel>Quantidade a produzir</FormLabel>
                        <Input type="number" min={1} value={produzirQty}
                          onChange={(e) => setProduzirQty(Number(e.target.value))} />
                      </div>
                      <Button type="button" disabled={producing} onClick={handleProduzir}
                        className="bg-green-600 hover:bg-green-700 text-white">
                        {producing ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Produzindo...</>) : (<><Factory className="h-4 w-4 mr-2" /> Produzir</>)}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <strong>Estoque atual do produto:</strong> {produto?.qtd_estoque ?? 0}
                    </div>
                  </div>
                </TabsContent>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-confectionery-pink hover:bg-confectionery-pink/80" disabled={isSubmitting}>
                  {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>) : 'Salvar Produto'}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};