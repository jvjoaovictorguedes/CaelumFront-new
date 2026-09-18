// Emblema oficial do jogo — usado em toda tela de "portão" (login,
// registro, recuperação de senha) e no topo do menu do dashboard.
// O ícone-fonte tem fundo branco sólido (não é transparência de
// verdade, só o canal alfa presente sem uso) — por isso vai sempre
// dentro de um badge circular com moldura dourada em vez de solto por
// cima do fundo do jogo: assim o quadrado branco da imagem original
// nunca aparece, e o resultado lê como um emblema de propósito, não
// como um recorte mal encaixado.
import Image from "next/image";

const TAMANHOS = {
  sm: { badge: "h-9 w-9", texto: "text-lg" },
  md: { badge: "h-14 w-14", texto: "text-3xl" },
  lg: { badge: "h-24 w-24", texto: "text-5xl sm:text-6xl" },
} as const;

export function CaelumEmblema({ tamanho = "md" }: { tamanho?: keyof typeof TAMANHOS }) {
  const { badge } = TAMANHOS[tamanho];
  return (
    <div
      className={`${badge} shrink-0 overflow-hidden rounded-full border-2 border-[#F3B43F] bg-white shadow-lg`}
    >
      <Image
        src="/brand/caelum-icon-256.png"
        alt="Emblema de Caelum"
        width={256}
        height={256}
        className="h-full w-full scale-110 object-cover"
        priority
      />
    </div>
  );
}

// Brasão completo (coroa, castelo, espadas cruzadas e a faixa "CAELUM"
// já desenhada na própria arte) — usado nas telas de portão (login,
// registro, recuperação de senha), onde faz sentido um brasão de
// verdade e não só um ícone + texto. Não usar em contextos pequenos/
// repetidos (menu, favicon): é ilustração detalhada, encolhida vira
// borrão — pra esses lugares usa CaelumEmblema (só o escudo) + texto
// HTML de verdade.
// Mobile-first: tela de celular na vertical tem pouca altura sobrando
// depois do teclado/barra do navegador — um brasão de 160px (h-40) OU
// mesmo o "sm" de 96px (h-24) fixos de antes ficavam grandes demais e
// SOBREPUNHAM o título do card abaixo (estava posicionado absolute por
// cima de tudo). Agora ele entra no fluxo normal (empilhado, não mais
// sobreposto — ver login/register/forgot-password/reset-password
// page.tsx) e cresce só a partir de telas maiores.
const TAMANHOS_BRASAO = {
  md: "h-20 sm:h-32 md:h-40 lg:h-56",
  sm: "h-14 sm:h-20 md:h-24 lg:h-32",
} as const;

export function CaelumBrasao({
  tamanho = "md",
  className = "",
}: {
  tamanho?: keyof typeof TAMANHOS_BRASAO;
  className?: string;
}) {
  return (
    <Image
      src="/brand/caelum-crest-web.jpg"
      alt="Brasão de Caelum"
      width={600}
      height={664}
      priority
      className={`w-auto drop-shadow-2xl ${TAMANHOS_BRASAO[tamanho]} ${className}`}
    />
  );
}

// Emblema + nome do jogo, lado a lado — cabeçalho padrão das telas de
// login/registro/recuperação de senha (fora do card, no topo) e do
// menu do dashboard.
export default function CaelumBrand({
  tamanho = "md",
  // "claro": degradê dourado — pro fundo escuro do jogo (login/registro).
  // "escuro": marrom sólido — pro fundo já amarelo/dourado do menu
  // lateral, onde o degradê dourado sobre dourado quase não aparece.
  variante = "claro",
  className = "",
}: {
  tamanho?: keyof typeof TAMANHOS;
  variante?: "claro" | "escuro";
  className?: string;
}) {
  const { texto } = TAMANHOS[tamanho];
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <CaelumEmblema tamanho={tamanho} />
      <span
        className={`font-imFeel ${texto} font-bold ${
          variante === "claro"
            ? "text-transparent bg-gradient-to-b from-[#F3B43F] to-[#8D6825] bg-clip-text"
            : "text-[#4A2F17]"
        }`}
      >
        CAELUM
      </span>
    </div>
  );
}
