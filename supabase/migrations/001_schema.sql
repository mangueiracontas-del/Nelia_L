create extension if not exists "uuid-ossp";

create type status_pedido as enum (
  'recebido', 'em_preparo', 'saiu_para_entrega', 'entregue', 'cancelado'
);

create table public.categorias (
  id          uuid primary key default uuid_generate_v4(),
  nome        text not null,
  ordem       int  not null default 0,
  ativa       boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.produtos (
  id          uuid primary key default uuid_generate_v4(),
  categoria_id uuid not null references public.categorias(id) on delete restrict,
  nome        text not null,
  descricao   text,
  preco       numeric(10,2) not null check (preco >= 0),
  imagem_url  text,
  estoque     int not null default 0 check (estoque >= 0),
  disponivel  boolean not null default true,
  created_at  timestamptz not null default now()
);
create index idx_produtos_categoria on public.produtos(categoria_id);

create table public.cupons (
  id          uuid primary key default uuid_generate_v4(),
  codigo      text not null unique,
  tipo        text not null check (tipo in ('percentual', 'fixo')),
  valor       numeric(10,2) not null check (valor > 0),
  ativo       boolean not null default true,
  valido_ate  timestamptz,
  usos_max    int,
  usos_atual  int not null default 0
);

create table public.pedidos (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  status         status_pedido not null default 'recebido',
  tipo           text not null default 'entrega' check (tipo in ('entrega', 'balcao')),
  subtotal       numeric(10,2) not null check (subtotal >= 0),
  taxa_entrega   numeric(10,2) not null default 0,
  desconto       numeric(10,2) not null default 0,
  total          numeric(10,2) not null check (total >= 0),
  cupom_id       uuid references public.cupons(id) on delete set null,
  endereco       jsonb,
  forma_pagamento text,
  telefone       text,
  origem         text not null default 'app' check (origem in ('app', 'pdv')),
  criado_por     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_pedidos_user   on public.pedidos(user_id, created_at desc);
create index idx_pedidos_status on public.pedidos(status, created_at desc);

create table public.itens_pedido (
  id         uuid primary key default uuid_generate_v4(),
  pedido_id  uuid not null references public.pedidos(id) on delete cascade,
  produto_id uuid not null references public.produtos(id) on delete restrict,
  quantidade int  not null check (quantidade > 0),
  preco_unit numeric(10,2) not null,
  adicionais jsonb not null default '[]'::jsonb,
  unique (pedido_id, produto_id)
);
create index idx_itens_pedido_pedido   on public.itens_pedido(pedido_id);
create index idx_itens_pedido_produto  on public.itens_pedido(produto_id);

alter publication supabase_realtime add table public.pedidos;
alter publication supabase_realtime add table public.itens_pedido;
