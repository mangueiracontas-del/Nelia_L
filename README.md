# Lanchonete Premium — Web App (PWA) + Painel Admin/PDV

Sistema completo para lanchonete: app do cliente (mobile-first, dark mode),
PDV de balcão e backoffice administrativo (light mode), com Supabase
(PostgreSQL + Auth + Realtime) e deploy na Vercel.

## Stack

- **Next.js 14** (App Router) + Tailwind CSS
- **Supabase**: PostgreSQL, Auth (Google One Tap + Telefone OTP), Realtime, Edge Functions
- **Deploy**: Vercel (conectado ao GitHub)

## Estrutura

- `app/(cliente)` — rotas públicas do app do cliente
- `app/(admin)` — PDV e backoffice (protegido por role `atendente`/`admin`)
- `app/api/auth/callback` — callback OAuth
- `components/` — UI componentizada
- `lib/supabase` — clientes browser/server
- `hooks/usePedidoRealtime` — subscription Realtime por pedido
- `supabase/migrations` — schema, trigger de estoque e políticas RLS
- `supabase/functions/send-whatsapp` — Edge Function de notificações

## Setup

```bash
npm install
cp .env.local.example .env.local  # preencha as variáveis
npm run dev
```

### Supabase

```bash
supabase link --project-ref SEU-PROJETO
supabase db push   # aplica migrations 001, 002 e 003
supabase functions deploy send-whatsapp
```

Configure no painel do Supabase:
1. **Authentication → Providers**: ative Google e Phone.
2. **Database → Webhooks**: crie webhooks em `pedidos` para `INSERT` e `UPDATE`
   apontando para a Edge Function `send-whatsapp`.
3. Insira a role do primeiro gerente:
   `insert into public.user_roles (user_id, role) values ('UUID', 'admin');`

## Fluxo crítico

Login One Tap/OTP → checkout → INSERT em `pedidos`/`itens_pedido` →
trigger `trg_baixa_estoque` → webhook → WhatsApp → stepper atualiza via
`postgres_changes` filtrado por `id=eq.{pedidoId}`.
