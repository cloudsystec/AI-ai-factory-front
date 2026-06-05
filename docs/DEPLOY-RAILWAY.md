# Deploy no Railway — Frontend

Serviço estático (nginx) com proxy opcional para a API.

## Variáveis (serviço `ai-factory-front`)

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `BACKEND_PROXY_URL` | Recomendada | URL pública do serviço **ai-factory-back** (sem `/` final). Ex.: `https://ai-factory-back-production.up.railway.app`. O nginx encaminha `/api`, `/ws`, `/worker`, `/health`. |
| `VITE_API_URL` | Alternativa | Se **não** usar proxy, URL completa da API (build ou runtime). O browser chama a API em cross-origin — exige `CORS_ORIGIN` correcto no back. |
| `VITE_STRIPE_CHECKOUT_*` | Opcional | Payment Links da landing |
| `VITE_SALES_EMAIL` | Opcional | Email vendas |

## Configuração recomendada (domínio único `devforless.com.br`)

1. **Serviço back** (`ai-factory-back`):
   - `CORS_ORIGIN=https://devforless.com.br` (ou domínio do front)
   - `PUBLIC_BACK_URL=https://<url-publica-do-back>`
   - Demais vars: `DATABASE_URL`, `JWT_SECRET`, `WORKER_SECRET`, GitHub App, etc.

2. **Serviço front** (`ai-factory-front`):
   - `BACKEND_PROXY_URL=https://<url-publica-do-back>` (Reference Variable do serviço back)
   - Domínio custom: `devforless.com.br`
   - **Não** é necessário `VITE_API_URL` no build se usar proxy (URLs relativas `/api/...`).

3. Redeploy do **front** após definir `BACKEND_PROXY_URL`.

## Validar

```bash
curl -s https://devforless.com.br/health
# deve devolver {"ok":true,...} do back via proxy

curl -s -o /dev/null -w "%{http_code}" -X POST https://devforless.com.br/api/execution/teste/state
# 401 sem token = rota existe; 404 = proxy/API desalinhado
```

## Worker (tenant)

O painel mostra **"A aguardar sincronização do worker"** quando ainda não há snapshot de scope no Postgres.

1. Provisionar worker CLI no Railway para o tenant (`PUBLIC_BACK_URL` = URL do back).
2. Worker online + job **scope** executado → Kanban deixa de estar vazio.
3. **"Not Found"** na execução quase sempre é front sem ligação à API (proxy/`VITE_API_URL`).

## Desenvolvimento local

```powershell
cd ai-factory-front
npm run dev
# VITE_API_URL vazio ou localhost:4000; proxy Vite em vite.config.js
```
