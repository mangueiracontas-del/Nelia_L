// ============================================================
// Edge Function: send-whatsapp
// Disparada via Database Webhook (INSERT/UPDATE em public.pedidos)
// ============================================================
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PedidoRecord {
  id: string
  status: string
  total: number
  user_id: string
}

interface DbItem {
  nome_produto: string
  quantidade: number
  preco_unitario: number
}

const STATUS_LABEL: Record<string, string> = {
  recebido: '📥 Recebido',
  em_preparo: '👨‍🍳 Em Preparo',
  saiu_para_entrega: '🛵 Saiu para Entrega',
  entregue: '✅ Entregue',
  cancelado: '❌ Cancelado',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const WHATSAPP_API_URL = Deno.env.get('WHATSAPP_API_URL') ?? '' // ex.: https://graph.facebook.com/v19.0/{phone_number_id}/messages
const WHATSAPP_API_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN') ?? ''
const APP_URL = Deno.env.get('APP_URL') ?? ''

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

async function montarMensagem(pedido: PedidoRecord): Promise<string> {
  const { data: perfil } = await supabase
    .from('perfis_usuario')
    .select('nome, telefone')
    .eq('id', pedido.user_id)
    .single()

  const { data: itens } = await supabase
    .from('itens_pedido')
    .select('nome_produto, quantidade, preco_unitario')
    .eq('pedido_id', pedido.id)

  const linhas = (itens ?? [] as DbItem[])
    .map((i) => `▪ ${i.quantidade}x ${i.nome_produto} — ${formatBRL(i.quantidade * i.preco_unitario)}`)
    .join('
')

  const nome = perfil?.nome?.split(' ')[0] || 'cliente'

  return [
    `Olá, ${nome}! 👋`,
    ``,
    `${STATUS_LABEL[pedido.status] ?? pedido.status} — Pedido #${pedido.id.slice(0, 8).toUpperCase()}`,
    ``,
    linhas,
    ``,
    `💰 Total: ${formatBRL(pedido.total)}`,
    ``,
    `Acompanhe em tempo real: ${APP_URL}/pedido/${pedido.id}`,
  ].join('
')
}

async function enviarWhatsApp(telefone: string, texto: string): Promise<Response> {
  // Normaliza para formato internacional (ex.: +5511999998888)
  const destino = telefone.replace(/\D/g, '')
  const numero = destino.startsWith('55') ? `+${destino}` : `+55${destino}`

  return fetch(WHATSAPP_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: numero,
      type: 'text',
      text: { body: texto },
    }),
  })
}
serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Método não permitido', { status: 405 })
  }

  try {
    const payload = await req.json() // body do Database Webhook
    const pedido = (payload.record ?? payload) as PedidoRecord

    if (!pedido?.id || !pedido?.user_id) {
      return Response.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const { data: perfil } = await supabase
      .from('perfis_usuario')
      .select('telefone')
      .eq('id', pedido.user_id)
      .single()

    if (!perfil?.telefone) {
      return Response.json({ skipped: 'Cliente sem telefone' }, { status: 200 })
    }

    const mensagem = await montarMensagem(pedido)
    const resp = await enviarWhatsApp(perfil.telefone, mensagem)

    if (!resp.ok) {
      const detalhe = await resp.text()
      console.error('Falha WhatsApp API:', detalhe)
      return Response.json({ error: 'Falha no envio', detalhe }, { status: 502 })
    }

    return Response.json({ ok: true, pedido_id: pedido.id }, { status: 200 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
})
