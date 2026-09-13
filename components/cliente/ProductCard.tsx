"use client";

import { useState } from "react";

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem_url: string | null;
}

export function ProductCard({ produto }: { produto: Produto }) {
  const [adicionado, setAdicionado] = useState(false);

  function adicionar() {
    const raw = localStorage.getItem("carrinho");
    const carrinho: any[] = raw ? JSON.parse(raw) : [];
    const existente = carrinho.find((i) => i.produto_id === produto.id);

    if (existente) existente.quantidade += 1;
    else carrinho.push({
      produto_id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      quantidade: 1,
    });

    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 1500);
  }

  return (
    <article className="flex items-center gap-4 rounded-lg bg-ink-card p-4">
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold">{produto.nome}</h3>
        {produto.descricao && (
          <p className="truncate text-sm text-zinc-400">{produto.descricao}</p>
        )}
        <p className="mt-1 font-bold text-gold">R$ {Number(produto.preco).toFixed(2)}</p>
      </div>
      <button
        onClick={adicionar}
        aria-label={`Adicionar ${produto.nome} ao carrinho`}
        className={`rounded-lg px-4 py-2 font-semibold transition-colors ${
          adicionado ? "bg-emerald-500 text-zinc-950" : "bg-primary text-white"
        }`}
      >
        {adicionado ? "✓ Adicionado" : "Adicionar"}
      </button>
    </article>
  );
}
