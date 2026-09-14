-- ============================================================
-- 003_rls.sql - Row Level Security (Zero-Trust no client)
-- ============================================================

-- Helper: usuário é staff? (security definer = não depende de RLS)
create or replace function public.eh_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
  select exists (
    select 1 from public.perfis_usuario
    where id = auth.uid() and role in ('atendente', 'admin')
  );
$func$;

-- ---------- PERFIS ----------
alter table public.perfis_usuario enable row level security;

create policy "usuario le proprio perfil"
  on public.perfis_usuario for select to authenticated
  using (id = auth.uid() or public.eh_staff());

create policy "usuario edita proprio perfil"
  on public.perfis_usuario for update to authenticated
  using (id = auth.uid() and not public.eh_staff())
  with check (id = auth.uid() and role = 'cliente');  -- nunca auto-promover role

create policy "staff gerencia perfis"
  on public.perfis_usuario for all to authenticated
  using (public.eh_staff()) with check (public.eh_staff());

-- ---------- PRODUTOS / CATEGORIAS (leitura pública) ----------
alter table public.produtos  enable row level security;
alter table public.categorias enable row level security;

create policy "leitura publica produtos"
  on public.produtos for select to anon, authenticated
  using (true);

create policy "leitura publica categorias"
  on public.categorias for select to anon, authenticated
  using (true);

create policy "staff gerencia produtos"
  on public.produtos for all to authenticated
  using (public.eh_staff()) with check (public.eh_staff());

create policy "staff gerencia categorias"
  on public.categorias for all to authenticated
  using (public.eh_staff()) with check (public.eh_staff());

-- ---------- CUPONS (leitura pública apenas dos válidos) ----------
alter table public.cupons enable row level security;

create policy "cupons validos sao publicos"
  on public.cupons for select to anon, authenticated
  using (
    ativo = true
    and (valido_ate is null or valido_ate >= current_date)
    and (usos_maximos is null or usos_atual < usos_maximos)
  );

create policy "staff gerencia cupons"
  on public.cupons for all to authenticated
  using (public.eh_staff()) with check (public.eh_staff());

-- ---------- PEDIDOS ----------
alter table public.pedidos enable row level security;

create policy "cliente cria proprio pedido"
  on public.pedidos for insert to authenticated
  with check (user_id = auth.uid() and origem = 'app');

create policy "cliente le proprios pedidos / staff le todos"
  on public.pedidos for select to authenticated
  using (user_id = auth.uid() or public.eh_staff());

create policy "staff atualiza status"
  on public.pedidos for update to authenticated
  using (public.eh_staff()) with check (public.eh_staff());

-- ---------- ITENS DO PEDIDO ----------
alter table public.itens_pedido enable row level security;

create policy "insere itens no proprio pedido"
  on public.itens_pedido for insert to authenticated
  with check (
    public.eh_staff()
    or exists (
      select 1 from public.pedidos p
      where p.id = pedido_id and p.user_id = auth.uid()
    )
  );

create policy "le itens do proprio pedido / staff"
  on public.itens_pedido for select to authenticated
  using (
    public.eh_staff()
    or exists (
      select 1 from public.pedidos p
      where p.id = pedido_id and p.user_id = auth.uid()
    )
  );

-- ---------- NOTA ----------
-- Atualização de usos_atual do cupom e relatórios agregados ficam
-- por conta das Edge Functions (service_role) ou RPCs security definer,
-- nunca via client direto.
