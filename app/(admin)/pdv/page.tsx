"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Produto {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  disponivel: boolean;
}

interface ItemVenda {
  produto: Produto;
  quantidade: number;
}

const FORMAS_PAGAMENTO = ["PIX", "Cartão", "Dinheiro"];

export default function PdvPage() {
  const supabase = createClient();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [venda, setVenda] = useState<ItemVenda[]>([]);
  const [pagamento, setPagamento] = useState(FORMAS_PAGAMENTO[0]);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    supabase
      .from("produtos")
      .select("id, nome, preco, estoque, disponivel")
      .eq("disponivel", true)
      .order("nome")
      .then(({ data }) => setProdutos(data ?? []));
  }, [supabase]);

  const total = venda.reduce((acc, i) => acc + i.produto.preco * i.quantidade, 0);

  function adicionar(produto: Produto) {
    setVenda((prev) => {
      const existente = prev.find((i) => i.produto.id === produto.id);
      if (existente) {
        return prev.map((i) =>
          i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  }

  async function confirmarVenda() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || venda.length === 0) return;

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .insert({
        user_id: user.id,
        tipo: "balcao",
        origem: "pdv",
        subtotal: total,
        taxa_entrega: 0,
        desconto: 0,
        total,
        forma_pagamento: pagamento,
        criado_por: user.id,
      })
      .select("id")
      .single();

    if (error || !pedido) return setMensagem("Erro ao criar venda.");

    const { error: erroItens } = await supabase.from("itens_pedido").insert(
      venda.map((i) => ({
        pedido_id: pedido.id,
        produto_id: i.produto.id,
        quantidade: i.quantidade,
        preco_unit: i.produto.preco,
      }))
    );

    if (erroItens) return setMensagem("Erro: verifique o estoque.");

    setVenda([]);
    setMensagem("Venda confirmada!");
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section className="lg:col-span-2" aria-labelledby="catalogo-pdv">
        <h1 id="catalogo-pdv" className="mb-4 text-xl font-bold">Produtos</h1>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {produtos.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => adicionar(p)}
                disabled={p.estoque === 0}
                className="h-full w-full rounded-lg border bg-white p-4 text-left shadow-sm hover:border-primary disabled:opacity-40"
              >
                <p className="font-medium">{p.nome}</p>
                <p className="text-primary">R$ {Number(p.preco).toFixed(2)}</p>
                <p className="text-xs text-gray-500">{p.estoque} un.</p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <aside className="rounded-lg border bg-white p-4 shadow-sm" aria-label="Resumo da venda">
        <h2 className="mb-3 text-lg font-bold">Venda atual</h2>
        <ul className="mb-4 space-y-1 text-sm">
          {venda.map((i) => (
            <li key={i.produto.id} className="flex justify-between">
              <span>{i.quantidade}x {i.produto.nome}</span>
              <span>R$ {(i.produto.preco * i.quantidade).toFixed(2)}</span>
            </li>
          ))}
        </ul>

        <label htmlFor="pagamento" className="mb-1 block text-sm font-medium">Pagamento</label>
        <select
          id="pagamento"
          value={pagamento}
          onChange={(e) => setPagamento(e.target.value)}
          className="mb-4 w-full rounded-lg border px-3 py-2"
        >
          {FORMAS_PAGAMENTO.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <p className="mb-4 text-xl font-bold">
          Total: <span className="text-primary">R$ {total.toFixed(2)}</span>
        </p>

        <button
          onClick={confirmarVenda}
          disabled={venda.length === 0}
          className="w-full rounded-lg bg-primary py-3 font-bold text-white disabled:opacity-50"
        >
          Confirmar venda
        </button>
        {mensagem && <p role="status" className="mt-2 text-sm text-gray-600">{mensagem}</p>}
      </aside>
    </div>
  );
}
