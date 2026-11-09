-- Adiciona a role 'cliente' ao enum public.app_role (usado em user_roles.role).
-- Rode sozinho; só use o valor 'cliente' em comandos posteriores.
alter type public.app_role add value if not exists 'cliente';
