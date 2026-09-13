"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface ItemCarrinho {
  produto_id: string;
  nome: string;
  preco: number;
  quantidade: number;
}

const TAXA_ENTREGA = 5.0;

export default function CarrinhoPage() {
  const router = useRouter();
  const supabase = createClient();
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [cupomInput, setCupomInput] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("carrinho");
    if (raw) setItens(JSON.parse(raw));
  }, []);

  const subtotal = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
  const total = Math.max(0, subtotal + TAXA_ENTREGA - desconto);

  async function aplicarCupom() {
    const { data: cupom } = await supabase
      .from("cupons")
      .select("*")
      .eq("codigo", cupomInput.trim().toUpperCase())
      .single();

    if (!cupom) return setMensagem("Cupom inválido.");
    if (cupom.valido_ate && new Date(cupom.valido_ate) < new Date())
      return setMensagem("Cupom expirado.");
    if (cupom.usos_max != null && cupom.usos_atual >= cupom.usos_max)
      return setMensagem("Cupom esgotado.");

    const valor =
      cupom.tipo === "percentual" ? (subtotal * cupom.valor) / 100 : cupom.valor;
    setDesconto(Math.min(valor, subtotal));
    setMensagem("Cupom aplicado!");
  }

  async function finalizarPedido() {
    setCarregando(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMensagem("Faça login para finalizar o pedido.");
      setCarregando(false);
      return;
    }

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .insert({
        user_id: user.id,
        subtotal,
        taxa_entrega: TAXA_ENTREGA,
        desconto,
        total,
      })
      .select("id")
      .single();

    if (error || !pedido) {
      setMensagem("Erro ao criar pedido. Tente novamente.");
      setCarregando(false);
      return;
    }

    const { error: erroItens } = await supabase.from("itens_pedido").insert(
      itens.map((i) => ({
        pedido_id: pedido.id,
        produto_id: i.produto_id,
        quantidade: i.quantidade,
        preco_unit: i.preco,
      }))
    );

    if (erroItens) {
      setMensagem("Erro ao registrar itens.");
      setCarregando(false);
      return;
    }

    localStorage.removeItem("carrinho");
    router.push(`/pedido/${pedido.id}`);
  }

  if (itens.length === 0) {
    return <p className="py-16 text-center text-zinc-400">Seu carrinho está vazio.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Seu pedido</h1>

      <ul className="space-y-2">
        {itens.map((i) => (
          <li
            key={i.produto_id}
            className="flex justify-between rounded-lg bg-ink-card p-3"
          >
            <span>{i.quantidade}x {i.nome}</span>
            <span className="text-gold">R$ {(i.preco * i.quantidade).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <label htmlFor="cupom" className="sr-only">Cupom de desconto</label>
        <input
          id="cupom"
          value={cupomInput}
          onChange={(e) => setCupomInput(e.target.value)}
          placeholder="Cupom de desconto"
          className="flex-1 rounded-lg border border-zinc-700 bg-ink-soft px-3 py-2"
        />
        <button
          onClick={aplicarCupom}
          className="rounded-lg bg-ink-card px-4 py-2 font-medium text-gold"
        >
          Aplicar
        </button>
      </div>

      <dl className="space-y-1 text-sm text-zinc-400">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>R$ {subtotal.toFixed(2)}</dd></div>
        <div className="flex justify-between"><dt>Taxa de entrega</dt><dd>R$ {TAXA_ENTREGA.toFixed(2)}</dd></div>
        {desconto > 0 && (
          <div className="flex justify-between text-emerald-400">
            <dt>Desconto</dt><dd>- R$ {desconto.toFixed(2)}</dd>
          </div>
        )}
        <div className="flex justify-between pt-2 text-lg font-bold text-white">
          <dt>Total</dt><dd className="text-gold">R$ {total.toFixed(2)}</dd>
        </div>
      </dl>

      {mensagem && <p role="status" className="text-sm text-gold">{mensagem}</p>}

      <button
        onClick={finalizarPedido}
        disabled={carregando}
        className="w-full rounded-lg bg-primary py-4 text-lg font-bold text-white disabled:opacity-60"
      >
        {carregando ? "Processando..." : "Finalizar pedido"}
      </button>
    </div>
  );
}
