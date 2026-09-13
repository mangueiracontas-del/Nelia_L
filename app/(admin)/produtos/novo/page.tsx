"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NovoProdutoPage() {
  const router = useRouter();
  const supabase = createClient();
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([]);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    supabase.from("categorias").select("id, nome").order("ordem")
      .then(({ data }) => setCategorias(data ?? []));
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const { error } = await supabase.from("produtos").insert({
      nome: fd.get("nome") as string,
      categoria_id: fd.get("categoria_id") as string,
      preco: Number(fd.get("preco")),
      estoque: Number(fd.get("estoque")),
      descricao: (fd.get("descricao") as string) || null,
    });

    if (error) return setMensagem("Erro ao salvar: " + error.message);
    router.push("/produtos");
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-xl font-bold">Novo produto</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="nome" className="mb-1 block text-sm font-medium">Nome</label>
          <input id="nome" name="nome" required className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label htmlFor="categoria_id" className="mb-1 block text-sm font-medium">Categoria</label>
          <select id="categoria_id" name="categoria_id" required className="w-full rounded-lg border px-3 py-2">
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="preco" className="mb-1 block text-sm font-medium">Preço (R$)</label>
          <input id="preco" name="preco" type="number" step="0.01" min="0" required
            className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label htmlFor="estoque" className="mb-1 block text-sm font-medium">Estoque inicial</label>
          <input id="estoque" name="estoque" type="number" min="0" required
            className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label htmlFor="descricao" className="mb-1 block text-sm font-medium">Descrição</label>
          <textarea id="descricao" name="descricao" rows={3}
            className="w-full rounded-lg border px-3 py-2" />
        </div>
        {mensagem && <p role="alert" className="text-sm text-red-600">{mensagem}</p>}
        <button type="submit" className="w-full rounded-lg bg-primary py-3 font-bold text-white">
          Salvar produto
        </button>
      </form>
    </div>
  );
}
