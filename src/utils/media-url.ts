const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const apiOrigin = new URL(apiBaseUrl).origin;

const localRaceImages: Record<string, { male: string; female: string }> = {
  humano: { male: "/images/human.webp", female: "/images/female-human.webp" },
  humana: { male: "/images/human.webp", female: "/images/female-human.webp" },
  elfo: { male: "/images/elf.webp", female: "/images/female-elf.webp" },
  elfa: { male: "/images/elf.webp", female: "/images/female-elf.webp" },
  anao: { male: "/images/dwarf.png", female: "/images/female-dwarf.webp" },
  orc: { male: "/images/orc.png", female: "/images/female-orc.webp" },
  orca: { male: "/images/orc.png", female: "/images/female-orc.webp" },
  celestial: {
    male: "/images/celestial.webp",
    female: "/images/celestial.webp",
  },
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function resolveMediaUrl(value?: string | null) {
  if (!value) return undefined;
  if (value.startsWith("/images/") || value.startsWith("/icons/")) {
    return value;
  }

  try {
    const url = new URL(value, apiOrigin);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      url.protocol = new URL(apiBaseUrl).protocol;
      url.host = new URL(apiBaseUrl).host;
    }
    return url.toString();
  } catch {
    return value;
  }
}

export function getRaceImage(
  name: string | undefined,
  gender: "Masculino" | "feminino",
  imageUrl?: string | null,
) {
  const normalizedName = name ? normalize(name) : "";
  const race = Object.entries(localRaceImages).find(([raceName]) =>
    normalizedName.includes(raceName),
  )?.[1];
  const localImage = race?.[gender === "Masculino" ? "male" : "female"];
  return localImage ?? resolveMediaUrl(imageUrl);
}

// Avatar de perfil escolhido pelo jogador (ver AVATARES_VALIDOS em
// characterController.js, no backend — as duas listas de chaves
// precisam ficar em sincronia). Todo mundo reaproveita arte que já
// existia no jogo (ilustrações de raça/classe + algumas extras que já
// estavam em public/images sem uso nenhum), então não precisa de
// upload nem de uma URL arbitrária vinda do personagem.
export const AVATAR_CATALOGO: { chave: string; rotulo: string; src: string }[] = [
  { chave: "guerreiro", rotulo: "Guerreiro", src: "/images/guerreiro-lutador.jpg" },
  { chave: "mago", rotulo: "Mago", src: "/images/sprites/mago-sprite-teste.png" },
  { chave: "humano", rotulo: "Humano", src: "/images/human.webp" },
  { chave: "humana", rotulo: "Humana", src: "/images/female-human.webp" },
  { chave: "elfo", rotulo: "Elfo", src: "/images/elf.webp" },
  { chave: "elfa", rotulo: "Elfa", src: "/images/female-elf.webp" },
  { chave: "anao", rotulo: "Anão", src: "/images/dwarf.png" },
  { chave: "ana", rotulo: "Anã", src: "/images/female-dwarf.webp" },
  { chave: "orc", rotulo: "Orc", src: "/images/orc.png" },
  { chave: "orca", rotulo: "Orca", src: "/images/female-orc.webp" },
  { chave: "celestial", rotulo: "Celestial", src: "/images/celestial.webp" },
  { chave: "minotauro", rotulo: "Minotauro", src: "/images/minotauro.jpg" },
  { chave: "dragao", rotulo: "Dragão", src: "/images/dragon.webp" },
  { chave: "guardiao_celeste", rotulo: "Guardião Celeste", src: "/images/heavenly.webp" },
];

export function getAvatarUrl(avatarKey?: string | null) {
  if (!avatarKey) return undefined;
  return AVATAR_CATALOGO.find((avatar) => avatar.chave === avatarKey)?.src;
}

// Ilustração de corpo inteiro (guerreiro/mago) usada no avatar do menu
// lateral — mesmo critério de normalização usado em getClassImage/
// spriteForClass, só que apontando pras artes de personagem completas em
// vez do ícone pequeno de seleção de classe.
export function getClassPortrait(name: string | undefined) {
  const normalizedName = name ? normalize(name) : "";
  if (normalizedName.includes("mago") || normalizedName.includes("mage")) {
    // Sprite de teste (pedido do jogador) no lugar da ilustração
    // pintada de sempre — public/images/mago-lutador.jpg continua no
    // disco pra reverter fácil se o teste não agradar.
    return "/images/sprites/mago-sprite-teste.png";
  }
  return "/images/guerreiro-lutador.jpg";
}

// Fundo "boneco de papel" da tela de equipamentos (public/CharacterBackground)
// — mesmo critério de normalização de getClassImage, com "primordial" como
// fallback pra qualquer classe/linhagem que ainda não tenha arte própria.
export function getClassBackground(name: string | undefined) {
  const normalizedName = name ? normalize(name) : "";
  if (normalizedName.includes("mago") || normalizedName.includes("mage")) {
    return "/CharacterBackground/mago-personagem-itens.webp";
  }
  if (
    normalizedName.includes("guerreiro") ||
    normalizedName.includes("guerreira") ||
    normalizedName.includes("warrior")
  ) {
    return "/CharacterBackground/guerreiro-personagem-itens.webp";
  }
  if (normalizedName.includes("celestial")) {
    return "/CharacterBackground/celestial-personagem-itens.webp";
  }
  return "/CharacterBackground/primordial-personagem-itens.webp";
}

export function getClassImage(
  name: string | undefined,
  imageUrl?: string | null,
) {
  const normalizedName = name ? normalize(name) : "";
  if (normalizedName.includes("mago") || normalizedName.includes("mage")) {
    return "/images/mage.webp";
  }
  if (
    normalizedName.includes("guerreiro") ||
    normalizedName.includes("guerreira") ||
    normalizedName.includes("warrior")
  ) {
    return "/images/warrior.webp";
  }
  return resolveMediaUrl(imageUrl) ?? "/images/primordial.webp";
}
