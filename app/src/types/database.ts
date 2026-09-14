export type StatusPedido =
  | 'recebido'
  | 'em_preparo'
  | 'saiu_para_entrega'
  | 'entregue'
  | 'cancelado'

export interface Produto {
  id: string
  categoria_id: string | null
  nome: string
  descricao: string | null
  preco: number
  imagem_url: string | null
  estoque_atual: number
  ativo: boolean
}

export interface Categoria {
  id: string
  nome: string
  ordem: number
  ativa: boolean
}

export interface Cupom {
  id: string
  codigo: string
  tipo: 'percentual' | 'valor_fixo'
  valor: number
}

export interface ItemPedido {
  id?: number
  pedido_id?: string
  produto_id: string
  nome_produto: string
  quantidade: number
  preco_unitario: number
  adicionais?: { nome: string; preco: number }[]
}

export interface Pedido {
  id: string
  user_id: string
  status: StatusPedido
  subtotal: number
  taxa_entrega: number
  desconto: number
  total: number
  endereco_entrega: Record<string, string> | null
  forma_pagamento: string | null
  origem: 'app' | 'pdv'
  created_at: string
}
