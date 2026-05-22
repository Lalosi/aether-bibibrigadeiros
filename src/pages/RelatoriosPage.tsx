import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import SimpleCard from '@/components/SimpleCard';
import ChartCard from '@/components/ChartCard';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { FileDown, ArrowUpRight, ShoppingBag, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Periodo = 'semanal' | 'mensal' | 'anual';

const fmtBRL = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CORES = ['#f9a8d4', '#a8a8f9', '#a8f9a8', '#f9d68a', '#f9a8a8', '#8ad3f9', '#d4a8f9'];

const periodoStart = (p: Periodo) => {
  const now = new Date();
  if (p === 'semanal') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (p === 'mensal') return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), 0, 1);
};

const bucketLabel = (p: Periodo, d: Date) => {
  if (p === 'semanal') return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  if (p === 'mensal') return `Sem ${Math.ceil(d.getDate() / 7)}`;
  return d.toLocaleDateString('pt-BR', { month: 'short' });
};

interface Pedido { id: number; valor_total: number; data_pedido: string; cliente_id: number | null; }
interface Item { pedido_id: number; produto_id: number | null; produto_nome: string | null; quantidade: number; preco_unitario: number; }

const RelatoriosPage = () => {
  const [periodo, setPeriodo] = useState<Periodo>('mensal');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const startIso = periodoStart(periodo).toISOString();
      const { data: peds, error: pErr } = await supabase
        .from('pedidos')
        .select('id, valor_total, data_pedido, cliente_id, status')
        .gte('data_pedido', startIso)
        .eq('status', 'Entregue')
        .order('data_pedido', { ascending: true });
      if (pErr) { toast.error('Erro ao carregar pedidos', { description: pErr.message }); }
      const pedidosArr = (peds as any) ?? [];
      setPedidos(pedidosArr);

      if (pedidosArr.length > 0) {
        const ids = pedidosArr.map((p: any) => p.id);
        const { data: its, error: iErr } = await supabase
          .from('pedidos_itens')
          .select('pedido_id, produto_id, produto_nome, quantidade, preco_unitario')
          .in('pedido_id', ids);
        if (iErr) { toast.error('Erro ao carregar itens', { description: iErr.message }); }
        setItens((its as any) ?? []);
      } else {
        setItens([]);
      }
      setLoading(false);
    })();
  }, [periodo]);

  const totalVendas = useMemo(
    () => pedidos.reduce((s, p) => s + Number(p.valor_total || 0), 0),
    [pedidos]
  );
  const qtdPedidos = pedidos.length;
  const ticketMedio = qtdPedidos > 0 ? totalVendas / qtdPedidos : 0;

  const serieFaturamento = useMemo(() => {
    const map = new Map<string, number>();
    pedidos.forEach((p) => {
      const k = bucketLabel(periodo, new Date(p.data_pedido));
      map.set(k, (map.get(k) ?? 0) + Number(p.valor_total || 0));
    });
    return Array.from(map.entries()).map(([name, valor]) => ({ name, valor }));
  }, [pedidos, periodo]);

  const ranking = useMemo(() => {
    const map = new Map<string, { nome: string; quantidade: number; valor: number }>();
    itens.forEach((it) => {
      const nome = it.produto_nome || `Produto #${it.produto_id ?? '—'}`;
      const cur = map.get(nome) ?? { nome, quantidade: 0, valor: 0 };
      cur.quantidade += Number(it.quantidade || 0);
      cur.valor += Number(it.quantidade || 0) * Number(it.preco_unitario || 0);
      map.set(nome, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.valor - a.valor).slice(0, 5);
  }, [itens]);

  const downloadCSV = () => {
    const lines: string[] = [];
    lines.push('Relatório Aether');
    lines.push(`Período;${periodo}`);
    lines.push(`Gerado em;${new Date().toLocaleString('pt-BR')}`);
    lines.push('');
    lines.push('Indicadores');
    lines.push(`Total de vendas;${totalVendas.toFixed(2)}`);
    lines.push(`Quantidade de pedidos;${qtdPedidos}`);
    lines.push(`Ticket médio;${ticketMedio.toFixed(2)}`);
    lines.push('');
    lines.push('Faturamento por período');
    lines.push('Bucket;Valor');
    serieFaturamento.forEach((r) => lines.push(`${r.name};${r.valor.toFixed(2)}`));
    lines.push('');
    lines.push('Produtos mais vendidos');
    lines.push('Produto;Quantidade;Valor total');
    ranking.forEach((r) => lines.push(`${r.nome};${r.quantidade};${r.valor.toFixed(2)}`));
    lines.push('');
    lines.push('Pedidos do período');
    lines.push('ID;Data;Valor');
    pedidos.forEach((p) =>
      lines.push(`${p.id};${new Date(p.data_pedido).toLocaleString('pt-BR')};${Number(p.valor_total).toFixed(2)}`)
    );
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${periodo}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado!');
  };

  return (
    <MainLayout title="Relatórios">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-x-2">
          {(['semanal', 'mensal', 'anual'] as Periodo[]).map((p) => (
            <Button
              key={p}
              variant={periodo === p ? 'default' : 'outline'}
              onClick={() => setPeriodo(p)}
              className={periodo === p ? 'bg-confectionery-pink hover:bg-confectionery-pink/80' : ''}
            >
              {p === 'semanal' ? 'Semanal' : p === 'mensal' ? 'Mensal' : 'Anual'}
            </Button>
          ))}
        </div>
        <Button onClick={downloadCSV} className="bg-confectionery-pink hover:bg-confectionery-pink/80">
          <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard title="Total de Vendas" value={fmtBRL(totalVendas)} subtitle={`${qtdPedidos} pedidos entregues`} icon={<ArrowUpRight size={18} />} color="pink" />
        <StatCard title="Ticket Médio" value={fmtBRL(ticketMedio)} subtitle="Por pedido entregue" icon={<TrendingUp size={18} />} color="yellow" />
        <StatCard title="Itens Vendidos" value={String(itens.reduce((s, i) => s + Number(i.quantidade || 0), 0))} subtitle="Soma das quantidades" icon={<ShoppingBag size={18} />} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Faturamento por período" actions={<span className="text-xs bg-confectionery-yellow/30 px-2 py-1 rounded-md">{periodo}</span>}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={serieFaturamento}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
              <Legend />
              <Line type="monotone" dataKey="valor" name="Faturamento" stroke="#F9A8D4" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Produtos Mais Vendidos">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ranking} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80} dataKey="valor" nameKey="nome">
                  {ranking.map((_, idx) => <Cell key={idx} fill={CORES[idx % CORES.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="overflow-y-auto h-full">
              <Table>
                <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                <TableBody>
                  {ranking.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Sem dados.</TableCell></TableRow>}
                  {ranking.map((r) => (
                    <TableRow key={r.nome}>
                      <TableCell>{r.nome}</TableCell>
                      <TableCell className="text-right">{fmtBRL(r.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ChartCard>
      </div>

      <SimpleCard title="Detalhamento de Vendas">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Carregando...</TableCell></TableRow>}
              {!loading && ranking.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Sem vendas no período.</TableCell></TableRow>}
              {ranking.map((r) => (
                <TableRow key={r.nome}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell>{r.quantidade} unid.</TableCell>
                  <TableCell>{fmtBRL(r.valor)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SimpleCard>
    </MainLayout>
  );
};

export default RelatoriosPage;
