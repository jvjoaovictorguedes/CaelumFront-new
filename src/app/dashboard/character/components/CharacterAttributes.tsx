"use client";

import { ResistanceList } from "@/components/combat-typing/TypingFeedback";
import { useState } from "react";
import axios from "axios";
import axiosInstance from "@/utils/axiosIntance";
import { useCharacter } from "@/contexts/CharacterContext";

// O que cada atributo FAZ de verdade em combate (mesmas regras de
// src/services/combatFormulas.js no backend) — mostrado no tooltip
// (hover/toque) de cada atributo, igual já existe pros status de
// combate em StatusEffectIcons.tsx.
const ATRIBUTOS = [
  {
    label: "Força",
    campo: "forca",
    descricao: "Aumenta o dano do ataque básico e das habilidades que escalam com Força.",
  },
  {
    label: "Vitalidade",
    campo: "vitalidade",
    descricao: "Aumenta sua vida máxima e as habilidades de cura/suporte que escalam com Vitalidade.",
  },
  {
    label: "Agilidade",
    campo: "agilidade",
    descricao:
      "Aumenta sua chance de esquivar de ataques inimigos. Mas a Velocidade do atacante contra-ataca essa esquiva (Precisão) — quanto mais Velocidade ele tiver, menor o efeito da sua Agilidade contra ele.",
  },
  {
    label: "Inteligência",
    campo: "inteligencia",
    descricao: "Aumenta sua mana máxima e o dano/cura das habilidades mágicas (que escalam com Inteligência).",
  },
  {
    label: "Velocidade",
    campo: "velocidade",
    descricao:
      "Decide quem ataca primeiro em duelos PvP. Também dá Precisão: reduz a chance de o alvo esquivar (contra a Agilidade dele) e abre uma chance de ACERTO CRÍTICO (dano ampliado) nos seus ataques e habilidades.",
  },
] as const;

interface BonusAtributos {
  forca: number;
  vitalidade: number;
  agilidade: number;
  inteligencia: number;
  velocidade: number;
}

interface CharacterAttributesProps {
  character: {
    effective_affinities?: import("@/types/contracts/combatTyping").DefensiveAffinity[];
    id: number;
    forca: number;
    vitalidade: number;
    agilidade: number;
    inteligencia: number;
    velocidade: number;
    pontos_distribuir?: number;
  };
  bonus?: BonusAtributos;
}
interface CharacterResponse {
  character: {
    effective_affinities?: import("@/types/contracts/combatTyping").DefensiveAffinity[];
    id: number;
    forca: number;
    vitalidade: number;
    agilidade: number;
    inteligencia: number;
    velocidade: number;
    pontos_distribuir: number;
  };
}

export default function CharacterAttributes({
  character,
  bonus,
}: CharacterAttributesProps) {
  const { character: characterContexto, refreshCharacter } = useCharacter();
  // Bônus de equipamento pode mudar sem essa tela saber (equipar/desequipar
  // acontece na aba ao lado) — lê do contexto compartilhado quando
  // disponível pra não mostrar um (+X) desatualizado.
  const bonusAtual = characterContexto?.bonus_atributos ?? bonus;
  const [atributos, setAtributos] = useState({
    forca: character.forca,
    vitalidade: character.vitalidade,
    agilidade: character.agilidade,
    inteligencia: character.inteligencia,
    velocidade: character.velocidade,
  });

  const [pontos, setPontos] = useState(character.pontos_distribuir ?? 0);
  // Incremento aplicado a cada clique no "+" — padrão 1, mas o jogador
  // pode escolher um atalho maior (ou digitar um valor) pra não precisar
  // clicar centenas de vezes com pontos de reset/evolução acumulados.
  const [incremento, setIncremento] = useState(1);

  const [carregando, setCarregando] = useState(false);

  async function adicionarPonto(campo: keyof typeof atributos) {
    const quantidade = Math.min(Math.max(1, incremento), pontos);
    if (carregando || pontos <= 0 || quantidade <= 0) return;

    setCarregando(true);

    try {
      const response = await axiosInstance.post<CharacterResponse>(
        `/attributes/${character.id}`,
        {
          atributo: campo,
          quantidade,
        },
      );

      const personagemAtualizado = response?.data?.character;

      if (!personagemAtualizado) {
        alert("Resposta inesperada do servidor.");
        return;
      }

      setAtributos({
        forca: personagemAtualizado.forca,
        vitalidade: personagemAtualizado.vitalidade,
        agilidade: personagemAtualizado.agilidade,
        inteligencia: personagemAtualizado.inteligencia,
        velocidade: personagemAtualizado.velocidade,
      });

      setPontos(personagemAtualizado.pontos_distribuir ?? 0);
      // Vitalidade/inteligência alteram vida_maxima/mana_maxima calculados
      // no backend — busca o personagem de novo pra refletir isso em toda
      // a tela na hora, sem precisar trocar de aba.
      refreshCharacter();
    } catch (error: unknown) {
      console.error("Erro ao distribuir ponto:", error);

      const mensagem = axios.isAxiosError<{ message?: string }>(error)
        ? (error.response?.data?.message ??
          "Não foi possível distribuir o ponto.")
        : "Não foi possível distribuir o ponto.";

      alert(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  async function distribuirAleatoriamente() {
    if (carregando || pontos <= 0) return;

    setCarregando(true);

    try {
      const response = await axiosInstance.post<CharacterResponse>(
        `/attributes/${character.id}/random`,
      );

      const personagemAtualizado = response?.data?.character;

      if (!personagemAtualizado) {
        alert("Resposta inesperada do servidor.");
        return;
      }

      setAtributos({
        forca: personagemAtualizado.forca,
        vitalidade: personagemAtualizado.vitalidade,
        agilidade: personagemAtualizado.agilidade,
        inteligencia: personagemAtualizado.inteligencia,
        velocidade: personagemAtualizado.velocidade,
      });

      setPontos(personagemAtualizado.pontos_distribuir ?? 0);
      refreshCharacter();
    } catch (error: unknown) {
      console.error("Erro ao distribuir pontos aleatoriamente:", error);

      const mensagem = axios.isAxiosError<{ message?: string }>(error)
        ? (error.response?.data?.message ??
          "Não foi possível distribuir os pontos.")
        : "Não foi possível distribuir os pontos.";

      alert(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  const ATALHOS_INCREMENTO = [1, 10, 50, 100];

  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-black/10 bg-[#3a2f24] p-5 shadow-lg sm:grid-cols-2">
      <div className="sm:col-span-2"><ResistanceList values={character.effective_affinities}/></div>
      <div className="sm:col-span-2 flex flex-wrap items-center gap-2 rounded-lg bg-[#F3B43F]/30 p-3">
        <span className="text-sm font-bold text-white/80">Cada &ldquo;+&rdquo; adiciona:</span>
        {ATALHOS_INCREMENTO.map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => setIncremento(valor)}
            className={`rounded-lg px-3 py-1 text-sm font-bold transition ${
              incremento === valor
                ? "bg-[#BC8418] text-black"
                : "bg-black/20 text-white/70 hover:bg-black/30"
            }`}
          >
            +{valor}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIncremento(Math.max(1, pontos))}
          className={`rounded-lg px-3 py-1 text-sm font-bold transition ${
            incremento === Math.max(1, pontos) && pontos > 0
              ? "bg-[#BC8418] text-black"
              : "bg-black/20 text-white/70 hover:bg-black/30"
          }`}
        >
          Tudo ({pontos})
        </button>
        <input
          type="number"
          min={1}
          max={Math.max(1, pontos)}
          value={incremento}
          onChange={(e) => setIncremento(Math.max(1, Number(e.target.value) || 1))}
          className="w-20 rounded-lg bg-black/30 px-2 py-1 text-sm text-white"
          aria-label="Quantidade personalizada por clique"
        />
      </div>

      {ATRIBUTOS.map(({ label, campo, descricao }) => (
        <div
          key={campo}
          className="flex items-center justify-between gap-3 rounded-lg bg-[#F3B43F]/50 p-3"
        >
          <div className="min-w-0">
            <span className="font-imFeel text-xl cursor-help underline decoration-dotted underline-offset-4" title={descricao}>
              {label}
            </span>{" "}
            <span className="font-bold text-xl">{atributos[campo]}</span>
            {bonusAtual && bonusAtual[campo] > 0 && (
              <span className="ml-1 text-sm font-bold text-green-600">
                (+{bonusAtual[campo]})
              </span>
            )}
            <p className="mt-0.5 text-[10px] leading-tight text-black/60">{descricao}</p>
          </div>

          <button
            type="button"
            onClick={() => adicionarPonto(campo)}
            disabled={carregando || pontos <= 0}
            title={`Adicionar ${Math.min(Math.max(1, incremento), Math.max(1, pontos))} ponto(s)`}
            className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg bg-[#BC8418] px-2 text-base font-bold text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-40"
          >
            +{Math.min(Math.max(1, incremento), Math.max(1, pontos))}
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between gap-3 rounded-lg bg-[#F3B43F]/50 p-3">
        <span className="font-imFeel text-xl">Pontos para distribuir</span>

        <span className="font-bold text-xl">{pontos}</span>
      </div>

      <div className="sm:col-span-2">
        <button
          type="button"
          onClick={distribuirAleatoriamente}
          disabled={carregando || pontos <= 0}
          className="w-full rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          Distribuir aleatoriamente
        </button>
      </div>
    </div>
  );
}