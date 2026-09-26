"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import axiosInstance from "@/utils/axiosIntance";
import { AVATAR_CATALOGO, resolveMediaUrl } from "@/utils/media-url";

interface OpcaoAvatar {
  chave: string;
  rotulo: string;
  src: string;
}

export default function AvatarPickerModal({
  characterId,
  avatarAtual,
  onFechar,
}: {
  characterId: number;
  avatarAtual?: string | null;
  onFechar: () => void;
}) {
  const router = useRouter();
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [opcoes, setOpcoes] = useState<OpcaoAvatar[] | null>(null);

  // Busca no servidor QUAIS avatares esse personagem específico pode
  // escolher (raças base sempre livres + guerreiro/mago/celestial só se
  // ele É de fato daquela classe/raça + extras do admin já filtrados) —
  // nunca confiar só na validação do PATCH: sem isso o jogador via (e
  // clicava em) opções que o servidor recusava na hora de salvar.
  useEffect(() => {
    let cancelado = false;
    axiosInstance
      .get<{ data: { estaticos: string[]; admin: { chave: string; src: string }[] } }>(
        `/characters/${characterId}/avatares-disponiveis`,
      )
      .then((resposta) => {
        if (cancelado) return;
        const { estaticos, admin } = resposta.data.data;
        const estaticosResolvidos = AVATAR_CATALOGO.filter((a) => estaticos.includes(a.chave));
        const adminResolvidos = admin.map((a) => ({
          chave: a.chave,
          rotulo: a.chave,
          src: resolveMediaUrl(a.src) ?? a.src,
        }));
        setOpcoes([...estaticosResolvidos, ...adminResolvidos]);
      })
      .catch(() => {
        if (!cancelado) setErro("Não foi possível carregar os avatares disponíveis.");
      });
    return () => {
      cancelado = true;
    };
  }, [characterId]);

  async function escolher(chave: string) {
    if (salvando) return;
    setSalvando(chave);
    setErro("");
    try {
      await axiosInstance.patch(`/characters/${characterId}`, { avatar_key: chave });
      router.refresh();
      onFechar();
    } catch (error: unknown) {
      const mensagem = axios.isAxiosError<{ message?: string }>(error)
        ? (error.response?.data?.message ?? "Não foi possível trocar o avatar.")
        : "Não foi possível trocar o avatar.";
      setErro(mensagem);
    } finally {
      setSalvando(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={onFechar}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-imFeel text-2xl">Escolher avatar</h2>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
          >
            Fechar
          </button>
        </div>

        {erro && (
          <p className="mb-3 rounded-lg bg-red-900/40 p-2 text-sm text-red-200">{erro}</p>
        )}

        {opcoes === null && !erro && <p className="text-sm text-white/50">Carregando avatares...</p>}

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {(opcoes ?? []).map(({ chave, rotulo, src }) => (
            <button
              key={chave}
              type="button"
              onClick={() => escolher(chave)}
              disabled={salvando !== null}
              className={`group flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition disabled:opacity-50 ${
                avatarAtual === chave
                  ? "border-[#F3B43F] bg-[#F3B43F]/10"
                  : "border-white/10 hover:border-[#F3B43F]/60"
              }`}
            >
              <div
                className="h-16 w-16 rounded-full bg-[#3a2f24] bg-cover bg-center"
                style={{ backgroundImage: `url('${src}')` }}
              />
              <span className="text-[11px] font-bold text-white/80 group-hover:text-white">
                {salvando === chave ? "..." : rotulo}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
