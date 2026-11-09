-- Cardápio real da Bibi Brigadeiros + categorias adaptadas ao cardápio.
-- Idempotente. Requer a função public.is_staff (migration 20261108120200).

-- 1) Categorias: passam a ser as do cardápio real ------------------------------
alter table public.categorias add column if not exists ordem integer not null default 0;

-- "Kits e Presentes" (seed anterior) vira "Presentes", mantendo o id
update public.categorias
set nome = 'Presentes'
where lower(nome) = 'kits e presentes'
  and not exists (select 1 from public.categorias where lower(nome) = 'presentes');

-- Remove as categorias do seed anterior que não existem no cardápio,
-- exceto as já usadas por algum produto (essas ficam como estão)
delete from public.categorias c
where lower(c.nome) not in ('brigadeiros', 'brownies', 'biscoitos', 'presentes')
  and not exists (select 1 from public.produtos p where p.categoria_id = c.id);

insert into public.categorias (nome)
select v.nome
from (values ('Brigadeiros'), ('Brownies'), ('Biscoitos'), ('Presentes')) as v(nome)
where not exists (select 1 from public.categorias c where lower(c.nome) = lower(v.nome));

update public.categorias c
set ordem = v.ordem
from (values ('brigadeiros', 1), ('brownies', 2), ('biscoitos', 3), ('presentes', 4)) as v(nome, ordem)
where lower(c.nome) = v.nome;

-- 2) Sabores de brigadeiro ------------------------------------------------------
create table if not exists public.sabores (
  id    bigint generated always as identity primary key,
  nome  text not null unique,
  ativo boolean not null default true,
  ordem integer not null default 0
);

-- 3) Itens do cardápio (o que o cliente vê e compra na loja) -------------------
create table if not exists public.cardapio_itens (
  id           bigint generated always as identity primary key,
  categoria_id bigint not null references public.categorias (id) on delete restrict,
  nome         text not null,
  descricao    text,
  preco        numeric(10, 2) not null check (preco >= 0),
  imagem_url   text,
  disponivel   boolean not null default true,
  destaque     boolean not null default false,
  ordem        integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (categoria_id, nome)
);

create index if not exists cardapio_itens_categoria_idx on public.cardapio_itens (categoria_id);

create or replace function public.cardapio_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cardapio_itens_updated_at on public.cardapio_itens;
create trigger cardapio_itens_updated_at
  before update on public.cardapio_itens
  for each row execute function public.cardapio_set_updated_at();

-- 4) RLS: qualquer usuário logado lê; só a equipe escreve -----------------------
alter table public.sabores enable row level security;
alter table public.cardapio_itens enable row level security;

drop policy if exists "read sabores" on public.sabores;
create policy "read sabores" on public.sabores
  for select to authenticated using (true);

drop policy if exists "staff write sabores" on public.sabores;
create policy "staff write sabores" on public.sabores
  for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

drop policy if exists "read cardapio_itens" on public.cardapio_itens;
create policy "read cardapio_itens" on public.cardapio_itens
  for select to authenticated using (true);

drop policy if exists "staff write cardapio_itens" on public.cardapio_itens;
create policy "staff write cardapio_itens" on public.cardapio_itens
  for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- 5) Dados do cardápio (imagens do cardápio da Bibi) -----------------------------
insert into public.sabores (nome, ordem)
values
  ('Brigadeiro', 1),
  ('Beijinho', 2),
  ('Churros', 3),
  ('Bicho-de-pé', 4),
  ('Leite Ninho', 5),
  ('Paçoca', 6)
on conflict (nome) do nothing;

insert into public.cardapio_itens (categoria_id, nome, descricao, preco, ordem)
select c.id, v.nome, v.descricao, v.preco, v.ordem
from (values
  ('Brigadeiros', '4 unidades tradicional', 'Brigadeiros tradicionais', 20.00, 1),
  ('Brigadeiros', '6 unidades tradicional', 'Brigadeiros tradicionais', 25.00, 2),
  ('Brigadeiros', '4 unidades sortidos',    'Brigadeiros sortidos',     22.00, 3),
  ('Brigadeiros', '25 unidades',            'Brigadeiros',             119.00, 4),
  ('Brownies',    'Brownie',                'Tradicional ou nozes',     15.00, 1),
  ('Biscoitos',   'Amanteigado de baunilha', '100 g',                   15.00, 1),
  ('Biscoitos',   'Amanteigado de limão',    '100 g',                   16.00, 2),
  ('Presentes',   'Caixa para doces',        'Embalagem para presente',  5.00, 1),
  ('Presentes',   'Caixa para biscoitos',    'Embalagem para presente',  5.00, 2),
  ('Presentes',   'Lata para biscoitos',     'Embalagem para presente',  9.00, 3),
  ('Presentes',   'Sacola P',                'Embalagem para presente',  5.00, 4),
  ('Presentes',   'Sacola M',                'Embalagem para presente',  8.00, 5)
) as v(categoria, nome, descricao, preco, ordem)
join public.categorias c on lower(c.nome) = lower(v.categoria)
on conflict (categoria_id, nome) do nothing;

-- Conferência
select c.nome as categoria, i.nome, i.preco
from public.cardapio_itens i
join public.categorias c on c.id = i.categoria_id
order by c.ordem, i.ordem;
