# 🍔 Lanchonete Premium — App do Cliente + PDV (Serverless)

Web App estático (React + Vite + Tailwind) hospedado no **GitHub Pages** via
**GitHub Actions**, com backend 100% **Supabase** (PostgreSQL + Realtime + Edge Functions).

## Estrutura

```
lanchonete-premium/
├── .github/workflows/deploy.yml   # CI/CD: build estático + deploy no GitHub Pages
├── supabase/
│   ├── migrations/                # SQL executado no SQL Editor do Supabase
│   │   ├── 001_schema.sql         # tabelas, índices, perfis, enum de status
│   │   ├── 002_trigger_estoque.sql# trigger de baixa automática por unidade
│   │   └── 003_rls.sql            # políticas RLS (Zero-Trust)
│   └── functions/send-whatsapp/   # Edge Function (Database Webhook)
└── app/                           # React + Vite + Tailwind (SPA/PWA)
    └── src/
        ├── lib/supabaseClient.ts
        ├── components/auth/       # GoogleOneTap.tsx, PhoneLogin.tsx
        ├── components/tracking/   # PedidoStepper.tsx (Realtime)
        └── pages/                 # AcompanharPedido.tsx
```

## Setup

### 1. Supabase
1. Crie o projeto em supabase.com.
2. Execute **na ordem** os arquivos em `supabase/migrations/` no SQL Editor.
3. Auth → Providers: ative **Google** (cole o Client ID/Secret do Google Cloud
   Console com o One Tap habilitado) e **Phone** (Twilio ou MessageBird).
4. Database → Webhooks: crie um webhook `INSERT` e outro `UPDATE` na tabela
   `pedidos` apontando para a Edge Function `send-whatsapp`.
5. Edge Functions → Deploy: `supabase functions deploy send-whatsapp` e
   configure os secrets: `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`, `APP_URL`,
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
6. Promova usuários a staff atualizando `perfis_usuario.role`
   para `'atendente'` ou `'admin'`.

### 2. GitHub
1. Suba este repositório.
2. Settings → Pages: source = **GitHub Actions**.
3. Settings → Secrets and variables → Actions:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID`
4. Push na `main` dispara o deploy.

## Segurança
- Toda a proteção vive no **RLS** do banco (`auth.uid()` + `eh_staff()`).
- O `anon key` é pública por design — sem ela ninguém passa das policies.
- Relatórios e uso de cupons por RPC/Edge Function com `service_role`.
