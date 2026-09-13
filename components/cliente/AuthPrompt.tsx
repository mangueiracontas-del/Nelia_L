"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

export function AuthPrompt() {
  const supabase = createClient();
  const [telefone, setTelefone] = useState("");
  const [otp, setOtp] = useState("");
  const [etapa, setEtapa] = useState<"escolha" | "otp">("escolha");
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    // Só exibe o One Tap para usuários não autenticados
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) return setLogado(true);
    });

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
          });
          if (!error) setLogado(true);
        },
        auto_select: true,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.prompt();
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [supabase]);

  async function enviarOtp(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      phone: telefone, // formato E.164: "+5511999998888"
      options: { channel: "whatsapp" },
    });
    if (!error) setEtapa("otp");
  }

  async function verificarOtp(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.verifyOtp({
      phone: telefone,
      token: otp,
      type: "sms",
    });
    if (!error) setLogado(true);
  }

  if (logado) return null;

  return (
    <div className="mx-auto w-full max-w-sm p-6">
      {etapa === "escolha" ? (
        <form onSubmit={enviarOtp} className="space-y-3">
          <label htmlFor="telefone" className="block text-sm font-medium">
            Ou entre com seu WhatsApp
          </label>
          <input
            id="telefone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="+55 11 99999-8888"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-ink-soft px-4 py-3"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-gold py-3 font-semibold text-zinc-950"
          >
            Receber código
          </button>
        </form>
      ) : (
        <form onSubmit={verificarOtp} className="space-y-3">
          <label htmlFor="otp" className="block text-sm font-medium">
            Digite o código recebido
          </label>
          <input
            id="otp"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-ink-soft px-4 py-3 text-center text-xl tracking-[0.5em]"
          />
          <button type="submit" className="w-full rounded-lg bg-gold py-3 font-semibold">
            Confirmar
          </button>
        </form>
      )}
    </div>
  );
}
