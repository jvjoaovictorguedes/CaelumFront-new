// Organização de itens (sugestão de jogador — Yasuke) — critério
// compartilhado pelas 3 abas do Inventário (Equipamentos/Materiais/
// Consumíveis), pra não reimplementar a mesma lógica 3 vezes e manter
// o comportamento idêntico entre elas. Só ordena o array já carregado
// (client-side) — o inventário de um personagem tem dezenas de linhas,
// não milhares, então não precisa de parâmetro novo no backend nem
// paginação (confirmado: GET /character-inventory já traz tudo de uma
// vez, sem limit/offset).
export const ORDEM_RARIDADE: Record<string, number> = {
  Comum: 0,
  Incomum: 1,
  Raro: 2,
  Epico: 3,
  Lendario: 4,
  Mitico: 5,
};

export type CriterioOrdenacaoInventario = "raridade" | "nome" | "tipo" | "quantidade";

export const OPCOES_ORDENACAO: { valor: CriterioOrdenacaoInventario; rotulo: string }[] = [
  { valor: "raridade", rotulo: "Raridade (maior primeiro)" },
  { valor: "nome", rotulo: "Nome (A-Z)" },
  { valor: "tipo", rotulo: "Tipo" },
  { valor: "quantidade", rotulo: "Quantidade (maior primeiro)" },
];

interface ItemOrdenavel {
  Item: { nome: string; tipo_item: string; raridade: string };
  quantidade?: number;
}

// Nunca muta o array recebido — quem chama é dono do estado original.
export function ordenarInventario<T extends ItemOrdenavel>(
  itens: T[],
  criterio: CriterioOrdenacaoInventario,
): T[] {
  const copia = [...itens];
  copia.sort((a, b) => {
    switch (criterio) {
      case "raridade": {
        const diff = (ORDEM_RARIDADE[b.Item.raridade] ?? 0) - (ORDEM_RARIDADE[a.Item.raridade] ?? 0);
        return diff !== 0 ? diff : a.Item.nome.localeCompare(b.Item.nome, "pt-BR");
      }
      case "tipo": {
        const diff = a.Item.tipo_item.localeCompare(b.Item.tipo_item, "pt-BR");
        return diff !== 0 ? diff : a.Item.nome.localeCompare(b.Item.nome, "pt-BR");
      }
      case "quantidade": {
        const diff = (b.quantidade ?? 0) - (a.quantidade ?? 0);
        return diff !== 0 ? diff : a.Item.nome.localeCompare(b.Item.nome, "pt-BR");
      }
      case "nome":
      default:
        return a.Item.nome.localeCompare(b.Item.nome, "pt-BR");
    }
  });
  return copia;
}
