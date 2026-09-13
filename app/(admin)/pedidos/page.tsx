"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { STATUS_PEDIDO, type StatusPedido } from "@/lib/constants";

interface Pedido {
  id: string;
  status: StatusPedido;
  total: number;
  origem: string;
  created_at: string;
}

export default function PedidosPage() {
  const supabase = createClient();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    supabase
      .from("pedidos")
      .select("id, status, total, origem, created_at")
      .neq("status", "entregue")
      .order("created_at", { ascending: false })
      .then(({ data }) => setPedidos(data ?? []));

    // Atualiza a fila em tempo real quando o status muda
    const channel = supabase
      .channel("fila-pedidos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        () => {
          supabase
            .from("pedidos")
            .select("id, status, total, origem, created_at")
            .neq("status", "entregue")
            .order("created_at", { ascending: false })
            .then(({ data }) => setPedidos(data ?? []));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function avancarStatus(pedido: Pedido) {
    const ordem: StatusPedido[] = ["recebido", "em_preparo", "saiu_para_entrega", "entregue"];
    const proximo = ordem[ordem.indexOf(pedido.status) + 1];
    if (!proximo) return;

    await supabase.from("pedidos").update({ status: proximo }).eq("id", pedido.id);
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Fila de pedidos</h1>
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {pedidos.map((p) => (
          <li key={p.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-sm">#{p.id.slice(0, 8)}</span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs uppercase">
                {p.origem}
              </span>
            </div>
            <p className="mb-1 text-lg font-bold text-primary">R$ {Number(p.total).toFixed(2)}</p>
            <p className="mb-3 text-sm text-gray-600">{STATUS_PEDIDO[p.status]}</p>
            {p.status !== "entregue" && (
              <button
                onClick={() => avancarStatus(p)}
                className="w-full rounded-lg bg-gold py-2 font-semibold text-gray-900"
              >
                Avançar status
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
