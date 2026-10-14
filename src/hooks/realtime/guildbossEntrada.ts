// Mesmo bug da Provação Final do Templo ("clico em Enfrentar o
// Guardião e a batalha não inicia" — ver templebossEntrada.ts), só que
// no Boss da Guilda: GuildBossTab emitia guildboss:entrar (manual OU
// no resync automático de F5/reconexão) sem checar se o transporte já
// tinha terminado de se identificar (`realtimeReady`, só true depois
// do ack de TRANSPORT.IDENTIFY — ver useCombatTransport.ts). Entre o
// `connect` e esse ack, qualquer guildboss:entrar chega no servidor
// sem socket.characterId setado, o backend responde "Identifique seu
// personagem antes de entrar." e, como nada reavaliava a condição
// depois desse erro, o jogador ficava sem o botão de ataque E sem a
// arena — exatamente o "travado, não consigo entrar" reportado.
// Decisão PURA (sem React/socket), testável isolada, mesmo padrão de
// templebossEntrada.ts/reducers.ts.
export const MENSAGEM_REALTIME_INDISPONIVEL_BOSS_GUILDA =
  "A conexão em tempo real ainda não está disponível.";
export const MENSAGEM_TIMEOUT_ENTRADA_BOSS_GUILDA =
  "Não foi possível iniciar a batalha. Verifique sua conexão em tempo real e tente novamente.";
export const TIMEOUT_ENTRADA_BOSS_GUILDA_MS = 8000;

export const MENSAGEM_TIMEOUT_CONEXAO_BOSS_GUILDA =
  "Não foi possível conectar em tempo real. Verifique sua internet ou recarregue a página.";
export const TIMEOUT_CONEXAO_BOSS_GUILDA_MS = 12000;

export interface DecisaoEntradaBossGuilda {
  podeEntrar: boolean;
  motivoBloqueio?: string;
}

export function podeIniciarEntradaBossGuilda({
  realtimeReady,
  entrando,
}: {
  realtimeReady: boolean;
  entrando: boolean;
}): DecisaoEntradaBossGuilda {
  if (entrando) return { podeEntrar: false };
  if (!realtimeReady) {
    return { podeEntrar: false, motivoBloqueio: MENSAGEM_REALTIME_INDISPONIVEL_BOSS_GUILDA };
  }
  return { podeEntrar: true };
}
