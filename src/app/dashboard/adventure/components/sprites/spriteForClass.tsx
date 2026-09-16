import PlayerSprite from "./PlayerSprite";
import MageSprite from "./MageSprite";

// Mesmo critério usado em media-url.ts (getClassImage): olha o nome da
// classe pra decidir a silhueta. Guerreiro é o padrão pra qualquer
// classe que não seja reconhecida.
export function spriteForClass(nomeClasse?: string) {
  const nome = (nomeClasse ?? "").toLowerCase();
  if (nome.includes("mago") || nome.includes("mage")) {
    return MageSprite;
  }
  return PlayerSprite;
}
