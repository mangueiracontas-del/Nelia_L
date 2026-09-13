import { createClient } from "@/lib/supabase/server";
import { startOfDay, startOfMonth } from "./utils";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const supabase = createClient();

  const hoje = startOfDay();
  const mes = startOfMonth();

  // Pedidos de hoje e do mês (service-side, como staff)
  const { data: pedidosHoje } = await supabase
    .from("pedidos")
    .select("total, status")
    .gte("created_at", hoje.toISOString());

  const { data: pedidosMes } = await supabase
    .from("pedidos")
    .select("total, status, created_at")
    .gte("created_at", mes.toISOString());

  const concluidos = (p: { status: string }[] | null) =>
    (p ?? []).filter((x) => x.status === "entregue");

  const faturamentoHoje = concluidos(pedidosHoje).reduce((a, p: any) => a + Number(p.total), 0);
  const faturamentoMes = concluidos(pedidosMes).reduce((a, p: any) => a + Number(p.total), 0);
  const ticketMedio =
    concluidos(pedidosMes).length > 0
      ? faturamentoMes / concluidos(pedidosMes).length
      : 0;

  // Top produtos do mês
  const pedidosMesIds = (pedidosMes ?? []).map((p: any) => p.id);
  const { data: itens } = pedidosMesIds.length
    ? await supabase
        .from("itens_pedido")
        .select("quantidade, produto_id, produtos(nome)")
        .in("pedido_id", pedidosMesIds)
    : { data: [] };

  const porProduto = new Map<string, { nome: string; qtd: number }>();
  (itens ?? []).forEach((i: any) => {
    const atual = porProduto.get(i.produto_id) ?? { nome: i.produtos.nome, qtd: 0 };
    porProduto.set(i.produto_id, { ...atual, qtd: atual.qtd + i.quantidade });
  });
  const top = [...porProduto.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Relatórios</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { titulo: "Faturamento hoje", valor: faturamentoHoje },
          { titulo: "Faturamento no mês", valor: faturamentoMes },
          { titulo: "Ticket médio (mês)", valor: ticketMedio },
        ].map((card) => (
          <div key={card.titulo} className="rounded-lg border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{card.titulo}</p>
            <p className="mt-1 text-2xl font-bold text-primary">
              R$ {card.valor.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border bg-white p-5 shadow-sm" aria-labelledby="top-produtos">
        <h2 id="top-produtos" className="mb-3 font-bold">Produtos mais vendidos (mês)</h2>
        <ol className="space-y-2">
          {top.map((p, i) => (
            <li key={p.id} className="flex justify-between border-b pb-2 last:border-0">
              <span>{i + 1}. {p.nome}</span>
              <span className="font-semibold">{p.qtd} un.</span>
            </li>
          ))}
          {top.length === 0 && <p className="text-gray-500">Sem vendas no período.</p>}
        </ol>
      </section>
    </div>
  );
}
