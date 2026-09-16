// Silhueta em contorno do personagem (guerreiro/mago), no estilo do mockup
// do Figma: boneco de linha simples, sem preenchimento, pra servir de fundo
// pros slots de equipamento em EquipmentPanel.tsx. Todo em SVG inline — sem
// depender de nenhuma imagem externa.
export default function ClassSilhouette({
  classe,
  stroke = "#F3B43F",
}: {
  classe?: string;
  stroke?: string;
}) {
  const normalizado = (classe ?? "").toLowerCase();
  const ehMago = normalizado.includes("mago") || normalizado.includes("mage");

  return ehMago ? (
    <MagoSilhueta stroke={stroke} />
  ) : (
    <GuerreiroSilhueta stroke={stroke} />
  );
}

function GuerreiroSilhueta({ stroke }: { stroke: string }) {
  return (
    <svg
      viewBox="0 0 300 300"
      className="h-full w-full"
      role="img"
      aria-label="Silhueta do Guerreiro"
    >
      <g fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.55">
        {/* elmo */}
        <path d="M135 18 h30 a15 15 0 0 1 15 15 v14 h-60 v-14 a15 15 0 0 1 15 -15 Z" />
        <path d="M150 18 v29" />
        <path d="M126 47 q24 10 48 0" />
        {/* pescoço e ombros/peitoral */}
        <path d="M138 47 v10 M162 47 v10" />
        <path d="M100 96 q50 -26 100 0 l6 18 h-16 q4 30 -10 46 h-60 q-14 -16 -10 -46 h-16 Z" />
        {/* cinto */}
        <path d="M112 140 h76 v12 h-76 Z" />
        <rect x="140" y="141" width="20" height="10" rx="2" />
        {/* saia de placas */}
        <path d="M108 152 q42 14 84 0 l6 30 q-48 18 -96 0 Z" />
        {/* braços */}
        <path d="M100 96 q-30 6 -38 34 q-4 16 4 30" />
        <path d="M200 96 q30 6 38 34 q4 16 -4 30" />
        <circle cx="66" cy="164" r="9" />
        <circle cx="234" cy="164" r="9" />
        {/* pernas */}
        <path d="M126 182 q-6 40 -4 70 l-4 26 h22 l4 -24 q4 -36 10 -72" />
        <path d="M174 182 q6 40 4 70 l4 26 h-22 l-4 -24 q-4 -36 -10 -72" />
        {/* joelheiras */}
        <path d="M118 224 l16 -8 16 8 -16 8 Z" />
        <path d="M182 224 l-16 -8 -16 8 16 8 Z" />
        {/* botas */}
        <path d="M108 278 h30 l4 -10 h-34 Z" />
        <path d="M192 278 h-30 l-4 -10 h34 Z" />
      </g>
    </svg>
  );
}

function MagoSilhueta({ stroke }: { stroke: string }) {
  return (
    <svg
      viewBox="0 0 300 300"
      className="h-full w-full"
      role="img"
      aria-label="Silhueta do Mago"
    >
      <g fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.55">
        {/* chapeu pontudo */}
        <path d="M150 14 L182 58 H118 Z" />
        <ellipse cx="150" cy="58" rx="34" ry="8" />
        {/* capuz e rosto */}
        <path d="M124 62 q26 -10 52 0 q10 20 -4 40 h-44 q-14 -20 -4 -40 Z" />
        {/* manto (alarga até embaixo) */}
        <path d="M118 100 q32 14 64 0 l24 176 q-56 24 -112 0 Z" />
        {/* cinto */}
        <path d="M120 150 h60 v10 h-60 Z" />
        {/* braco com cajado */}
        <path d="M182 108 q30 10 34 40 l4 60" />
        <line x1="220" y1="70" x2="220" y2="208" />
        <circle cx="220" cy="64" r="9" />
        {/* outro braco */}
        <path d="M118 108 q-26 14 -30 40 q-2 14 6 26" />
        {/* pes */}
        <path d="M126 292 h20 l-4 -18 h-14 Z" />
        <path d="M174 292 h-20 l4 -18 h14 Z" />
      </g>
    </svg>
  );
}
