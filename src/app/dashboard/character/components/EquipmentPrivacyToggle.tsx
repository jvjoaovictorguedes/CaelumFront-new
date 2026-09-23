"use client";

import { useEffect, useState } from "react";
import { atualizarPerfilProprio, buscarPerfil } from "@/lib/api/profile";

export default function EquipmentPrivacyToggle({ characterId }: { characterId: number }) {
  const [ocultar, setOcultar] = useState<boolean | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;
    buscarPerfil(characterId).then((perfil) => {
      if (cancelado) return;
      if (!perfil) {
        setErro("Não foi possível carregar sua configuração de privacidade.");
        return;
      }
      setOcultar(Boolean(perfil.privacidade?.ocultar_equipamentos));
    });
    return () => {
      cancelado = true;
    };
  }, [characterId]);

  async function alternar() {
    if (ocultar === null || salvando) return;
    const novoValor = !ocultar;
    setSalvando(true);
    setErro("");
    try {
      const perfil = await atualizarPerfilProprio({ ocultar_equipamentos: novoValor });
      setOcultar(Boolean(perfil.privacidade?.ocultar_equipamentos));
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível salvar a configuração.";
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-[#3a2f24] p-5 text-white shadow-lg">
      <p className="font-imFeel text-xl text-[#F3B43F]">Privacidade</p>

      <label className="flex items-center justify-between gap-4">
        <span>
          <span className="block font-bold">Ocultar meus equipamentos</span>
          <span className="block text-xs text-white/60">
            Outros jogadores não verão seus equipamentos no seu perfil. Você continua vendo normalmente.
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(ocultar)}
          onClick={alternar}
          disabled={ocultar === null || salvando}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            ocultar ? "bg-[#F3B43F]" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
              ocultar ? "left-6" : "left-1"
            }`}
          />
        </button>
      </label>

      {erro && <p className="text-sm text-red-400">{erro}</p>}
    </div>
  );
}
