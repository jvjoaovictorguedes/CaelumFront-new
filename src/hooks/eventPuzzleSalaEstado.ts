import type { PuzzleBlueprintPublicoApi, PuzzleObjectivoProgressivoApi } from "@/lib/api/eventPuzzle";

// "O Coração da Máquina Celestial" — correção de lifecycle/UX ("sala
// concluída recomeça"). Decisão PURA (sem React/DOM/rede) de como a UI
// representa o estado de uma sala — mesmo princípio de
// src/hooks/realtime/templebossEntrada.ts (bug real, causa raiz
// isolada numa função testável sem montar nenhum componente).
//
// Prioridade visual (seção 6 da correção, nunca ambígua):
//   bloqueado → concluído → em andamento → disponível.
// Uma sala concluída NUNCA mostra "Entrar" normal (mostrarEntrarNormal
// é sempre false pra CONCLUIDA); se `replayable` vier true no futuro,
// só então oferece a ação SECUNDÁRIA explícita "Refazer" — nunca
// reinício automático.
export type EstadoVisualSala = "BLOQUEADA" | "CONCLUIDA" | "EM_ANDAMENTO" | "DISPONIVEL";

export interface DecisaoVisualSala {
  estado: EstadoVisualSala;
  rotulo: "Bloqueada" | "✓ Concluído" | "Continuar" | "Entrar";
  clicavel: boolean;
  mostrarEntrarNormal: boolean;
  mostrarRefazer: boolean;
}

export function decidirEstadoVisualDaSala(
  sala: Pick<PuzzleBlueprintPublicoApi, "bloqueado" | "concluido" | "em_andamento" | "replayable">,
): DecisaoVisualSala {
  if (sala.bloqueado) {
    return { estado: "BLOQUEADA", rotulo: "Bloqueada", clicavel: false, mostrarEntrarNormal: false, mostrarRefazer: false };
  }
  if (sala.concluido) {
    return {
      estado: "CONCLUIDA",
      rotulo: "✓ Concluído",
      clicavel: true, // clicar só NAVEGA pra ver a câmara concluída — nunca cria instância (ver RoomClient).
      mostrarEntrarNormal: false,
      mostrarRefazer: sala.replayable === true,
    };
  }
  if (sala.em_andamento) {
    return { estado: "EM_ANDAMENTO", rotulo: "Continuar", clicavel: true, mostrarEntrarNormal: false, mostrarRefazer: false };
  }
  return { estado: "DISPONIVEL", rotulo: "Entrar", clicavel: true, mostrarEntrarNormal: true, mostrarRefazer: false };
}

// Apresentação progressiva dos objectives (seção 12/14) — decide só a
// CLASSIFICAÇÃO visual e o texto a mostrar; nunca deriva nada de `id`
// pra um objective futuro (o id em si pode ser o nome de um mecanismo
// e já revelar demais) — futuro é SEMPRE "???", nunca o id, nunca uma
// descrição inventada no cliente.
export type EstadoVisualObjetivo = "CONCLUIDO" | "ATUAL" | "FUTURO";

export function classificarObjetivoVisual(o: Pick<PuzzleObjectivoProgressivoApi, "concluido" | "atual">): EstadoVisualObjetivo {
  if (o.concluido) return "CONCLUIDO";
  if (o.atual) return "ATUAL";
  return "FUTURO";
}

export function textoVisivelDoObjetivo(o: Pick<PuzzleObjectivoProgressivoApi, "concluido" | "atual" | "descricao">): string {
  if (o.concluido || o.atual) return o.descricao ?? "";
  return "???";
}
