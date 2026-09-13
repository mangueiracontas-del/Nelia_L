import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WHATSAPP_API_URL = Deno.env.get("WHATSAPP_API_URL")!;
const WHATSAPP_TOKEN   = Deno.env.get("WHATSAPP_API_TOKEN")!;

const STATUS_LABEL: Record<string, string> = {
  recebido: "Recebido",
  em_preparo: "Em preparo",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

serve(async (req) => {
  try {
    const payload = await req.json();
    const pedido = payload.record;
    const eventType = payload.type;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: itens } = await supabase
      .from("itens_pedido")
      .select("quantidade, preco_unit, produtos(nome)")
      .eq("pedido_id", pedido.id);

    const linhas = (itens ?? [])
      .map((i: any) => `▪ ${i.quantidade}x ${i.produtos.nome} — R$ ${(i.preco_unit * i.quantidade).toFixed(2)}`)
      .join("\n");

    const msg =
      eventType === "INSERT"
        ? `🍔 *Pedido confirmado!*\n\n${linhas}\n\n💰 *Total: R$ ${Number(pedido.total).toFixed(2)}*\n\n` +
          `Acompanhe em tempo real:\n${Deno.env.get("APP_URL")}/pedido/${pedido.id}`
        : `🛵 *Atualização do pedido*\n\nStatus: *${STATUS_LABEL[pedido.status] ?? pedido.status}*\n` +
          `Acompanhe: ${Deno.env.get("APP_URL")}/pedido/${pedido.id}`;

    const resp = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: pedido.telefone, text: msg }),
    });

    if (!resp.ok) {
      throw new Error(`WhatsApp API retornou ${resp.status}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
