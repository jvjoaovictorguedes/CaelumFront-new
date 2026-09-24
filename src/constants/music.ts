// Catálogo central de músicas (Especificação Sistema de Música por
// Página §3). O código das páginas usa objetos daqui em vez de espalhar
// caminhos literais — a identidade de uma trilha é `key`, não `src`:
// dá pra trocar o arquivo físico depois sem mudar a semântica de quem
// usa <PageMusic track={MUSIC.ALGO} />.
export interface MusicTrack {
  key: string;
  src: string;
  title?: string;
  loop?: boolean;
  defaultVolume?: number;
}

// Nenhuma trilha cadastrada ainda — o proprietário do jogo fornece os
// arquivos (nunca baixar/inventar música de terceiros, §21). Pra
// cadastrar uma nova:
//   1. Colocar o arquivo em public/audio/music/.
//   2. Adicionar uma entrada aqui com key estável.
//   3. <PageMusic track={MUSIC.MINHA_TRILHA} /> na página escolhida.
// Nenhuma mudança no provider/NavMenu é necessária pra isso.
export const MUSIC = {} satisfies Record<string, MusicTrack>;

// Prioridade da solicitação de música mais alta vence (§6). Empate =
// solicitação mais recente. Eventos temporários (combate/boss) sobrepõem
// a música da página sem destruir a solicitação original — quando o
// evento libera (releaseMusic), a trilha da página volta sozinha.
export const MUSIC_PRIORITY = {
  PAGE: 10,
  AREA: 20,
  COMBAT: 50,
  PVP: 60,
  BOSS: 100,
} as const;
