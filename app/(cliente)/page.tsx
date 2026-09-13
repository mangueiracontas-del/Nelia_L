import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/cliente/ProductCard";

export const dynamic = "force-dynamic";

export default async function CardapioPage() {
  const supabase = createClient();

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nome, ordem, produtos(id, nome, descricao, preco, imagem_url, disponivel)")
    .eq("ativa", true)
    .order("ordem")
    .order("nome", { foreignTable: "produtos" });

  return (
    <div className="space-y-8">
      {categorias?.map((cat) => (
        <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
          <h2 id={`cat-${cat.id}`} className="mb-3 text-xl font-bold text-gold">
            {cat.nome}
          </h2>
          <ul className="grid gap-3">
            {cat.produtos
              .filter((p) => p.disponivel)
              .map((produto) => (
                <li key={produto.id}>
                  <ProductCard produto={produto} />
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
