"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Cupom {
  id: string;
  codigo: string;
  tipo: "percentual" | "fixo";
  valor: number;
  ativo: boolean;
  usos_atual: number;
}

export default function CuponsPage() {
  const supabase = createClient();
  const [cupons, setCupons] = useState<Cupom[]>([]);

  useEffect(() => {
    supabase.from("cupons").select("*").order("codigo")
      .then(({ data }) => setCupons(data ?? []));
  }, [supabase]);

  async function toggleAtivo(cupom: Cupom) {
    await supabase.from("cupons").update({ ativo: !cupom.ativo }).eq("id", cupom.id);
    setCupons((prev) =>
      prev.map((c) => (c.id === cupom.id ? { ...c, ativo: !c.ativo } : c))
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Cupons</h1>
      <table className="w-full rounded-lg bg-white text-left shadow-sm">
        <thead className="border-b text-sm text-gray-500">
          <tr>
            <th className="px-4 py-3">Código</th>
            <th className="px-4 py-3">Desconto</th>
            <th className="px-4 py-3">Usos</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {cupons.map((c) => (
            <tr key={c.id} className="border-b last:border-0">
              <td className="px-4 py-3 font-mono font-medium">{c.codigo}</td>
              <td className="px-4 py-3">
                {c.tipo === "percentual" ? `${c.valor}%` : `R$ ${c.valor.toFixed(2)}`}
              </td>
              <td className="px-4 py-3">{c.usos_atual}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleAtivo(c)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    c.ativo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {c.ativo ? "Ativo" : "Inativo"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
