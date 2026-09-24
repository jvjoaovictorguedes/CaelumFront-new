# Caelum — Frontend

Cliente web do RPG Caelum. Next.js 15 (App Router) + React 19 +
Tailwind, comunicando com o backend via REST (proxy same-origin) e
Socket.IO (combate em grupo, PvP ao vivo, chat).

## Requisitos

- Node.js 22+
- O backend (`caelumback-new`) rodando — local ou apontando pra um
  ambiente remoto via `NEXT_PUBLIC_API_URL`.

## Setup local

```bash
npm install
cp .env.local.example .env.local   # e preencha as variáveis (ver abaixo)
npm run dev
```

Abre em `http://localhost:3000`.

## Variáveis de ambiente

Arquivo `.env.local` (não versionado — use `.env.local.example` como
modelo).

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Sim | URL do backend, ex. `http://localhost:3001/api` em desenvolvimento. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Não | Client ID OAuth 2.0 (tipo "Web application") do Google Cloud Console. Sem ela, o botão "Entrar com Google" simplesmente não aparece na tela de login. Precisa ser o **mesmo** Client ID configurado no `GOOGLE_CLIENT_ID` do backend. |

Como o próprio nome indica, tudo que começa com `NEXT_PUBLIC_` fica
visível no navegador (Next.js embute no bundle) — nunca coloque
segredo nenhum aqui.

### Como as chamadas pro backend funcionam

No navegador, o app nunca chama o backend direto: ele chama
`/api/backend/...` (uma rota da própria aplicação Next.js, ver
`src/app/api/backend/[...path]`), que funciona como proxy same-origin
e anexa o token JWT guardado num cookie `httpOnly` — assim o token
nunca fica acessível a JavaScript do navegador. Em Server
Components/Actions (rodando no servidor), o backend é chamado direto
via `NEXT_PUBLIC_API_URL`.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento (Turbopack). |
| `npm run build` | Build de produção. |
| `npm start` | Serve o build de produção (rode `build` antes). |
| `npm run lint` | ESLint (regras do Next.js). |

Existe também CI (GitHub Actions, `.github/workflows/ci.yml`): a cada
push/PR na `main`, roda `lint` e `build` automaticamente.

## Arquitetura

```
src/
  app/              — rotas (App Router). Cada pasta com page.tsx é uma tela.
    login/register/create/classselection/  — fluxo antes do dashboard
    dashboard/      — jogo em si, uma subpasta por sistema (ver abaixo)
    api/backend/    — proxy same-origin pro backend (anexa o cookie de sessão)
  components/       — componentes compartilhados entre várias telas
  contexts/         — estado global via React Context (personagem, sockets, música...)
  lib/api/          — chamadas HTTP organizadas por domínio
  utils/            — helpers (axios configurado, sessão, URLs de mídia...)
  constants/        — constantes compartilhadas (ex. faixas de música)
middleware.ts       — protege rotas (redireciona quem não está logado/sem personagem)
public/             — imagens, sprites, sons e ícones estáticos
```

### Telas do dashboard (`src/app/dashboard/*`)

`adventure` (aventura PvE solo/grupo), `character` (ficha), `inventory`,
`forge` (forja/refino), `market` (mercado entre jogadores), `shop`
(loja), `expedition`, `guilds`, `pvp`, `ranking`, `quests` (missões),
`map` (mapa do mundo), `bestiary`, `messages`, `profile`, `guide`,
`admin` (painel administrativo).

### Tempo real

`contexts/PvpSocketContext.tsx` e `contexts/MessagesSocketContext.tsx`
mantêm as conexões Socket.IO com o backend (combate em grupo, PvP ao
vivo, boss de guilda, chat) e expõem o estado via hooks (`usePvpSocket`,
etc.) pros componentes de cada tela.
