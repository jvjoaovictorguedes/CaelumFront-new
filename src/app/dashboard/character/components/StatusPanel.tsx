"use client";

import { useState } from "react";
import { getAvatarUrl } from "@/utils/media-url";
import { useCharacter } from "@/contexts/CharacterContext";
import type { CurrentCharacter } from "@/utils/character-session";
import AvatarPickerModal from "./AvatarPickerModal";
import CharacterAttributes from "./CharacterAttributes";
import GenderToggleButton from "./GenderToggleButton";
import PvpStatsCard from "./PvpStatsCard";

function formatarTempoRegen(ms: number) {
  if (ms <= 0) return null;
  const totalMinutos = Math.ceil(ms / 60000);
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  if (horas <= 0) return `${minutos}min`;
  return `${horas}h ${minutos}min`;
}

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

  const vidaMaxima = Math.max(
    character.vida_maxima ?? 30 + character.vitalidade * 6,
    character.vida_atual,
  );
  const tempoRegenTexto = formatarTempoRegen(character.regen_vida_restante_ms ?? 0);

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
          <GenderToggleButton characterId={character.id} generoAtual={character.genero} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="rounded-lg bg-[#F3B43F]/50 px-4 py-2 text-center font-bold">
            {character.nome}
          </div>
          <div className="rounded-lg bg-[#F3B43F]/50 px-4 py-2 text-center font-bold">
            {character.Class?.nome ?? "—"}
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
          <div className="rounded-lg bg-[#F3B43F]/50 px-4 py-2 text-center font-bold">
            {character.natureza_magica ?? "—"}
          </div>
        </div>
      </div>

      <CharacterAttributes character={character} bonus={bonus} />

      <div className="rounded-2xl border border-black/10 bg-[#3a2f24] p-5 shadow-lg">
        <div>
          <div className="mb-1 flex justify-between text-sm font-bold">
            <span>Vida</span>
            <span>
              {character.vida_atual} / {vidaMaxima}
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-black/20">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${Math.min(100, (character.vida_atual / vidaMaxima) * 100)}%` }}
            />
          </div>
          {tempoRegenTexto && (
            <p className="mt-1 text-right text-xs text-white/60">
              Recupera tudo em {tempoRegenTexto}
            </p>
          )}
        </div>
      </div>

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
