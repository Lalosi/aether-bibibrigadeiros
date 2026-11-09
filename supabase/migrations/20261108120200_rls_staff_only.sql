-- Fecha o acesso às tabelas internas para quem NÃO é da equipe (ex.: role 'cliente').
-- Antes: política "auth all ..." com using (true) => qualquer usuário logado lia/escrevia tudo.
-- Rode DEPOIS de 20261108120100_add_role_cliente.sql (já concluída).

-- 1) Helper: é da equipe? (funcionario, admin ou master)
create or replace function public.is_staff(_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _uid
      and role in ('funcionario', 'admin', 'master')
  );
$$;

revoke all on function public.is_staff(uuid) from public, anon;
grant execute on function public.is_staff(uuid) to authenticated;

-- 2) Tabelas internas: somente equipe (leitura e escrita)
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('clientes',              'auth all clientes'),
      ('despesas',              'auth all despesas'),
      ('fichas_tecnicas',       'auth all fichas'),
      ('fornecedores',          'auth all fornecedores'),
      ('materias_primas',       'auth all materias_primas'),
      ('movimentacoes_estoque', 'auth all movimentacoes'),
      ('pedidos',               'auth all pedidos'),
      ('pedidos_itens',         'auth all pedidos_itens')
    ) as t(tbl, pol)
  loop
    execute format('drop policy if exists %I on public.%I', r.pol, r.tbl);
    execute format('drop policy if exists %I on public.%I', 'staff all ' || r.tbl, r.tbl);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (public.is_staff(auth.uid()))
         with check (public.is_staff(auth.uid()))',
      'staff all ' || r.tbl, r.tbl);
  end loop;
end
$$;

-- 3) Catálogo (produtos e categorias): todo usuário logado LÊ (a loja vai precisar),
--    mas só a equipe ESCREVE.
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('produtos',   'auth all produtos'),
      ('categorias', 'auth all categorias')
    ) as t(tbl, pol)
  loop
    execute format('drop policy if exists %I on public.%I', r.pol, r.tbl);
    execute format('drop policy if exists %I on public.%I', 'read ' || r.tbl, r.tbl);
    execute format('drop policy if exists %I on public.%I', 'staff write ' || r.tbl, r.tbl);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      'read ' || r.tbl, r.tbl);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (public.is_staff(auth.uid()))
         with check (public.is_staff(auth.uid()))',
      'staff write ' || r.tbl, r.tbl);
  end loop;
end
$$;

-- 4) Conferência
select tablename, policyname, cmd, qual, with_check
from pg_policies where schemaname = 'public' order by tablename, policyname;
