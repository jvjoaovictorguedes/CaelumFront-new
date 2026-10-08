import type { PayloadPowerAdmin } from "@/lib/api/admin/powers";

export const TIPOS_PODER = ["Ativo", "Passivo"] as const;
export const ATRIBUTOS = ["Forca", "Vitalidade", "Agilidade", "Inteligencia", "Velocidade"] as const;
export const TARGETS = ["Self", "Enemy"] as const;
export function formularioPowerVazio(): PayloadPowerAdmin {
  return {
    nome: "",
    descricao: "",
    tipo_poder: "Ativo",
    custo_mana: 0,
    dano_base: 0,
    cura_base: 0,
    cooldown: null,
    escala_atributo: "Forca",
    valor_escala: 0,
    imagem_url: "",
    usage_scope: "CHARACTER",
  };
}
