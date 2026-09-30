"use client";

import { useCharacter } from "@/contexts/CharacterContext";

// Cabeçalho da Loja é montado no servidor (page.tsx) e só sabia o saldo
// do momento do carregamento da página — depois de uma compra, ficava
// mostrando o valor antigo até um F5. Lê do mesmo contexto que a
// Sidebar e o ShopCatalog já usam, então acompanha em tempo real.
export default function MoedasAtuais({ inicial }: { inicial: number }) {
  const { character } = useCharacter();
  const moedas = character?.dinheiro ?? inicial;
  return <p className="text-lg font-bold text-[#F3B43F]">Moedas: {moedas}</p>;
}
