-- Quem se cadastra passa a ser 'cliente' (antes: 'funcionario').
-- Em vez de reescrever handle_new_user, adiciona um gatilho que roda DEPOIS dele
-- (gatilhos do mesmo evento disparam em ordem alfabética de nome; "zz_" vem depois de "on_").
-- A edge function create-user continua funcionando: ela define a role escolhida
-- depois que o usuário é criado.

create or replace function public.set_default_role_cliente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_roles set role = 'cliente' where user_id = new.id;
  if not found then
    insert into public.user_roles (user_id, role) values (new.id, 'cliente');
  end if;
  return new;
end;
$$;

revoke all on function public.set_default_role_cliente() from public, anon, authenticated;

drop trigger if exists zz_default_role_cliente on auth.users;
create trigger zz_default_role_cliente
  after insert on auth.users
  for each row execute function public.set_default_role_cliente();

-- Conferência: contas existentes e suas roles (revise quem se cadastrou pelo /signup
-- e ficou como funcionario por causa do comportamento antigo).
select u.email, u.created_at, r.role
from auth.users u
left join public.user_roles r on r.user_id = u.id
order by u.created_at desc;
