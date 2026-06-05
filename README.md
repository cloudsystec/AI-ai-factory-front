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

**PowerShell (Windows):**

```powershell
Copy-Item .env.example .env   # VITE_API_URL=http://localhost:4000
npm install
npm run dev
```

Git Bash / WSL:

```bash
cp .env.example .env
npm install
npm run dev
```

Certifique-se de que o [backend](../ai-factory-back/README.md) está a correr e que `CORS_ORIGIN` no back inclui `http://localhost:5173`.

## Docker (imagem nginx)

No PowerShell, o `--build-arg` com URL deve ir entre aspas e o contexto de build é **`.`** no fim da linha (obrigatório).

**PowerShell:**

```powershell
.\scripts\docker-build.ps1
.\scripts\docker-run.ps1
# Portal: http://localhost:8080
```

Manual (produção — substitua o URL do back):

```powershell
docker build -t ai-factory-front --build-arg "VITE_API_URL=https://your-back.railway.app" .
docker run -d --name ai-factory-front -p 8080:80 ai-factory-front
```

Git Bash:

```bash
docker build -t ai-factory-front --build-arg VITE_API_URL=https://your-back.railway.app .
docker run -d --name ai-factory-front -p 8080:80 ai-factory-front
```

Deploy previsto no **Railway** — ver [docs/DEPLOY-RAILWAY.md](./docs/DEPLOY-RAILWAY.md) (`BACKEND_PROXY_URL` + domínio custom).

## Relacionados

- Backend: [../ai-factory-back/README.md](../ai-factory-back/README.md)
- Cliente worker: [../ai-factory-cli/README.md](../ai-factory-cli/README.md) (não acedido pelo browser)
