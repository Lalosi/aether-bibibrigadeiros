-- Loja: checkout grava pedido, liga cardápio a produtos (estoque) e preenche imagens.
-- Requer: is_staff (RLS), tabelas cardapio_itens/sabores, pedidos, pedidos_itens, produtos, clientes, profiles.

-- 1) Liga cardapio_itens -> produtos (estoque). Nulo = item sem controle de estoque (ex.: presentes).
alter table public.cardapio_itens
  add column if not exists produto_id bigint references public.produtos (id) on delete set null;

-- 2) pedidos_itens.produto_id passa a aceitar nulo (item de loja sem produto vinculado)
alter table public.pedidos_itens alter column produto_id drop not null;

-- 3) Checkout da loja (SECURITY DEFINER): o cliente não escreve direto nas tabelas
--    (bloqueadas por RLS). Tudo passa por aqui, com preço e estoque validados no servidor.
--    p_itens: jsonb no formato [{"cardapio_item_id": 1, "quantidade": 2}, ...]
create or replace function public.criar_pedido_loja(
  p_itens jsonb,
  p_metodo text default 'A combinar',
  p_observacoes text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_nome text;
  v_cliente_id bigint;
  v_pedido_id bigint;
  v_total numeric(10,2) := 0;
  r record;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;
  if p_itens is null or jsonb_array_length(p_itens) = 0 then
    raise exception 'Nenhum item no pedido';
  end if;

  v_email := coalesce(auth.jwt() ->> 'email', (select email from auth.users where id = v_uid));
  select nome into v_nome from public.profiles where id = v_uid;
  v_nome := coalesce(nullif(trim(v_nome), ''), v_email, 'Cliente');

  -- acha ou cria o cliente pelo e-mail
  if v_email is not null then
    select id into v_cliente_id from public.clientes
      where lower(email) = lower(v_email) order by id limit 1;
  end if;
  if v_cliente_id is null then
    insert into public.clientes (nome, email, tipo, tipo_pessoa, status)
      values (v_nome, v_email, 'Pessoa Física', 'Pessoa Física', 'Ativo')
      returning id into v_cliente_id;
  end if;

  -- valida itens (preço e disponibilidade vêm do cardápio no servidor) e soma o total
  for r in
    select t.cardapio_item_id, t.quantidade, c.nome, c.preco, c.disponivel
    from (
      select (e->>'cardapio_item_id')::bigint as cardapio_item_id,
             sum((e->>'quantidade')::int) as quantidade
      from jsonb_array_elements(p_itens) e
      group by 1
    ) t
    left join public.cardapio_itens c on c.id = t.cardapio_item_id
  loop
    if r.nome is null then
      raise exception 'Item de cardápio % não encontrado', r.cardapio_item_id;
    end if;
    if not r.disponivel then
      raise exception 'Item indisponível: %', r.nome;
    end if;
    if r.quantidade is null or r.quantidade <= 0 then
      raise exception 'Quantidade inválida para %', r.nome;
    end if;
    v_total := v_total + r.preco * r.quantidade;
  end loop;

  -- valida estoque dos itens ligados a um produto
  for r in
    select p.nome, p.qtd_estoque, s.qtd
    from (
      select c.produto_id, sum(t.quantidade) as qtd
      from (
        select (e->>'cardapio_item_id')::bigint as cardapio_item_id,
               sum((e->>'quantidade')::int) as quantidade
        from jsonb_array_elements(p_itens) e
        group by 1
      ) t
      join public.cardapio_itens c on c.id = t.cardapio_item_id
      where c.produto_id is not null
      group by c.produto_id
    ) s
    join public.produtos p on p.id = s.produto_id
  loop
    if r.qtd_estoque < r.qtd then
      raise exception 'Estoque insuficiente: % (necessário %, disponível %)', r.nome, r.qtd, r.qtd_estoque;
    end if;
  end loop;

  -- cria o pedido (baixa imediata => estoque_baixado = true)
  insert into public.pedidos
    (cliente_id, valor_total, metodo_pagamento, status, observacoes, data_pedido, estoque_baixado)
    values (v_cliente_id, round(v_total, 2), coalesce(p_metodo, 'A combinar'),
            'Aguardando Pagamento', p_observacoes, now(), true)
    returning id into v_pedido_id;

  -- itens do pedido (produto_id pode ser nulo p/ presentes)
  insert into public.pedidos_itens (pedido_id, produto_id, produto_nome, quantidade, preco_unitario)
  select v_pedido_id, c.produto_id, c.nome, t.quantidade, c.preco
  from (
    select (e->>'cardapio_item_id')::bigint as cardapio_item_id,
           sum((e->>'quantidade')::int) as quantidade
    from jsonb_array_elements(p_itens) e
    group by 1
  ) t
  join public.cardapio_itens c on c.id = t.cardapio_item_id;

  -- baixa de estoque dos itens ligados
  update public.produtos p
  set qtd_estoque = p.qtd_estoque - s.qtd
  from (
    select c.produto_id, sum(t.quantidade) as qtd
    from (
      select (e->>'cardapio_item_id')::bigint as cardapio_item_id,
             sum((e->>'quantidade')::int) as quantidade
      from jsonb_array_elements(p_itens) e
      group by 1
    ) t
    join public.cardapio_itens c on c.id = t.cardapio_item_id
    where c.produto_id is not null
    group by c.produto_id
  ) s
  where p.id = s.produto_id;

  return v_pedido_id;
end;
$$;

revoke all on function public.criar_pedido_loja(jsonb, text, text) from public, anon;
grant execute on function public.criar_pedido_loja(jsonb, text, text) to authenticated;

-- 4) Imagens dos itens (fotos de internet por tipo; não sobrescreve se já houver imagem).
--    Troque por fotos reais da Bibi quando tiver — basta um UPDATE de imagem_url.
update public.cardapio_itens c set imagem_url = v.url
from (values
  ('4 unidades tradicional',  'https://loremflickr.com/600/400/brigadeiro,chocolate?lock=11'),
  ('6 unidades tradicional',  'https://loremflickr.com/600/400/brigadeiro,chocolate?lock=12'),
  ('4 unidades sortidos',     'https://loremflickr.com/600/400/brigadeiro,candy?lock=13'),
  ('25 unidades',             'https://loremflickr.com/600/400/brigadeiro,chocolate?lock=14'),
  ('Brownie',                 'https://loremflickr.com/600/400/brownie,chocolate?lock=21'),
  ('Amanteigado de baunilha', 'https://loremflickr.com/600/400/butter,cookies?lock=31'),
  ('Amanteigado de limão',    'https://loremflickr.com/600/400/lemon,cookies?lock=32'),
  ('Caixa para doces',        'https://loremflickr.com/600/400/gift,box?lock=41'),
  ('Caixa para biscoitos',    'https://loremflickr.com/600/400/gift,box?lock=42'),
  ('Lata para biscoitos',     'https://loremflickr.com/600/400/tin,box?lock=43'),
  ('Sacola P',                'https://loremflickr.com/600/400/paper,bag?lock=44'),
  ('Sacola M',                'https://loremflickr.com/600/400/paper,bag?lock=45')
) as v(nome, url)
where c.nome = v.nome and (c.imagem_url is null or c.imagem_url = '');

-- Conferência
select nome, produto_id, imagem_url from public.cardapio_itens order by nome;
