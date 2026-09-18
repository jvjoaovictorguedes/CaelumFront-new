"use client";

import { useState } from "react";
import { getAvatarUrl } from "@/utils/media-url";
import { useCharacter } from "@/contexts/CharacterContext";
import type { CurrentCharacter } from "@/utils/character-session";
import AvatarPickerModal from "./AvatarPickerModal";
import CharacterAttributes from "./CharacterAttributes";
import GenderToggleButton from "./GenderToggleButton";
import PvpStatsCard from "./PvpStatsCard";

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

  const linhasComLabel: { label: string; valor: string | number }[] = [
    { label: "Level", valor: character.nivel },
    { label: "Rank", valor: character.rank ?? "F" },
    { label: "Resets", valor: character.reset ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-black/10 bg-[#3a2f24] p-5 shadow-lg sm:grid-cols-[auto_1fr]">
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

        <div className="flex flex-col gap-2">
          <div className="rounded-lg bg-[#F3B43F]/50 px-4 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/50">Nome</p>
            <p className="font-imFeel text-xl leading-tight">{character.nome}</p>
          </div>
          <div className="rounded-lg bg-[#F3B43F]/50 px-4 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/50">Classe</p>
            <p className="font-imFeel text-lg leading-tight">{character.Class?.nome ?? "—"}</p>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[#F3B43F]/50 px-4 py-2">
            <span className="font-imFeel text-lg">Sexo</span>
            <div className="flex items-center gap-2">
              <span className="font-bold">{character.genero}</span>
              <GenderToggleButton characterId={character.id} generoAtual={character.genero} />
            </div>
          </div>
          {linhasComLabel.map(({ label, valor }) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg bg-[#F3B43F]/50 px-4 py-2"
            >
              <span className="font-imFeel text-lg">{label}</span>
              <span className="font-bold">{valor}</span>
            </div>
          ))}
          <div className="rounded-lg bg-[#F3B43F]/50 px-4 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/50">
              Natureza Mágica
            </p>
            <p className="font-imFeel text-lg leading-tight">{character.natureza_magica ?? "—"}</p>
            <p className="mt-0.5 text-[10px] text-black/50">
              Define as evoluções de habilidade disponíveis na aba Classe
            </p>
          </div>
        </div>
      </div>

      <CharacterAttributes character={character} bonus={bonus} />

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
