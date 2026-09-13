"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Role = "atendente" | "admin" | null;

export function useUserRole(): Role {
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: r } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();
      setRole((r?.role as Role) ?? null);
    });
  }, []);

  return role;
}
