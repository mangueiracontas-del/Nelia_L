import { createClient } from "@/lib/supabase/server";
import { StepperStatus } from "@/components/cliente/StepperStatus";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PedidoPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, status, total, created_at")
    .eq("id", params.id)
    .single();

  if (!pedido || !user) notFound();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Pedido #{pedido.id.slice(0, 8)}</h1>
        <p className="text-zinc-400">
          Total: <span className="text-gold">R$ {Number(pedido.total).toFixed(2)}</span>
        </p>
      </header>
      <StepperStatus pedidoId={pedido.id} statusInicial={pedido.status} />
    </div>
  );
}
