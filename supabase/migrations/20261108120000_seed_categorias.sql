-- Popula a tabela de domínio public.categorias (usada no filtro/select de categoria
-- do cadastro de produtos). Idempotente: pode ser executada mais de uma vez.
-- Assume colunas: id (gerada automaticamente) e nome (text).

insert into public.categorias (nome)
select v.nome
from (values
  ('Brigadeiros'),
  ('Bolos'),
  ('Tortas'),
  ('Cupcakes'),
  ('Doces'),
  ('Bebidas'),
  ('Kits e Presentes')
) as v(nome)
where not exists (
  select 1 from public.categorias c where lower(c.nome) = lower(v.nome)
);

-- Conferência
select id, nome from public.categorias order by nome;
