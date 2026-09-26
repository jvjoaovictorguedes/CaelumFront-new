"use client";

import { useCallback, useEffect, useState } from "react";
import { useCharacter } from "@/contexts/CharacterContext";
import {
  confirmarDescanso,
  mensagemDeErroTaverna,
  previewDescanso,
  type DescansoPreview,
} from "@/lib/api/tavern";

export default function TavernRestPanel() {
  const { atualizarCharacter } = useCharacter();
  const [preview, setPreview] = useState<DescansoPreview | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [descansando, setDescansando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const dados = await previewDescanso();
      setPreview(dados);
    } catch (error) {
      setErro(mensagemDeErroTaverna(error, "Não foi possível calcular o custo do descanso."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function descansar() {
    setDescansando(true);
    setMensagem("");
    setErro("");
    try {
      const resultado = await confirmarDescanso();
      atualizarCharacter({
        vida_atual: resultado.vida_atual,
        mana_atual: resultado.mana_atual,
        dinheiro: resultado.dinheiro,
      });
      setMensagem(
        resultado.custo_pago > 0
          ? `Você descansou e pagou ${resultado.custo_pago} Gold. HP e Mana estão cheios.`
          : "Você já estava com HP e Mana cheios — nenhuma cobrança feita.",
      );
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroTaverna(error, "Não foi possível descansar agora."));
    } finally {
      setDescansando(false);
    }
  }

  if (carregando) {
    return <p className="text-sm text-white/60">Carregando...</p>;
  }

  if (!preview) {
    return <p className="text-sm text-red-400">{erro || "Não foi possível carregar o descanso."}</p>;
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-5">
      <p className="font-imFeel text-2xl text-[#F3B43F]">Hospedagem</p>

      {erro && <p className="rounded-lg bg-black/40 px-3 py-2 text-sm text-red-400">{erro}</p>}
      {mensagem && <p className="rounded-lg bg-black/40 px-3 py-2 text-sm text-[#F3B43F]">{mensagem}</p>}

      {preview.bloqueado ? (
        <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-300">{preview.motivoBloqueio}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-black/30 p-3">
              <p className="text-white/60">Vida</p>
              <p className="text-lg font-bold text-white">
                {preview.vida_atual} / {preview.vida_maxima}
              </p>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/50">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${Math.round((preview.vida_atual / Math.max(1, preview.vida_maxima)) * 100)}%` }}
                />
              </div>
            </div>
            <div className="rounded-lg bg-black/30 p-3">
              <p className="text-white/60">Mana</p>
              <p className="text-lg font-bold text-white">
                {preview.mana_atual} / {preview.mana_maxima}
              </p>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/50">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${Math.round((preview.mana_atual / Math.max(1, preview.mana_maxima)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-white/70">
              {preview.custo > 0 ? (
                <>
                  Descanso completo: <span className="font-bold text-[#F3B43F]">{preview.custo} Gold</span>
                </>
              ) : (
                "Você já está com HP e Mana cheios."
              )}
            </p>
            <button
              type="button"
              onClick={descansar}
              disabled={descansando || (preview.custo > 0 && !preview.saldo_suficiente)}
              className="shrink-0 rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
            >
              {descansando ? "Descansando..." : "Descansar"}
            </button>
          </div>
          {preview.custo > 0 && !preview.saldo_suficiente && (
            <p className="text-xs text-red-400">Gold insuficiente pra esse descanso.</p>
          )}
        </>
      )}
    </div>
  );
}
