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
  const resolved = resolveMediaUrl(imageUrl);
  if (resolved) return resolved;

  const race = name ? localRaceImages[normalize(name)] : undefined;
  return race?.[gender === "Masculino" ? "male" : "female"];
}

export function getClassImage(
  name: string | undefined,
  imageUrl?: string | null,
) {
  const resolved = resolveMediaUrl(imageUrl);
  if (resolved) return resolved;

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
  return "/images/primordial.webp";
}
