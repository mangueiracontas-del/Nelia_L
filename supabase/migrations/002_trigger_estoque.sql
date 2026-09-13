create or replace function public.baixar_estoque_produto()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.produtos
     set estoque = estoque - NEW.quantidade
   where id = NEW.produto_id
     and estoque >= NEW.quantidade;

  if not found then
    raise exception 'Estoque insuficiente para o produto %.', NEW.produto_id
      using errcode = 'P0001';
  end if;

  update public.produtos
     set disponivel = false
   where id = NEW.produto_id
     and estoque = 0;

  return NEW;
end;
$$;

create trigger trg_baixa_estoque
after insert on public.itens_pedido
for each row
execute function public.baixar_estoque_produto();
