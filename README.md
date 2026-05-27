# ai-factory-front

**Frontend** da plataforma AI Factory: portal React (Vite).

- Login e sessão (JWT)
- Projetos, Kanban de tasks, estado de scope
- Acompanhamento de jobs em tempo real (SSE de logs via backend)
- Definições de desenvolvimento (autorun, etc.)

Consome **apenas** a API do backend. Não comunica com o CLI nem com Redis diretamente.

## Landing pública

Rota **`/landingpage`** — página de marketing (sem login). Planos redirecionam para Stripe Payment Links configurados em `src/landing/landingConfig.js`.

## Desenvolvimento interno (localhost)

| Serviço | URL |
|---------|-----|
| Portal | `http://localhost:5173` |
| API (back) | `http://localhost:4000` |

```bash
cp .env.example .env   # VITE_API_URL=http://localhost:4000
npm install
npm run dev
```

Certifique-se de que o [backend](../ai-factory-back/README.md) está a correr e que `CORS_ORIGIN` no back inclui `http://localhost:5173`.

## Produção (em breve)

Build Docker com o URL público do backend:

```bash
docker build -t ai-factory-front --build-arg VITE_API_URL=https://your-back.railway.app .
```

Deploy previsto no **Railway** (ou CDN estático com a mesma variável de build).

## Relacionados

- Backend: [../ai-factory-back/README.md](../ai-factory-back/README.md)
- Cliente worker: [../ai-factory-cli/README.md](../ai-factory-cli/README.md) (não acedido pelo browser)
