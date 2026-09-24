"use client";

import { useEffect, useState } from "react";
import { getAvatarUrl } from "@/utils/media-url";
import { useCharacter } from "@/contexts/CharacterContext";
import type { CurrentCharacter } from "@/utils/character-session";
import { buscarMeuPoder } from "@/lib/api/profile";
import AvatarPickerModal from "./AvatarPickerModal";
import CharacterAttributes from "./CharacterAttributes";
import GenderToggleButton from "./GenderToggleButton";
import PvpStatsCard from "./PvpStatsCard";
import AdventureGuildProfileCard from "./AdventureGuildProfileCard";

export default function StatusPanel({
  character: characterInicial,
  bonus,
  imagemPadrao,
}: {
  character: CurrentCharacter;
  bonus?: {
    forca: number;
    vitalidade: number;
    agilidade: number;
    inteligencia: number;
    velocidade: number;
  };
  imagemPadrao?: string;
}) {
  const { character: characterContexto } = useCharacter();
  const character = characterContexto ?? characterInicial;
  const [pickerAberto, setPickerAberto] = useState(false);
  const [poder, setPoder] = useState<number | null>(null);

  // Recalcula sempre que o contexto do personagem muda (equipar,
  // distribuir pontos, subir de nível já chamam refreshCharacter).
  useEffect(() => {
    let cancelado = false;
    buscarMeuPoder().then((dados) => {
      if (!cancelado) setPoder(dados?.total ?? null);
    });
    return () => {
      cancelado = true;
    };
  }, [character]);

  // Uma linha só de estilo pra identidade inteira: label pequeno e
  // discreto à esquerda, valor em destaque à direita — igual em todos
  // os campos (antes Nome/Classe/Natureza Mágica ficavam centralizados
  // empilhados e Sexo/Level/Rank/Resets em linha, o que deixava o bloco
  // sem um padrão único).
  const linhasComLabel: { label: string; valor: string | number }[] = [
    { label: "Nome", valor: character.nome },
    { label: "Classe", valor: character.Class?.nome ?? "—" },
    { label: "Level", valor: character.nivel },
    { label: "Rank", valor: character.rank ?? "F" },
    { label: "Resets", valor: character.reset ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Bloco central: avatar à esquerda, identidade no centro e os
          atributos à direita no desktop; tudo empilhado no mobile, sem
          perder a ordem de leitura. Atributos ganham mais espaço que a
          identidade (que é só texto curto) pra não ficar espremido. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(20rem,26rem)_1fr]">
      <div className="grid min-w-0 grid-cols-1 gap-4 rounded-2xl border border-black/10 bg-[#3a2f24] p-5 shadow-lg sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-2">
          <div
            className="h-24 w-24 rounded-full border-4 border-[#F3B43F] bg-[#292018] bg-cover bg-center"
            style={{
              backgroundImage: `url('${getAvatarUrl(character.avatar_key) ?? imagemPadrao ?? ""}')`,
            }}
          />
          <button
            type="button"
            onClick={() => setPickerAberto(true)}
            className="text-xs font-bold text-[#F3B43F] underline decoration-dotted underline-offset-2 hover:text-[#dfa234]"
          >
            Alterar avatar
          </button>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border-2 border-[#F3B43F] bg-[#292018] px-4 py-2 text-[#F3B43F]">
            <span className="shrink-0 font-imFeel text-lg">Poder</span>
            <span className="font-imFeel text-2xl leading-none">
              {poder === null ? "—" : poder.toLocaleString("pt-BR")}
            </span>
          </div>
          {linhasComLabel.map(({ label, valor }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 rounded-lg bg-[#F3B43F]/50 px-4 py-2"
            >
              <span className="shrink-0 font-imFeel text-lg">{label}</span>
              <span className="min-w-0 truncate text-right font-bold" title={String(valor)}>
                {valor}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 rounded-lg bg-[#F3B43F]/50 px-4 py-2">
            <span className="shrink-0 font-imFeel text-lg">Sexo</span>
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-bold">{character.genero}</span>
              <GenderToggleButton characterId={character.id} generoAtual={character.genero} />
            </div>
          </div>
          <div className="rounded-lg bg-[#F3B43F]/50 px-4 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="shrink-0 font-imFeel text-lg">Natureza Mágica</span>
              <span
                className="min-w-0 truncate text-right font-bold"
                title={character.natureza_magica ?? undefined}
              >
                {character.natureza_magica ?? "—"}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-black/50">
              Define as evoluções de habilidade disponíveis na aba Classe
            </p>
          </div>
        </div>
      </div>

      <CharacterAttributes character={character} bonus={bonus} />
      </div>

      {/* Card próprio da Guilda dos Aventureiros (Rank + Reputação
          Comercial + Reputação de Caçador) — ver Caçadas §12, nunca
          espalhado como mais linhas no bloco de identidade acima. */}
      <AdventureGuildProfileCard character={character} />

      {/* Rodapé do Status: competitivo (Elo) + troféus de torneio. */}
      <PvpStatsCard characterId={character.id} />

      {pickerAberto && (
        <AvatarPickerModal
          characterId={character.id}
          avatarAtual={character.avatar_key}
          onFechar={() => setPickerAberto(false)}
        />
      )}
    </div>
  );
}
