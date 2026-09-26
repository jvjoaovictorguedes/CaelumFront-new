"use client";

// Painel Administrativo de Músicas §12.1/§12.4/§12.5 — provider LEVE
// acima do dashboard (mesmo raciocínio de WorldBossSocketContext.tsx:
// uma conexão pequena e separada, sem entrar na engrenagem grande de
// duelo/party). Busca GET /api/music/config UMA vez, mantém a versão em
// memória e expõe resolverSlot(slotKey). O MusicProvider
// (contexts/MusicContext.tsx) continua INTOCADO — só quem toca áudio de
// verdade — este contexto só decide QUAL faixa cada slot pede.
//
// Vai direto no backend (NEXT_PUBLIC_API_URL), não pelo proxy
// same-origin /api/backend: essas rotas são públicas (sem
// authMiddleware) e o proxy hoje lê a resposta inteira como texto
// (route.ts) — inviável pro streaming de áudio com Range.
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { MusicTrack } from "@/constants/music";
import { SLOT_FALLBACKS } from "@/constants/music";
import type { MusicSlotKey } from "@/constants/musicSlots";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/$/, "");
const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

type SlotConfigApi =
  | { type: "TRACK"; trackKey: string; loop?: boolean; defaultVolume?: number | null; fadeMs?: number | null }
  | { type: "POOL"; poolKey: string; fadeMs?: number | null }
  | { type: "SILENCE"; fadeMs?: number | null };

interface PoolMemberApi {
  trackKey: string;
  peso: number;
  loop?: boolean;
  defaultVolume?: number | null;
}

interface MusicConfigApi {
  version: number;
  slots: Record<string, SlotConfigApi>;
  pools: Record<string, PoolMemberApi[]>;
}

function trackFromApi(trackKey: string, loop?: boolean, defaultVolume?: number | null): MusicTrack {
  return {
    key: trackKey,
    src: `${API_BASE_URL}/music/tracks/${encodeURIComponent(trackKey)}/audio`,
    loop: loop ?? true,
    defaultVolume: defaultVolume ?? undefined,
  };
}

// Sorteio ponderado — usado só na hora de RESOLVER um slot POOL; quem
// chama (useSlotMusic) garante que isso roda uma única vez por
// ativação/montagem (§9.2), nunca a cada re-render.
function sortearPonderado(membros: PoolMemberApi[]): PoolMemberApi | null {
  if (membros.length === 0) return null;
  const somaPesos = membros.reduce((soma, m) => soma + Math.max(0, m.peso), 0);
  if (somaPesos <= 0) return null;
  let alvo = Math.random() * somaPesos;
  for (const membro of membros) {
    alvo -= Math.max(0, membro.peso);
    if (alvo <= 0) return membro;
  }
  return membros[membros.length - 1];
}

export interface ResolvedSlot {
  track: MusicTrack | null; // null = silêncio explícito
  fadeMs?: number;
}

interface MusicConfigContextValue {
  version: number;
  loaded: boolean;
  usandoFallback: boolean;
  // Resolve um slot pro track/silêncio que ele deve tocar AGORA. Faz
  // sorteio de pool a cada chamada — quem consome isto (useSlotMusic)
  // é responsável por só chamar uma vez por ativação (useState
  // initializer), nunca em todo re-render.
  resolverSlot: (slot: MusicSlotKey) => ResolvedSlot;
}

const MusicConfigContext = createContext<MusicConfigContextValue | null>(null);

export function MusicConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<MusicConfigApi | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [usandoFallback, setUsandoFallback] = useState(false);
  const versionRef = useRef(0);
  const socketRef = useRef<Socket | null>(null);

  async function buscarConfig() {
    try {
      const resposta = await fetch(`${API_BASE_URL}/music/config`, { cache: "no-store" });
      if (!resposta.ok) throw new Error(`status ${resposta.status}`);
      const corpo = (await resposta.json()) as { data: MusicConfigApi };
      versionRef.current = corpo.data.version;
      setConfig(corpo.data);
      setUsandoFallback(false);
    } catch (error) {
      // Falha do backend de música NÃO pode impedir o jogo (§17) — segue
      // com o fallback local (SLOT_FALLBACKS), sem travar navegação.
      console.warn("[MusicConfigContext] Falha ao buscar /api/music/config — usando fallback local.", error);
      setUsandoFallback(true);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    buscarConfig();

    // §12.4 — cliente recebe music:config-updated e refaz o fetch, sem
    // nunca forçar o MusicProvider a trocar uma solicitação já ativa no
    // meio de algo (o snapshot novo só é usado na PRÓXIMA vez que um
    // slot for resolvido — próxima montagem de PageMusic/useContextMusic).
    const socket = io(SOCKET_BASE_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("music:config-updated", (payload: { version?: number }) => {
      if (typeof payload?.version === "number" && payload.version > versionRef.current) {
        buscarConfig();
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  function resolverSlot(slot: MusicSlotKey): ResolvedSlot {
    const slotConfig = config?.slots?.[slot];
    if (!slotConfig) {
      const fallback = SLOT_FALLBACKS[slot];
      if (!fallback) return { track: null };
      return { track: fallback.type === "track" ? fallback.track : fallback.pick() };
    }

    if (slotConfig.type === "TRACK") {
      return {
        track: trackFromApi(slotConfig.trackKey, slotConfig.loop, slotConfig.defaultVolume),
        fadeMs: slotConfig.fadeMs ?? undefined,
      };
    }
    if (slotConfig.type === "POOL") {
      const membros = config?.pools?.[slotConfig.poolKey] ?? [];
      const sorteado = sortearPonderado(membros);
      if (!sorteado) {
        // Pool sem membros ativos publicado por engano — nunca deveria
        // acontecer (validarDraft bloqueia), mas cai pro fallback local
        // em vez de tocar nada.
        const fallback = SLOT_FALLBACKS[slot];
        return { track: fallback?.type === "pool" ? fallback.pick() : null };
      }
      return {
        track: trackFromApi(sorteado.trackKey, sorteado.loop, sorteado.defaultVolume),
        fadeMs: slotConfig.fadeMs ?? undefined,
      };
    }
    return { track: null, fadeMs: slotConfig.fadeMs ?? undefined };
  }

  return (
    <MusicConfigContext.Provider value={{ version: config?.version ?? 0, loaded, usandoFallback, resolverSlot }}>
      {children}
    </MusicConfigContext.Provider>
  );
}

export function useMusicConfig() {
  const ctx = useContext(MusicConfigContext);
  if (!ctx) throw new Error("useMusicConfig precisa estar dentro de um <MusicConfigProvider>.");
  return ctx;
}
