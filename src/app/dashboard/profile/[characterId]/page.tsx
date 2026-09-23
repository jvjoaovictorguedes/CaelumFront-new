"use client";

// Perfil de Jogador — página pública/própria (Especificação Perfil de
// Jogador §4/§42/§60 Fase 1-5). Componentes menores por bloco (Hero,
// Equipamentos, Progressão, PvP, Bestiário, Conquistas) — nada de
// página monolítica.
import { use, useEffect, useState } from "react";
import { buscarPerfil, type PerfilJogador } from "@/lib/api/profile";
import AdventurerHero from "../components/AdventurerHero";
import PublicEquipmentPanel from "../components/PublicEquipmentPanel";
import ProgressionSummary from "../components/ProgressionSummary";
import PvpProfileSummary from "../components/PvpProfileSummary";
import BestiaryProfileSummary from "../components/BestiaryProfileSummary";
import AchievementShowcase from "../components/AchievementShowcase";
import ProfileEditModal from "../components/ProfileEditModal";

const ABAS = [
  { id: "visao_geral", label: "Visão Geral" },
  { id: "equipamentos", label: "Equipamentos" },
  { id: "progressao", label: "Progressão" },
  { id: "conquistas", label: "Conquistas" },
] as const;

type AbaId = (typeof ABAS)[number]["id"];

export default function ProfilePage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = use(params);
  const idPersonagem = Number.parseInt(characterId, 10);

  const [perfil, setPerfil] = useState<PerfilJogador | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [aba, setAba] = useState<AbaId>("visao_geral");
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(idPersonagem)) {
      setNaoEncontrado(true);
      setCarregando(false);
      return;
    }
    let cancelado = false;
    setCarregando(true);
    buscarPerfil(idPersonagem).then((dados) => {
      if (cancelado) return;
      if (!dados) {
        setNaoEncontrado(true);
      } else {
        setPerfil(dados);
      }
      setCarregando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [idPersonagem]);

  if (carregando) {
    return (
      <div className="flex h-full items-center justify-center text-white/60">
        Carregando ficha do aventureiro...
      </div>
    );
  }

  if (naoEncontrado || !perfil) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-white/70">
        <p className="font-imFeel text-2xl text-[#F3B43F]">Aventureiro não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-2 sm:p-4">
      <AdventurerHero perfil={perfil} />

      {perfil.permissions.eh_proprio && (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="self-end rounded-lg border-2 border-[#F3B43F]/60 px-4 py-1.5 text-sm font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10"
        >
          Editar Perfil
        </button>
      )}

      {!perfil.permissions.eh_proprio && (
        <div className="flex flex-wrap justify-center gap-2">
          {perfil.permissions.pode_enviar_mensagem && (
            <span className="rounded-lg border-2 border-white/20 px-4 py-1.5 text-sm font-bold text-white/60">
              Enviar Mensagem
            </span>
          )}
          {perfil.permissions.pode_convidar_party && (
            <span className="rounded-lg border-2 border-white/20 px-4 py-1.5 text-sm font-bold text-white/60">
              Convidar pra Party
            </span>
          )}
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-xl border-2 border-[#F3B43F]/40 bg-[#292018]/70 p-1">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setAba(item.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold transition ${
              aba === item.id ? "bg-[#F3B43F] text-black" : "text-white/70 hover:bg-white/10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Cada bloco aparece numa aba só — Progressão e Conquistas ficam
          nas próprias abas em vez de repetir na Visão Geral. */}
      {aba === "visao_geral" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PvpProfileSummary pvp={perfil.pvp} />
          <BestiaryProfileSummary bestiary={perfil.bestiary} monstrosFavoritos={perfil.highlights.monstros} />
        </div>
      )}

      {aba === "equipamentos" && (
        <PublicEquipmentPanel
          equipment={perfil.equipment}
          classe={perfil.identity.classe}
          oculto={perfil.equipment_oculto}
        />
      )}

      {aba === "progressao" && <ProgressionSummary progression={perfil.progression} />}

      {aba === "conquistas" && (
        <AchievementShowcase achievements={perfil.achievements} destaques={perfil.highlights.conquistas} />
      )}

      {editando && (
        <ProfileEditModal perfil={perfil} onFechar={() => setEditando(false)} onSalvo={(novo) => setPerfil(novo)} />
      )}
    </div>
  );
}
