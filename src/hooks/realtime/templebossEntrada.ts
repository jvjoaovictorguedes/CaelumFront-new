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

// Mesmo problema, uma etapa antes do clique: se a conexão em tempo real
// nunca termina de se identificar (ex.: busca do ticket falhando por
// CORS/URL de ambiente — ver useCombatTransport.ts), o botão ficava
// preso em "Conectando..." para sempre, sem NENHUM aviso — o mesmo tipo
// de loading infinito silencioso que a correção do clique já eliminava,
// só que uma camada acima. Timeout generoso (handshake normal custa uma
// ida e volta HTTP + um ack de socket, nunca chega perto disso) só pra
// nunca deixar o jogador esperando pra sempre sem explicação.
export const MENSAGEM_TIMEOUT_CONEXAO_GUARDIAO =
  "Não foi possível conectar em tempo real. Verifique sua internet ou recarregue a página.";
export const TIMEOUT_CONEXAO_GUARDIAO_MS = 12000;

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
