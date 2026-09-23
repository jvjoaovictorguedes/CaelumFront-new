// Fila: "equipamentos iguais precisam ser reagrupados em quantidades
// pra não ficar poluído" — cada cópia de equipamento vive como sua
// própria instância no banco (Inventário v2, refinamento por cópia),
// então sem isso, 30 espadas idênticas (todas +0) viravam 30 cards
// idênticos na tela. Agrupamento é só de EXIBIÇÃO: nunca muda o dado
// (cada instância continua existindo à parte), só decide como juntar
// visualmente. Duas instâncias só entram no MESMO grupo quando item E
// refinamento são idênticos — um equipamento refinado nunca se mistura
// com um sem refino, nem com outro refinamento diferente do dele.
export interface GrupoInstancias<T> {
  // Uma instância "modelo" do grupo — mesmo nome/raridade/imagem/
  // refinamento de qualquer outra do grupo (são indistinguíveis), só
  // serve pra exibição.
  representante: T;
  quantidade: number;
  // Todos os ids reais do grupo — a ação (equipar, refinar, etc.)
  // sempre atua sobre UM instância concreta (`ids[0]` é a convenção
  // usada em toda a UI): como as cópias são idênticas até a ação
  // acontecer, não importa qual delas é escolhida.
  ids: number[];
}

// `chaveExtra` opcional: outras propriedades que também precisam
// distinguir dois exemplares (ex.: uma instância equipada nunca deveria
// se misturar visualmente com cópias soltas do mesmo item/refinamento
// — ver uso em RefinementPanel.tsx).
export function agruparInstancias<T extends { id: number; id_item: number; refinamento: number }>(
  instancias: T[],
  chaveExtra?: (instancia: T) => string,
): GrupoInstancias<T>[] {
  const grupos = new Map<string, GrupoInstancias<T>>();
  for (const instancia of instancias) {
    const chave = `${instancia.id_item}:${instancia.refinamento}${chaveExtra ? `:${chaveExtra(instancia)}` : ""}`;
    const existente = grupos.get(chave);
    if (existente) {
      existente.quantidade += 1;
      existente.ids.push(instancia.id);
    } else {
      grupos.set(chave, { representante: instancia, quantidade: 1, ids: [instancia.id] });
    }
  }
  return [...grupos.values()];
}
