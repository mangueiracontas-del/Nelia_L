import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { PedidoStepper } from '../components/tracking/PedidoStepper'
import type { Pedido, StatusPedido } from '../types/database'

export function AcompanharPedido() {
  const { id } = useParams<{ id: string }>()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    supabase
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) setErro('Pedido não encontrado ou sem permissão.')
        else setPedido(data as Pedido)
      })
  }, [id])

  if (erro) return <main className="p-6 text-red-400">{erro}</main>
  if (!pedido) return <main className="p-6 text-gray-400">Carregando…</main>

  return (
    <main className="min-h-screen bg-night p-6 flex justify-center">
      <PedidoStepper pedidoId={pedido.id} statusInicial={pedido.status as StatusPedido} />
    </main>
  )
}
