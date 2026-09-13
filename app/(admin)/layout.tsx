import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!role || (role.role !== "atendente" && role.role !== "admin")) redirect("/");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3" aria-label="Navegação administrativa">
          <strong className="text-primary">Painel</strong>
          <a href="/pdv" className="hover:text-primary">PDV</a>
          <a href="/pedidos" className="hover:text-primary">Pedidos</a>
          <a href="/produtos" className="hover:text-primary">Produtos</a>
          <a href="/cupons" className="hover:text-primary">Cupons</a>
          <a href="/relatorios" className="hover:text-primary">Relatórios</a>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
