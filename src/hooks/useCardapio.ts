import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatBRL } from '@/lib/utils';

export interface CardapioCategoria {
  id: string;
  nome: string;
}

/** Item do cardápio no formato usado pela loja (/comprar). */
export interface CardapioItem {
  id: number;
  nome: string;
  descricao: string;
  preco: string;
  precoUnitario: number;
  imagem: string;
  disponivel: boolean;
  /** id da categoria, como string (casa com CardapioCategoria.id) */
  categoria: string;
  destaque: boolean;
}

interface CardapioRow {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number | string;
  imagem_url: string | null;
  disponivel: boolean;
  destaque: boolean;
  ordem: number;
  categoria_id: number;
  categorias: { id: number; nome: string; ordem: number } | null;
}

const PLACEHOLDER_IMAGE = '/placeholder.svg';

async function fetchCardapio() {
  const [itensRes, saboresRes] = await Promise.all([
    supabase
      .from('cardapio_itens')
      .select('id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, categoria_id, categorias(id, nome, ordem)'),
    supabase.from('sabores').select('nome, ordem').eq('ativo', true).order('ordem'),
  ]);

  if (itensRes.error) throw itensRes.error;
  if (saboresRes.error) throw saboresRes.error;

  const rows = (itensRes.data ?? []) as unknown as CardapioRow[];

  // Seções na ordem do cardápio; só aparecem categorias que têm itens
  const categoriasMap = new Map<string, { nome: string; ordem: number }>();
  rows.forEach((r) => {
    if (r.categorias) {
      categoriasMap.set(String(r.categorias.id), { nome: r.categorias.nome, ordem: r.categorias.ordem });
    }
  });
  const categorias: CardapioCategoria[] = Array.from(categoriasMap.entries())
    .sort((a, b) => a[1].ordem - b[1].ordem || a[1].nome.localeCompare(b[1].nome))
    .map(([id, c]) => ({ id, nome: c.nome }));

  const posicaoCategoria = new Map(categorias.map((c, i) => [c.id, i]));
  const itens: CardapioItem[] = [...rows]
    .sort(
      (a, b) =>
        (posicaoCategoria.get(String(a.categoria_id)) ?? 0) - (posicaoCategoria.get(String(b.categoria_id)) ?? 0) ||
        a.ordem - b.ordem ||
        a.nome.localeCompare(b.nome),
    )
    .map((r) => {
      const preco = Number(r.preco);
      return {
        id: r.id,
        nome: r.nome,
        descricao: r.descricao ?? '',
        preco: formatBRL(preco),
        precoUnitario: preco,
        imagem: r.imagem_url || PLACEHOLDER_IMAGE,
        disponivel: r.disponivel,
        categoria: String(r.categoria_id),
        destaque: r.destaque,
      };
    });

  const sabores = ((saboresRes.data ?? []) as { nome: string }[]).map((s) => s.nome);

  return { categorias, itens, sabores };
}

/** Lê o cardápio (itens, categorias e sabores) do Supabase. */
export function useCardapio() {
  const query = useQuery({ queryKey: ['cardapio'], queryFn: fetchCardapio });
  return {
    categorias: query.data?.categorias ?? [],
    itens: query.data?.itens ?? [],
    sabores: query.data?.sabores ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
