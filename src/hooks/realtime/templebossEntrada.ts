// Bug reportado ("clico em Enfrentar o Guardião e a batalha não
// inicia"): TempleGuardiaoPanel emitia templeboss:entrar direto no
// onClick sem checar NADA — nem socket conectado, nem identificado.
// Decisão PURA (sem React/socket/imports de valor), testável isolada
// do componente e de qualquer alias de módulo (mesmo padrão de
// reducers.ts, que só usa `import type`).
export const MENSAGEM_REALTIME_INDISPONIVEL_GUARDIAO =
  "A conexão em tempo real ainda não está disponível.";
export const MENSAGEM_TIMEOUT_ENTRADA_GUARDIAO =
  "Não foi possível iniciar a batalha. Verifique sua conexão em tempo real e tente novamente.";
export const TIMEOUT_ENTRADA_GUARDIAO_MS = 8000;

export interface DecisaoEntradaGuardiao {
  podeEntrar: boolean;
  motivoBloqueio?: string;
}

// `realtimeReady` só é true depois do ack de TRANSPORT.IDENTIFY (ver
// useCombatTransport.ts) — nunca só `conectado`. `entrando` evita
// clique duplicado enquanto já existe uma tentativa de entrada em voo.
export function podeIniciarEntradaGuardiao({
  realtimeReady,
  entrando,
}: {
  realtimeReady: boolean;
  entrando: boolean;
}): DecisaoEntradaGuardiao {
  if (entrando) return { podeEntrar: false };
  if (!realtimeReady) {
    return { podeEntrar: false, motivoBloqueio: MENSAGEM_REALTIME_INDISPONIVEL_GUARDIAO };
  }
  return { podeEntrar: true };
}
