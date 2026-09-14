-- ============================================================
-- 002_trigger_estoque.sql - Baixa automática por unidade
-- ============================================================
create or replace function public.baixar_estoque_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
  if new.produto_id is not null then
    update public.produtos
       set estoque_atual = greatest(estoque_atual - new.quantidade, 0)
     where id = new.produto_id;

    if not found then
      raise warning 'Produto % não encontrado para baixa de estoque.', new.produto_id;
    end if;
  end if;
  return new;
end;
$func$;

drop trigger if exists trg_baixa_estoque on public.itens_pedido;
create trigger trg_baixa_estoque
  after insert on public.itens_pedido
  for each row
  execute function public.baixar_estoque_item();

-- Atualiza updated_at do pedido automaticamente
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $func$
begin
  new.updated_at = now();
  return new;
end;
$func$;

drop trigger if exists trg_pedidos_touch on public.pedidos;
create trigger trg_pedidos_touch
  before update on public.pedidos
  for each row execute function public.touch_updated_at();
