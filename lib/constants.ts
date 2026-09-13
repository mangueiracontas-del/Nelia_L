export const STATUS_PEDIDO = {
  recebido: "Recebido",
  em_preparo: "Em Preparo",
  saiu_para_entrega: "Saiu para Entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
} as const;

export type StatusPedido = keyof typeof STATUS_PEDIDO;

export const ETAPAS_STEPPER: { key: StatusPedido; label: string }[] = [
  { key: "recebido", label: "Recebido" },
  { key: "em_preparo", label: "Em Preparo" },
  { key: "saiu_para_entrega", label: "Saiu para Entrega" },
  { key: "entregue", label: "Entregue" },
];
