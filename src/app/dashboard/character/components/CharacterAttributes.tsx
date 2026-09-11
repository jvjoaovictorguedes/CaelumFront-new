"use client";

import { useState } from "react";
import axios from "axios";
import axiosInstance from "@/utils/axiosIntance";

const ATRIBUTOS = [
  { label: "Força", campo: "forca" },
  { label: "Vitalidade", campo: "vitalidade" },
  { label: "Agilidade", campo: "agilidade" },
  { label: "Inteligência", campo: "inteligencia" },
  { label: "Velocidade", campo: "velocidade" },
] as const;

interface CharacterAttributesProps {
  character: {
    id: number;
    forca: number;
    vitalidade: number;
    agilidade: number;
    inteligencia: number;
    velocidade: number;
    pontos_distribuir?: number;
  };
}
interface CharacterResponse {
  character: {
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
}: CharacterAttributesProps) {
  const [atributos, setAtributos] = useState({
    forca: character.forca,
    vitalidade: character.vitalidade,
    agilidade: character.agilidade,
    inteligencia: character.inteligencia,
    velocidade: character.velocidade,
  });

  const [pontos, setPontos] = useState(character.pontos_distribuir ?? 0);

  const [carregando, setCarregando] = useState(false);

  async function adicionarPonto(campo: keyof typeof atributos) {
    if (carregando || pontos <= 0) return;

    setCarregando(true);

    try {
      const response = await axiosInstance.post<CharacterResponse>(
        `/attributes/${character.id}`,
        {
          atributo: campo,
          quantidade: 1,
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

  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-black/10 bg-[#3a2f24] p-5 shadow-lg sm:grid-cols-2">
      {ATRIBUTOS.map(({ label, campo }) => (
        <div
          key={campo}
          className="bg-[#F3B43F]/50 rounded-lg p-3 flex justify-between items-center"
        >
          <div>
            <span className="font-imFeel text-xl mr-2">{label}</span>

            <span className="font-bold text-xl">{atributos[campo]}</span>
          </div>

          <button
            type="button"
            onClick={() => adicionarPonto(campo)}
            disabled={carregando || pontos <= 0}
            className="rounded-lg bg-[#BC8418] px-3 py-1 text-xl font-bold text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
      ))}

      <div className="col-span-2 flex flex-col gap-3 rounded-lg bg-[#F3B43F]/50 p-3 sm:col-span-1">
        <div className="flex items-center justify-between">
          <span className="font-imFeel text-xl">Pontos para distribuir</span>

          <span className="font-bold text-xl">{pontos}</span>
        </div>

        <button
          type="button"
          onClick={distribuirAleatoriamente}
          disabled={carregando || pontos <= 0}
          className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Distribuir aleatoriamente
        </button>
      </div>
    </div>
  );
}