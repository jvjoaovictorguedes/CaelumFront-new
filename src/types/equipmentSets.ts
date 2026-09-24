// Sistema de Conjuntos de Equipamentos — tipos do resumo já resolvido
// pelo backend (GET /inventory/v2 -> data.equipmentSets). O frontend só
// formata/ordena visualmente; quem decide contagem/dedup/ativação é
// sempre o servidor (equipmentSetService).
export interface EquipmentSetPieceSummary {
  pieceKey: string;
  itemId: number;
  nome: string | null;
  equipped: boolean;
}

export interface EquipmentSetBonusSummary {
  piecesRequired: number;
  active: boolean;
  stats: Record<string, number>;
  effectKey: string | null;
  descricao: string | null;
}

export interface EquipmentSetSummary {
  id: number;
  key: string;
  nome: string;
  imagemUrl?: string | null;
  equippedPieces: number;
  totalPieces: number;
  pieces: EquipmentSetPieceSummary[];
  bonuses: EquipmentSetBonusSummary[];
}
