import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { StatusPedido } from '../../types/database'

const ETAPAS: { status: StatusPedido; label: string; icone: string }[] = [
  { status: 'recebido',          label: 'Recebido',        icone: '📥' },
  { status: 'em_preparo',        label: 'Em Preparo',      icone: '👨‍🍳' },
  { status: 'saiu_para_entrega', label: 'Saiu para Entrega', icone: '🛵' },
  { status: 'entregue',          label: 'Entregue',        icone: '✅' },
]

interface Props {
  pedidoId: string
  statusInicial: StatusPedido
}

/**
 * Stepper de acompanhamento com Supabase Realtime (WebSocket).
 * Escuta APENAS o pedido do cliente via filter id=eq.{pedidoId}.
 * RLS garante que ele só consegue ler o próprio pedido de qualquer forma.
 */
export function PedidoStepper({ pedidoId, statusInicial }: Props) {
  const [status, setStatus] = useState<StatusPedido>(statusInicial)
  const [conectado, setConectado] = useState(false)

  useEffect(() => {
    const channel = supabase
      .channel(`pedido:${pedidoId}`, { config: { broadcast: { self: false } } })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `id=eq.${pedidoId}`,
        },
        (payload) => {
          const novo = payload.new as { status: StatusPedido }
          if (novo.status) setStatus(novo.status)
        },
      )
      .subscribe((estado) => {
        setConectado(estado === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel) // cleanup: evita vazamento de sockets
    }
  }, [pedidoId])

  const cancelado = status === 'cancelado'
  const indiceAtual = ETAPAS.findIndex((e) => e.status === status)

  return (
    <section aria-live="polite" aria-label="Status do pedido" className="w-full max-w-md">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Acompanhar pedido</h1>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            conectado ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}
          role="status"
        >
          {conectado ? '● Ao vivo' : '○ Reconectando…'}
        </span>
      </header>

      {cancelado ? (
        <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-400">
          ❌ Pedido cancelado. Entre em contato com a lanchonete.
        </p>
      ) : (
        <ol className="space-y-0">
          {ETAPAS.map((etapa, i) => {
            const concluida = i < indiceAtual
            const atual = i === indiceAtual
            return (
              <li key={etapa.status} className="relative flex gap-4 pb-8 last:pb-0">
                {/* Linha conectora */}
                {i < ETAPAS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-[19px] top-10 h-full w-0.5 ${
                      concluida ? 'bg-gold' : 'bg-night-line'
                    }`}
                  />
                )}
                <span
                  aria-hidden="true"
                  className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg
                    ${concluida || atual ? 'bg-gold text-night' : 'bg-night-card text-gray-500'}`}
                >
                  {concluida ? '✓' : etapa.icone}
                </span>
                <div className="pt-2">
                  <p
                    className={`font-semibold ${
                      atual ? 'text-gold' : concluida ? 'text-white' : 'text-gray-500'
                    }`}
                    aria-current={atual ? 'step' : undefined}
                  >
                    {etapa.label}
                    {atual && <span className="ml-2 text-xs font-normal text-gray-400">(atual)</span>}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
