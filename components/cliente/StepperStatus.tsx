"use client";

import { usePedidoRealtime } from "@/hooks/usePedidoRealtime";
import { ETAPAS_STEPPER, type StatusPedido } from "@/lib/constants";

interface Props {
  pedidoId: string;
  statusInicial: StatusPedido;
}

export function StepperStatus({ pedidoId, statusInicial }: Props) {
  const { status, atualizadoEm } = usePedidoRealtime(pedidoId, statusInicial);
  const cancelado = status === "cancelado";
  const indiceAtual = ETAPAS_STEPPER.findIndex((e) => e.key === status);

  if (cancelado) {
    return (
      <div role="alert" className="rounded-lg border border-red-500 p-4 text-red-400">
        Pedido cancelado. Entre em contato com a lanchonete.
      </div>
    );
  }

  return (
    <nav aria-label="Acompanhamento do pedido">
      <ol className="flex flex-col gap-0">
        {ETAPAS_STEPPER.map((etapa, i) => {
          const concluido = i < indiceAtual;
          const atual = i === indiceAtual;
          return (
            <li key={etapa.key} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <span
                  aria-current={atual ? "step" : undefined}
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold",
                    concluido && "border-emerald-500 bg-emerald-500 text-zinc-950",
                    atual && "border-gold bg-gold text-zinc-950",
                    !concluido && !atual && "border-zinc-700 text-zinc-500",
                  ].join(" ")}
                >
                  {concluido ? "✓" : i + 1}
                </span>
                {i < ETAPAS_STEPPER.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`h-8 w-0.5 ${concluido ? "bg-emerald-500" : "bg-zinc-700"}`}
                  />
                )}
              </div>
              <p
                className={[
                  "pt-1 text-base",
                  atual ? "font-semibold text-white" : "text-zinc-400",
                ].join(" ")}
              >
                {etapa.label}
                {atual && atualizadoEm && (
                  <span className="block text-xs text-zinc-500">
                    atualizado às {new Date(atualizadoEm).toLocaleTimeString("pt-BR")}
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
