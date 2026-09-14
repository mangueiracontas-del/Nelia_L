-- ============================================================
-- 001_schema.sql - Lanchonete Premium (Supabase / PostgreSQL)
-- ============================================================
create extension if not exists "uuid-ossp";

-- ---------- PERFIS DE USUÁRIO (vinculado ao auth.users) ----------
create table public.perfis_usuario (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text,
  telefone    text,
  endereco    jsonb,               -- { rua, numero, bairro, cidade, cep, complemento }
  role        text not null default 'cliente'
              check (role in ('cliente', 'atendente', 'admin')),
  created_at  timestamptz not null default now()
);

-- Auto-criar perfil quando um usuário se registra via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
  insert into public.perfis_usuario (id, nome, telefone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'name', ''),
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$func$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- CATÁLOGO ----------
create table public.categorias (
  id      uuid primary key default gen_random_uuid(),
  nome    text not null,
  ordem   int  not null default 0,
  ativa   boolean not null default true
);

create table public.produtos (
  id            uuid primary key default gen_random_uuid(),
  categoria_id  uuid references public.categorias(id) on delete set null,
  nome          text not null,
  descricao     text,
  preco         numeric(10,2) not null check (preco >= 0),
  imagem_url    text,
  estoque_atual int not null default 0 check (estoque_atual >= 0),
  ativo         boolean not null default true,
  created_at    timestamptz not null default now()
);
create index idx_produtos_categoria on public.produtos(categoria_id);

-- ---------- CUPONS ----------
create table public.cupons (
  id          uuid primary key default gen_random_uuid(),
  codigo      text not null unique,
  tipo        text not null check (tipo in ('percentual', 'valor_fixo')),
  valor       numeric(10,2) not null check (valor > 0),
  valido_ate  date,
  ativo       boolean not null default true,
  usos_maximos int,
  usos_atual  int not null default 0
);

-- ---------- PEDIDOS ----------
create type public.status_pedido as enum
  ('recebido', 'em_preparo', 'saiu_para_entrega', 'entregue', 'cancelado');

create table public.pedidos (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id),
  status           public.status_pedido not null default 'recebido',
  subtotal         numeric(10,2) not null default 0,
  taxa_entrega     numeric(10,2) not null default 0,
  desconto         numeric(10,2) not null default 0,
  total            numeric(10,2) not null default 0,
  endereco_entrega jsonb,
  forma_pagamento  text check (forma_pagamento in ('pix', 'cartao', 'dinheiro', 'balcao')),
  origem           text not null default 'app' check (origem in ('app', 'pdv')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_pedidos_user    on public.pedidos(user_id, created_at desc);
create index idx_pedidos_status  on public.pedidos(status);
create index idx_pedidos_created on public.pedidos(created_at desc);

create table public.itens_pedido (
  id             bigint generated always as identity primary key,
  pedido_id      uuid not null references public.pedidos(id) on delete cascade,
  produto_id     uuid references public.produtos(id) on delete set null,
  nome_produto   text not null,               -- denormalizado: histórico não quebra
  quantidade     int not null check (quantidade > 0),
  preco_unitario numeric(10,2) not null check (preco_unitario >= 0),
  adicionais     jsonb                        -- [{ nome, preco }]
);
create index idx_itens_pedido_pedido  on public.itens_pedido(pedido_id);
create index idx_itens_pedido_produto on public.itens_pedido(produto_id);

-- ---------- REALTIME (supabase realtime publication) ----------
alter publication supabase_realtime add table public.pedidos;
