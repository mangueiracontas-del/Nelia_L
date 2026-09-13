"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { StatusPedido } from "@/lib/constants";

export function usePedidoRealtime(pedidoId: string, statusInicial: StatusPedido) {
  const [status, setStatus] = useState<StatusPedido>(statusInicial);
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel: RealtimeChannel = supabase
      .channel(`pedido:${pedidoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
          filter: `id=eq.${pedidoId}`,
        },
        (payload) => {
          setStatus((payload.new as any).status);
          setAtualizadoEm((payload.new as any).updated_at);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pedidoId]);

  return { status, atualizadoEm };
}
