// Tipagens geradas por: supabase gen types typescript --local
// (arquivo simplificado — regenere com o CLI para tipos completos)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      categorias: {
        Row: { id: string; nome: string; ordem: number; ativa: boolean; created_at: string };
        Insert: { id?: string; nome: string; ordem?: number; ativa?: boolean; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["categorias"]["Insert"]>;
      };
      produtos: {
        Row: {
          id: string; categoria_id: string; nome: string; descricao: string | null;
          preco: number; imagem_url: string | null; estoque: number;
          disponivel: boolean; created_at: string;
        };
        Insert: {
          id?: string; categoria_id: string; nome: string; descricao?: string | null;
          preco: number; imagem_url?: string | null; estoque?: number;
          disponivel?: boolean; created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["produtos"]["Insert"]>;
      };
      cupons: {
        Row: {
          id: string; codigo: string; tipo: "percentual" | "fixo"; valor: number;
          ativo: boolean; valido_ate: string | null; usos_max: number | null;
          usos_atual: number;
        };
        Insert: {
          id?: string; codigo: string; tipo: "percentual" | "fixo"; valor: number;
          ativo?: boolean; valido_ate?: string | null; usos_max?: number | null;
          usos_atual?: number;
        };
        Update: Partial<Database["public"]["Tables"]["cupons"]["Insert"]>;
      };
      pedidos: {
        Row: {
          id: string; user_id: string;
          status: "recebido" | "em_preparo" | "saiu_para_entrega" | "entregue" | "cancelado";
          tipo: "entrega" | "balcao";
          subtotal: number; taxa_entrega: number; desconto: number; total: number;
          cupom_id: string | null; endereco: Json | null;
          forma_pagamento: string | null; telefone: string | null;
          origem: "app" | "pdv"; criado_por: string | null;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; user_id: string;
          status?: "recebido" | "em_preparo" | "saiu_para_entrega" | "entregue" | "cancelado";
          tipo?: "entrega" | "balcao";
          subtotal: number; taxa_entrega?: number; desconto?: number; total: number;
          cupom_id?: string | null; endereco?: Json | null;
          forma_pagamento?: string | null; telefone?: string | null;
          origem?: "app" | "pdv"; criado_por?: string | null;
          created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pedidos"]["Insert"]>;
      };
      itens_pedido: {
        Row: {
          id: string; pedido_id: string; produto_id: string;
          quantidade: number; preco_unit: number; adicionais: Json;
        };
        Insert: {
          id?: string; pedido_id: string; produto_id: string;
          quantidade: number; preco_unit: number; adicionais?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["itens_pedido"]["Insert"]>;
      };
    };
    Functions: {
      is_staff: { Args: Record<string, never>; Returns: boolean };
    };
  };
}
