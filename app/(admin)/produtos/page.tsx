import { createClient } from "@/lib/supabase/server";
import { StockBadge } from "@/components/admin/StockBadge";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Interface corrigida (PascalCase sem espaços)
interface ProdutoComCategoria {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  disponivel: boolean;
  categorias: { nome: string } | { nome: string }[] | null;
}

export default async function ProdutosPage() {
  const supabase = createClient();
  
  // Realiza a busca tipando explicitamente o retorno do Supabase se necessário
  const { data } = await supabase
    .from("produtos")
    .select("id, nome, preco, estoque, disponivel, categorias(nome)")
    .order("nome");

  // Força a tipagem segura para evitar erros de compilação no .map
  const produtos = data as unknown as ProdutoComCategoria[] | null;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Produtos</h1>
        <Link href="/produtos/novo" className="rounded-lg bg-primary px-4 py-2 font-semibold text-white">
          Novo produto
        </Link>
      </div>
      
      <table className="w-full rounded-lg bg-white text-left shadow-sm">
        <thead className="border-b text-sm text-gray-500">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Categoria</th>
            <th className="px-4 py-3">Preço</th>
            <th className="px-4 py-3">Estoque</th>
          </tr>
        </thead>
        <tbody>
          {produtos?.map((p) => {
            // Verifica se o retorno de categorias veio como Array ou Objeto único
            const nomeCategoria = Array.isArray(p.categorias)
              ? p.categorias[0]?.nome
              : p.categorias?.nome;

            return (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{p.nome}</td>
                <td className="px-4 py-3 text-gray-600">
                  {nomeCategoria || "Sem categoria"}
                </td>
                <td className="px-4 py-3">R$ {Number(p.preco).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <StockBadge estoque={p.estoque} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
