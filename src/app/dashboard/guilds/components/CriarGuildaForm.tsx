"use client";

import { useState } from "react";
import axiosInstance from "@/utils/axiosIntance";

const NIVEL_MINIMO = 10;
const CUSTO = 1000;

export default function CriarGuildaForm({
  characterId,
  characterNivel,
  characterDinheiro,
  onCriada,
}: {
  characterId: number;
  characterNivel: number;
  characterDinheiro: number;
  onCriada: () => void;
}) {
  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoRecrutamento, setTipoRecrutamento] = useState("Aprovacao");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const elegivel = characterNivel >= NIVEL_MINIMO && characterDinheiro >= CUSTO;

  async function criar(event: React.FormEvent) {
    event.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await axiosInstance.post("/guilds", {
        id_personagem: characterId,
        nome,
        sigla,
        descricao: descricao || undefined,
        tipo_recrutamento: tipoRecrutamento,
      });
      onCriada();
    } catch (error) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Não foi possível criar a guilda.";
      setErro(msg);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-1 text-sm uppercase tracking-widest text-[#F3B43F]">Fundar uma guilda</p>
      <p className="mb-4 text-xs text-white/50">
        Requer nível {NIVEL_MINIMO}+ e {CUSTO} de ouro.{" "}
        {!elegivel && (
          <span className="text-red-400">
            Você {characterNivel < NIVEL_MINIMO ? `precisa ser nível ${NIVEL_MINIMO}` : "não tem ouro suficiente"} para fundar uma guilda agora.
          </span>
        )}
      </p>

      <form onSubmit={criar} className="grid gap-3 sm:grid-cols-2">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome da guilda (3-24 caracteres)"
          maxLength={24}
          minLength={3}
          required
          disabled={!elegivel}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#F3B43F] disabled:opacity-50"
        />
        <input
          value={sigla}
          onChange={(e) => setSigla(e.target.value.toUpperCase())}
          placeholder="Sigla (2-5 caracteres)"
          maxLength={5}
          minLength={2}
          required
          disabled={!elegivel}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#F3B43F] disabled:opacity-50"
        />
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição pública (opcional)"
          maxLength={500}
          disabled={!elegivel}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#F3B43F] disabled:opacity-50 sm:col-span-2"
          rows={2}
        />
        <select
          value={tipoRecrutamento}
          onChange={(e) => setTipoRecrutamento(e.target.value)}
          disabled={!elegivel}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#F3B43F] disabled:opacity-50"
        >
          <option value="Aberto">Recrutamento aberto</option>
          <option value="Aprovacao">Por aprovação</option>
          <option value="Convite">Só por convite</option>
        </select>
        <button
          type="submit"
          disabled={!elegivel || enviando}
          className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? "Fundando..." : `Fundar guilda (${CUSTO} ouro)`}
        </button>
      </form>

      {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}
    </div>
  );
}
