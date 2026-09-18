"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";
import { useCharacter } from "@/contexts/CharacterContext";

const MAX_SLOTS = 5;

interface PoderApi {
  id_power: number;
  nome: string;
  tipo_poder: "Ativo" | "Passivo";
  imagem_url?: string | null;
  aprendido: boolean;
  ativo: boolean;
  id_character_ability: number | null;
}

interface ItemInventarioApi {
  id_personagem_inventario: number;
  id_item: number;
  quantidade: number;
  Item: {
    id: number;
    nome: string;
    tipo_item: string;
    imagem_url?: string | null;
  };
}

function Thumb({ nome, imagemUrl }: { nome: string; imagemUrl?: string | null }) {
  const src = resolveMediaUrl(imagemUrl);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={nome} className="h-full w-full rounded-lg object-cover" />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg text-lg font-bold text-[#F3B43F]/80">
      {nome.charAt(0).toUpperCase()}
    </div>
  );
}

function Slot({
  nome,
  imagemUrl,
  onSelecionar,
  onRemover,
}: {
  nome?: string;
  imagemUrl?: string | null;
  onSelecionar: () => void;
  onRemover?: () => void;
}) {
  const preenchido = Boolean(nome);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="h-16 w-16 overflow-hidden rounded-lg border-2 border-[#F3B43F]/60 bg-[#3a2f24]">
        {preenchido && <Thumb nome={nome!} imagemUrl={imagemUrl} />}
      </div>
      <button
        type="button"
        onClick={preenchido ? onRemover : onSelecionar}
        className="w-full rounded-md border border-[#F3B43F]/50 bg-black/30 px-1 py-1 text-[10px] font-bold uppercase tracking-wide text-[#F3B43F] transition hover:bg-black/50"
      >
        {preenchido ? "Remover" : "Selecionar"}
      </button>
    </div>
  );
}

function SeletorModal({
  titulo,
  opcoes,
  onEscolher,
  onFechar,
}: {
  titulo: string;
  opcoes: { id: number; nome: string; imagemUrl?: string | null }[];
  onEscolher: (id: number) => void;
  onFechar: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={onFechar}
    >
      <div
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-imFeel text-2xl">{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
          >
            Fechar
          </button>
        </div>

        {opcoes.length === 0 ? (
          <p className="text-sm text-white/60">Nada disponível pra selecionar agora.</p>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {opcoes.map((opcao) => (
              <button
                key={opcao.id}
                type="button"
                onClick={() => onEscolher(opcao.id)}
                className="flex flex-col items-center gap-1 rounded-xl border-2 border-white/10 p-2 transition hover:border-[#F3B43F]/60"
              >
                <div className="h-14 w-14 overflow-hidden rounded-lg bg-[#3a2f24]">
                  <Thumb nome={opcao.nome} imagemUrl={opcao.imagemUrl} />
                </div>
                <span className="text-center text-[10px] font-bold text-white/80">
                  {opcao.nome}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CombatLoadoutPanel({ characterId }: { characterId: number }) {
  const { character, refreshCharacter } = useCharacter();

  const [poderes, setPoderes] = useState<PoderApi[]>([]);
  const [inventario, setInventario] = useState<ItemInventarioApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [processando, setProcessando] = useState(false);
  const [seletorAberto, setSeletorAberto] = useState<
    "habilidade" | { tipo: "item"; slot: number } | null
  >(null);

  const carregar = useCallback(async () => {
    try {
      const [respPoderes, respInventario] = await Promise.all([
        axiosInstance.get<{ data?: { poderes?: PoderApi[] } }>(
          `/characters/${characterId}/powers`,
        ),
        axiosInstance.get<{ data?: { inventory?: ItemInventarioApi[] } }>(
          "/character-inventory",
          { params: { characterId } },
        ),
      ]);
      setPoderes(respPoderes.data?.data?.poderes ?? []);
      setInventario(respInventario.data?.data?.inventory ?? []);
    } catch (error) {
      console.error("Erro ao carregar loadout de combate:", error);
      setMensagem("Não foi possível carregar seu combate.");
    } finally {
      setCarregando(false);
    }
  }, [characterId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const ativasAtivas = poderes.filter(
    (p) => p.tipo_poder === "Ativo" && p.aprendido && p.ativo,
  );
  const ativasDisponiveis = poderes.filter(
    (p) => p.tipo_poder === "Ativo" && p.aprendido && !p.ativo,
  );

  const slotsConsumiveis = Array.from(
    { length: MAX_SLOTS },
    (_, i) => character?.slots_consumiveis_combate?.[i] ?? null,
  );
  const consumiveisDisponiveis = inventario.filter(
    (entrada) =>
      entrada.Item.tipo_item === "Consumivel" && !slotsConsumiveis.includes(entrada.id_item),
  );

  async function alternarHabilidade(idCharacterAbility: number | null, ativar: boolean) {
    if (!idCharacterAbility || processando) return;
    setProcessando(true);
    setMensagem("");
    try {
      await axiosInstance.patch(`/character-abilities/${idCharacterAbility}/toggle`, {
        is_active: ativar,
      });
      await carregar();
      setSeletorAberto(null);
    } catch (error: unknown) {
      const msg = axios.isAxiosError<{ message?: string }>(error)
        ? (error.response?.data?.message ?? "Não foi possível atualizar essa habilidade.")
        : "Não foi possível atualizar essa habilidade.";
      setMensagem(msg);
    } finally {
      setProcessando(false);
    }
  }

  async function definirSlotConsumivel(slot: number, idItem: number | null) {
    if (processando) return;
    setProcessando(true);
    setMensagem("");
    try {
      await axiosInstance.patch(`/characters/${characterId}/combat-loadout/items`, {
        slot,
        id_item: idItem,
      });
      await refreshCharacter();
      setSeletorAberto(null);
    } catch (error: unknown) {
      const msg = axios.isAxiosError<{ message?: string }>(error)
        ? (error.response?.data?.message ?? "Não foi possível atualizar esse slot.")
        : "Não foi possível atualizar esse slot.";
      setMensagem(msg);
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando combate...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-1 text-sm uppercase tracking-widest text-[#F3B43F]">Combate</p>
      <p className="mb-4 text-xs text-white/50">
        Até {MAX_SLOTS} habilidades ativas e {MAX_SLOTS} consumíveis por vez — o resto do
        que você aprendeu ou carrega fica de fora da luta até você trocar aqui.
      </p>

      {mensagem && <p className="mb-3 text-sm text-red-400">{mensagem}</p>}

      <div className="mb-6">
        <div className="mb-2 flex justify-center">
          <p className="rounded-full border border-[#F3B43F]/50 bg-black/30 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#F3B43F]">
            Habilidades em Combate
          </p>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: MAX_SLOTS }).map((_, i) => {
            const poder = ativasAtivas[i];
            return (
              <Slot
                key={i}
                nome={poder?.nome}
                imagemUrl={poder?.imagem_url}
                onSelecionar={() => setSeletorAberto("habilidade")}
                onRemover={
                  poder ? () => alternarHabilidade(poder.id_character_ability, false) : undefined
                }
              />
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex justify-center">
          <p className="rounded-full border border-[#F3B43F]/50 bg-black/30 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#F3B43F]">
            Consumíveis em Combate
          </p>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {slotsConsumiveis.map((idItem, i) => {
            const entrada = inventario.find((it) => it.id_item === idItem);
            return (
              <Slot
                key={i}
                nome={entrada?.Item.nome}
                imagemUrl={entrada?.Item.imagem_url}
                onSelecionar={() => setSeletorAberto({ tipo: "item", slot: i })}
                onRemover={entrada ? () => definirSlotConsumivel(i, null) : undefined}
              />
            );
          })}
        </div>
      </div>

      {seletorAberto === "habilidade" && (
        <SeletorModal
          titulo="Selecionar habilidade"
          opcoes={ativasDisponiveis.map((p) => ({
            id: p.id_power,
            nome: p.nome,
            imagemUrl: p.imagem_url,
          }))}
          onEscolher={(idPower) => {
            const poder = ativasDisponiveis.find((p) => p.id_power === idPower);
            if (poder) alternarHabilidade(poder.id_character_ability, true);
          }}
          onFechar={() => setSeletorAberto(null)}
        />
      )}

      {seletorAberto && typeof seletorAberto === "object" && seletorAberto.tipo === "item" && (
        <SeletorModal
          titulo="Selecionar consumível"
          opcoes={consumiveisDisponiveis.map((entrada) => ({
            id: entrada.id_item,
            nome: entrada.Item.nome,
            imagemUrl: entrada.Item.imagem_url,
          }))}
          onEscolher={(idItem) => definirSlotConsumivel(seletorAberto.slot, idItem)}
          onFechar={() => setSeletorAberto(null)}
        />
      )}
    </div>
  );
}
