create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role    text not null check (role in ('atendente', 'admin'))
);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
     where user_id = auth.uid()
       and role in ('atendente', 'admin')
  );
$$;

-- Categorias & Produtos: leitura pública
alter table public.categorias enable row level security;
alter table public.produtos   enable row level security;

create policy "leitura publica categorias"
  on public.categorias for select using (true);

create policy "leitura publica produtos"
  on public.produtos for select using (true);

create policy "staff gerencia produtos"
  on public.produtos for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "staff gerencia categorias"
  on public.categorias for all
  using (public.is_staff())
  with check (public.is_staff());

-- Cupons
alter table public.cupons enable row level security;

create policy "leitura publica cupons validos"
  on public.cupons for select
  using (ativo = true and (valido_ate is null or valido_ate > now()));

create policy "staff gerencia cupons"
  on public.cupons for all
  using (public.is_staff())
  with check (public.is_staff());

-- Pedidos
alter table public.pedidos enable row level security;

create policy "cliente cria proprio pedido"
  on public.pedidos for insert
  with check (
    auth.uid() = user_id
    and origem = 'app'
    and status = 'recebido'
  );

create policy "staff cria pedido balcao"
  on public.pedidos for insert
  with check (public.is_staff() and origem = 'pdv');

create policy "cliente le proprios pedidos"
  on public.pedidos for select
  using (auth.uid() = user_id);

create policy "staff le todos pedidos"
  on public.pedidos for select
  using (public.is_staff());

create policy "staff atualiza status"
  on public.pedidos for update
  using (public.is_staff())
  with check (public.is_staff());

-- Itens do pedido
alter table public.itens_pedido enable row level security;

create policy "cliente insere itens do proprio pedido"
  on public.itens_pedido for insert
  with check (
    exists (
      select 1 from public.pedidos p
       where p.id = pedido_id
         and p.user_id = auth.uid()
         and p.status = 'recebido'
    )
  );

create policy "staff insere itens"
  on public.itens_pedido for insert
  with check (public.is_staff());

create policy "cliente le itens dos proprios pedidos"
  on public.itens_pedido for select
  using (
    exists (
      select 1 from public.pedidos p
       where p.id = pedido_id and p.user_id = auth.uid()
    )
  );

create policy "staff le todos itens"
  on public.itens_pedido for select
  using (public.is_staff());

-- Roles
alter table public.user_roles enable row level security;

create policy "le propria role"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "admin gerencia roles"
  on public.user_roles for all
  using (
    exists (select 1 from public.user_roles
             where user_id = auth.uid() and role = 'admin')
  );
