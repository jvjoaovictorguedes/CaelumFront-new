import { createServer } from "node:http";
import { once } from "node:events";
import { Server } from "socket.io";

export async function startMockBackend(port = 3101) {
  const calls = [];
  const combatSockets = new Set();
  const character = {
    id: 1,
    nome: "Herói Smoke",
    genero: "Masculino",
    nivel: 5,
    experiencia: 20,
    vida_atual: 70,
    vida_maxima: 100,
    mana_atual: 30,
    mana_maxima: 50,
    forca: 10,
    vitalidade: 10,
    agilidade: 10,
    inteligencia: 10,
    velocidade: 10,
    dinheiro: 100,
    rank: "F",
    pontos_distribuir: 0,
    avatar_key: null,
    Class: { nome: "Guerreiro" },
  };
  const summary = {
    character: {
      ...character,
      vidaAtual: 70,
      vidaMaxima: 100,
      manaAtual: 30,
      manaMaxima: 50,
      classe: "Guerreiro",
      avatarKey: null,
      adventurerRank: "F",
    },
    attentionItems: [],
    activities: [],
    shop: { exists: false },
    professions: [],
    guild: { exists: false },
    world: { worldBoss: null, fishingTournament: null, pvpSeason: null },
    unreadMessages: 0,
    generatedAt: new Date().toISOString(),
  };
  const http = createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const route = url.pathname.replace(/^\/api/, "");
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString();
    calls.push({
      route,
      method: req.method,
      authorization: req.headers.authorization,
      body: raw,
    });
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3100");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader("Content-Type", "application/json");
    if (req.method === "OPTIONS") {
      res.end();
      return;
    }
    let status = 200;
    let payload = { status: "success", data: [] };
    if(route === "/anti-automation/status") payload={data:{required:true,challengeId:"00000000-0000-4000-8000-000000000001",siteKey:"smoke-sitekey"}};
    else if(route === "/anti-automation/verify")payload={data:{verified:true}};
    else if (route === "/maintenance/status")
      payload = { enabled: false, message: "" };
    else if (route === "/users/login")
      payload = { token: "smoke-session-token", data: { user: { id: "1" } } };
    else if (route === "/users/socket-ticket")
      payload = { data: { ticket: "smoke-ticket" } };
    else if (route === "/characters/me" || route === "/characters/by-user/1")
      payload = { data: { character, isAdmin: false, adminPermissions: [] } };
    else if (route === "/dashboard/summary") payload = { data: summary };
    else if (route === "/music/config")
      payload = {
        data: {
          version: 1,
          slots: {
            PAGE_ADVENTURE: { type: "SILENCE" },
            PAGE_PVP: { type: "SILENCE" },
          },
          pools: {},
        },
      };
    else if (route === "/world-boss/status")
      payload = { data: { status: "INATIVO", worldBoss: null, chefe: null } };
    else if (route === "/world-boss/ranking")
      payload = { data: { ranking: [] } };
    else if (route === "/smoke/forbidden") {
      status = 403;
      payload = { message: "Forbidden fixture" };
    } else if (route === "/smoke/expired") {
      status = 401;
      payload = { message: "Expired fixture" };
    }
    res.statusCode = status;
    res.end(JSON.stringify(payload));
  });
  const io = new Server(http, { cors: { origin: "http://127.0.0.1:3100" } });
  io.on("connection", (socket) => {
    socket.on("identificar", ({ ticket }, ack) => {
      if (ticket !== "smoke-ticket") return;
      combatSockets.add(socket);
      socket.on("disconnect", () => combatSockets.delete(socket));
      ack?.();
    });
    socket.on("pvp:listar-online", (_payload, ack) => ack?.({ online: ["2"] }));
    socket.on("globalchat:identificar", (_payload, ack) => ack?.({}));
  });
  http.listen(port, "127.0.0.1");
  await once(http, "listening");
  return {
    calls,
    combatSockets,
    io,
    close: () => new Promise((resolve) => io.close(resolve)),
  };
}
