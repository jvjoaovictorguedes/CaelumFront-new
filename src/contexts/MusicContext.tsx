"use client";

// MusicProvider — sistema global de BGM por página e contexto
// (Especificação Sistema de Música por Página e Contexto). Única fonte
// de verdade: só este arquivo toca/controla os <audio> reais. Páginas e
// componentes (PartyBattleArena, GuildBossLiveArena, ...) apenas
// registram/removem uma "solicitação" com requestMusic/releaseMusic —
// nunca chamam audio.play() diretamente.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { MusicTrack } from "@/constants/music";

export interface MusicRequest {
  ownerId: string;
  track: MusicTrack | null;
  priority: number;
  fadeMs?: number;
}

interface MusicContextValue {
  currentTrack: MusicTrack | null;
  volume: number;
  muted: boolean;
  isPlaying: boolean;
  requestMusic: (request: MusicRequest) => void;
  releaseMusic: (ownerId: string) => void;
  setVolume: (value: number) => void;
  setMuted: (value: boolean) => void;
  toggleMuted: () => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

const STORAGE_KEYS = {
  volume: "caelum.audio.musicVolume",
  muted: "caelum.audio.musicMuted",
} as const;

const VOLUME_PADRAO = 0.5;
const FADE_PADRAO_MS = 800;

function lerVolumeSalvo(): number {
  try {
    const bruto = window.localStorage.getItem(STORAGE_KEYS.volume);
    const valor = bruto === null ? NaN : Number(bruto);
    if (Number.isFinite(valor) && valor >= 0 && valor <= 1) return valor;
  } catch {
    // localStorage indisponível (aba privada/storage bloqueado) — usa o default.
  }
  return VOLUME_PADRAO;
}

function lerMutedSalvo(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.muted) === "1";
  } catch {
    return false;
  }
}

// Ramp de volume via requestAnimationFrame, cancelável por token — uma
// troca de faixa mais nova invalida o token e a rampa antiga para de se
// aplicar sozinha (evita o "play() antigo resolve depois" da spec §7.2).
function fadeVolume(
  audio: HTMLAudioElement,
  de: number,
  para: number,
  duracaoMs: number,
  meuToken: number,
  tokenAtualRef: { current: number },
  aoTerminar?: () => void,
) {
  if (duracaoMs <= 0) {
    audio.volume = para;
    aoTerminar?.();
    return;
  }
  const inicio = performance.now();
  function passo(agora: number) {
    if (tokenAtualRef.current !== meuToken) return;
    const progresso = Math.min(1, (agora - inicio) / duracaoMs);
    audio.volume = de + (para - de) * progresso;
    if (progresso < 1) {
      requestAnimationFrame(passo);
    } else {
      aoTerminar?.();
    }
  }
  requestAnimationFrame(passo);
}

interface RequestInterna extends MusicRequest {
  ordem: number;
}

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(VOLUME_PADRAO);
  const [muted, setMutedState] = useState(false);

  // Preferências só são lidas no cliente, após o mount — evita acessar
  // localStorage no servidor e divergência de hidratação SSR/CSR.
  useEffect(() => {
    setVolumeState(lerVolumeSalvo());
    setMutedState(lerMutedSalvo());
  }, []);

  const requestsRef = useRef(new Map<string, RequestInterna>());
  const ordemRef = useRef(0);
  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const activeIsARef = useRef(true);
  const fadeTokenRef = useRef(0);
  const currentTrackKeyRef = useRef<string | null>(null);
  const volumeRef = useRef(volume);
  const mutedRef = useRef(muted);

  const volumeEfetivo = useCallback(() => (mutedRef.current ? 0 : volumeRef.current), []);

  const aplicarVolumeNoPlayerAtivo = useCallback(() => {
    const ativo = activeIsARef.current ? audioARef.current : audioBRef.current;
    if (ativo) ativo.volume = volumeEfetivo();
  }, [volumeEfetivo]);

  useEffect(() => {
    volumeRef.current = volume;
    aplicarVolumeNoPlayerAtivo();
    try {
      window.localStorage.setItem(STORAGE_KEYS.volume, String(volume));
    } catch {
      // Preferência simplesmente não persiste — o áudio continua funcionando.
    }
  }, [volume, aplicarVolumeNoPlayerAtivo]);

  useEffect(() => {
    mutedRef.current = muted;
    aplicarVolumeNoPlayerAtivo();
    try {
      window.localStorage.setItem(STORAGE_KEYS.muted, muted ? "1" : "0");
    } catch {
      // idem — segue sem persistir.
    }
  }, [muted, aplicarVolumeNoPlayerAtivo]);

  // Troca de faixa efetiva: crossfade real com os dois players internos
  // (§7.1). `track: null` é o caso "stop" — fade-out e pausa.
  const trocarParaFaixa = useCallback(
    (track: MusicTrack | null, fadeMs: number) => {
      const meuToken = (fadeTokenRef.current += 1);
      const antigo = activeIsARef.current ? audioARef.current : audioBRef.current;
      const novo = activeIsARef.current ? audioBRef.current : audioARef.current;

      if (!track) {
        if (antigo && !antigo.paused) {
          fadeVolume(antigo, antigo.volume, 0, fadeMs, meuToken, fadeTokenRef, () => {
            if (fadeTokenRef.current !== meuToken) return;
            antigo.pause();
          });
        }
        setCurrentTrack(null);
        setIsPlaying(false);
        return;
      }

      if (!novo) return;
      novo.src = track.src;
      novo.loop = track.loop ?? true;
      novo.volume = 0;
      novo.currentTime = 0;
      // Com preload="none" (de propósito — nunca baixa nada sem pedido),
      // só trocar o .src não faz o navegador começar a buscar sozinho;
      // sem isso "canplay" nunca disparava e a música nunca tocava.
      // load() força o início do carregamento agora.
      novo.load();

      const iniciar = () => {
        if (fadeTokenRef.current !== meuToken) return;
        novo
          .play()
          .then(() => {
            if (fadeTokenRef.current !== meuToken) return;
            setIsPlaying(true);
            fadeVolume(novo, 0, volumeEfetivo(), fadeMs, meuToken, fadeTokenRef);
            if (antigo && antigo !== novo) {
              fadeVolume(antigo, antigo.volume, 0, fadeMs, meuToken, fadeTokenRef, () => {
                if (fadeTokenRef.current !== meuToken) return;
                antigo.pause();
                antigo.currentTime = 0;
              });
            }
            activeIsARef.current = !activeIsARef.current;
          })
          .catch(() => {
            // Autoplay bloqueado pelo navegador — comportamento normal,
            // sem spam de erro. Os listeners de desbloqueio (abaixo)
            // tentam de novo na primeira interação válida.
            if (fadeTokenRef.current !== meuToken) return;
            setIsPlaying(false);
          });
      };

      setCurrentTrack(track);

      // play() já espera internamente ter dados suficientes pra tocar —
      // não precisa mais aguardar "canplay" manualmente antes de chamar
      // (era esse o deadlock: com preload="none" o "canplay" às vezes
      // nunca disparava sozinho).
      iniciar();
      novo.addEventListener(
        "error",
        () => {
          // Arquivo ausente/corrompido não pode derrubar a navegação —
          // só registra e segue sem música.
          console.error(`[MusicProvider] Falha ao carregar a faixa "${track.key}" (${track.src}).`);
          if (fadeTokenRef.current === meuToken) setIsPlaying(false);
        },
        { once: true },
      );
    },
    [volumeEfetivo],
  );

  // Reavalia a solicitação ativa (maior prioridade; empate = mais
  // recente) toda vez que requestMusic/releaseMusic muda o mapa.
  const recomputar = useCallback(() => {
    let melhor: RequestInterna | null = null;
    for (const req of requestsRef.current.values()) {
      if (
        !melhor ||
        req.priority > melhor.priority ||
        (req.priority === melhor.priority && req.ordem > melhor.ordem)
      ) {
        melhor = req;
      }
    }
    const trackAlvo = melhor?.track ?? null;
    const fadeMs = melhor?.fadeMs ?? FADE_PADRAO_MS;

    // Mesma key -> não reinicia (mantém currentTime), mesmo que a
    // solicitação vencedora tenha mudado de dono (§7.2/§13).
    if ((trackAlvo?.key ?? null) === currentTrackKeyRef.current) return;
    currentTrackKeyRef.current = trackAlvo?.key ?? null;
    trocarParaFaixa(trackAlvo, fadeMs);
  }, [trocarParaFaixa]);

  const requestMusic = useCallback(
    (request: MusicRequest) => {
      ordemRef.current += 1;
      requestsRef.current.set(request.ownerId, { ...request, ordem: ordemRef.current });
      recomputar();
    },
    [recomputar],
  );

  const releaseMusic = useCallback(
    (ownerId: string) => {
      if (!requestsRef.current.delete(ownerId)) return;
      recomputar();
    },
    [recomputar],
  );

  // Desbloqueio de autoplay (§8) — só tenta retomar a faixa efetiva
  // atual na primeira interação real; nunca hacks de áudio silencioso.
  useEffect(() => {
    function tentarRetomar() {
      const ativo = activeIsARef.current ? audioARef.current : audioBRef.current;
      if (!ativo || !ativo.src || !ativo.paused) return;
      ativo
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Ainda sem interação suficiente pro navegador — tenta de novo
          // na próxima.
        });
    }
    window.addEventListener("pointerdown", tentarRetomar);
    window.addEventListener("keydown", tentarRetomar);
    window.addEventListener("touchstart", tentarRetomar);
    return () => {
      window.removeEventListener("pointerdown", tentarRetomar);
      window.removeEventListener("keydown", tentarRetomar);
      window.removeEventListener("touchstart", tentarRetomar);
    };
  }, []);

  const setVolume = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    setVolumeState(Math.min(1, Math.max(0, value)));
  }, []);
  const setMuted = useCallback((value: boolean) => setMutedState(value), []);
  const toggleMuted = useCallback(() => setMutedState((atual) => !atual), []);

  return (
    <MusicContext.Provider
      value={{ currentTrack, volume, muted, isPlaying, requestMusic, releaseMusic, setVolume, setMuted, toggleMuted }}
    >
      {children}
      <audio ref={audioARef} preload="none" />
      <audio ref={audioBRef} preload="none" />
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic precisa estar dentro de um <MusicProvider>.");
  return ctx;
}
