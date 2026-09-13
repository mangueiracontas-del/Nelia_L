import { createClient } from "@/lib/supabase/server";
import { STATUS_PEDIDO } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <p className="py-16 text-center">Faça login para ver seu perfil.</p>;

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("id, status, total, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meus pedidos</h1>
      {pedidos?.length === 0 && <p className="text-zinc-400">Nenhum pedido ainda.</p>}
      <ul className="space-y-2">
        {pedidos?.map((p) => (
          <li key={p.id} className="rounded-lg bg-ink-card p-4">
            <a href={`/pedido/${p.id}`} className="block">
              <div className="flex justify-between">
                <span className="font-medium">
                  {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </span>
                <span className="text-gold">R$ {Number(p.total).toFixed(2)}</span>
              </div>
              <p className="text-sm text-zinc-400">{STATUS_PEDIDO[p.status]}</p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
