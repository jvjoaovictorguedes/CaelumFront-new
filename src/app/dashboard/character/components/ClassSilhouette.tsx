
export default function ClassSilhouette({
  classe,
  stroke = "#F3B43F",
}: {
  classe?: string;
  stroke?: string;
}) {
  const normalizado = (classe ?? "").toLowerCase();
  const ehMago = normalizado.includes("mago") || normalizado.includes("mage");
  const ehGuerreiro = normalizado.includes("guerreiro") || normalizado.includes("warrior");
  const ehCelestial = normalizado.includes("celestial");
return ehMago ? (
  <MagoSilhueta stroke={stroke} />
) : ehGuerreiro ? (
  <GuerreiroSilhueta stroke={stroke} />
) : ehCelestial ? (
  <CelestialSilhueta stroke={stroke} />
) : (
  <PrimordialSilhueta stroke={stroke} />
);
}

function GuerreiroSilhueta({ stroke }: { stroke: string }) {
  return (
      <img src="guerreiro-personagem-itens.webp" alt="Silhueta do Guerreiro" className="h-full w-full" />
  );
}

function MagoSilhueta({ stroke }: { stroke: string }) {
  return (
    <img src="mago-personagem-itens.webp" alt="Silhueta do Mago" className="h-full w-full" />
  );
}

function CelestialSilhueta({ stroke }: { stroke: string }) {
  return (
    <img src="celestial-personagem-itens.webp" alt="Silhueta do Celestial" className="h-full w-full" />
  );
}

function PrimordialSilhueta({ stroke }: { stroke: string }) {
  return (
    <img src="primordial-personagem-itens.webp" alt="Silhueta do Primordial" className="h-full w-full" />
  );
}
