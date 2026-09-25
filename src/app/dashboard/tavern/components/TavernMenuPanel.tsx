"use client";

import { useCallback, useEffect, useState } from "react";
import { useCharacter } from "@/contexts/CharacterContext";
import {
  consumirOferta,
  listarBuffsAtivos,
  listarCardapio,
  mensagemDeErroTaverna,
  type BuffAtivo,
  type CategoriaCardapio,
  type OfertaCardapio,
} from "@/lib/api/tavern";

const ROTULO_BUFF: Record<string, string> = {
  MAX_HP_PCT: "Vida máxima",
  MAX_MANA_PCT: "Mana máxima",
  PVE_DAMAGE_PCT: "Dano na Aventura",
  PVE_DEFENSE_PCT: "Defesa na Aventura",
  ADVENTURE_XP_PCT: "XP de Aventura",
  EXPEDITION_XP_PCT: "XP de Expedição",
  FORGE_XP_PCT: "XP de Forja",
  ALCHEMY_XP_PCT: "XP de Alquimia",
  FISHING_CONTROL_PCT: "Controle na Pesca",
};

function tempoRestante(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expirado";
  const minutos = Math.floor(ms / 60000);
  const horas = Math.floor(minutos / 60);
  if (horas > 0) return `${horas}h ${minutos % 60}min`;
  return `${minutos}min`;
}

function BuffAtivoCard({ buff }: { buff: BuffAtivo }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#F3B43F]/30 bg-black/25 px-3 py-2 text-sm">
      <div>
        <p className="font-bold text-[#F3B43F]">{buff.categoria === "Refeicao" ? "🍲" : "🍺"} {ROTULO_BUFF[buff.buff_key] ?? buff.buff_key}</p>
        <p className="text-xs text-white/60">+{buff.magnitude}%</p>
      </div>
      <span className="text-xs text-white/50">expira em {tempoRestante(buff.expires_at)}</span>
    </div>
  );
}

function OfertaCard({
  oferta,
  ativa,
  dinheiro,
  onComprar,
  comprando,
}: {
  oferta: OfertaCardapio;
  ativa: boolean;
  dinheiro: number;
  onComprar: (oferta: OfertaCardapio) => void;
  comprando: boolean;
}) {
  const podeComprar = dinheiro >= oferta.preco_gold;
  return (
    <div className={`flex flex-col gap-2 rounded-xl border-2 p-4 ${ativa ? "border-[#F3B43F] bg-[#3a2c14]/80" : "border-white/10 bg-black/20"}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-white">{oferta.nome}</p>
        {ativa && <span className="shrink-0 rounded-full bg-[#F3B43F]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F3B43F]">Ativa</span>}
      </div>
      <p className="text-xs text-white/60">{oferta.descricao}</p>
      <p className="text-xs text-[#F3B43F]/90">
        {ROTULO_BUFF[oferta.buff_key] ?? oferta.buff_key} +{oferta.magnitude}% por {Math.round(oferta.duracao_segundos / 60)}min
      </p>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-sm font-bold text-[#F3B43F]">{oferta.preco_gold} Gold</span>
        <button
          type="button"
          disabled={!podeComprar || comprando}
          onClick={() => onComprar(oferta)}
          className="rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
        >
          {ativa ? "Renovar" : "Comprar"}
        </button>
      </div>
    </div>
  );
}

export default function TavernMenuPanel() {
  const { character, atualizarCharacter } = useCharacter();
  const [ofertas, setOfertas] = useState<OfertaCardapio[]>([]);
  const [buffsAtivos, setBuffsAtivos] = useState<BuffAtivo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [comprandoId, setComprandoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [itens, buffs] = await Promise.all([listarCardapio(), listarBuffsAtivos()]);
      setOfertas(itens);
      setBuffsAtivos(buffs);
    } catch (error) {
      setErro(mensagemDeErroTaverna(error, "Não foi possível carregar o cardápio."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function comprar(oferta: OfertaCardapio) {
    const jaAtivo = buffsAtivos.find((b) => b.categoria === oferta.categoria);
    if (jaAtivo && jaAtivo.source_menu_item_id !== oferta.id) {
      const confirmado = confirm(
        `Você já tem um buff de ${oferta.categoria === "Refeicao" ? "Refeição" : "Bebida"} ativo. Comprar "${oferta.nome}" substitui imediatamente o atual, sem reembolso. Continuar?`,
      );
      if (!confirmado) return;
    }

    setComprandoId(oferta.id);
    setErro("");
    try {
      const resultado = await consumirOferta(oferta.id);
      atualizarCharacter({ dinheiro: resultado.dinheiro });
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroTaverna(error, "Não foi possível comprar essa oferta."));
    } finally {
      setComprandoId(null);
    }
  }

  if (carregando) return <p className="text-sm text-white/60">Carregando...</p>;

  const porCategoria = (categoria: CategoriaCardapio) => ofertas.filter((o) => o.categoria === categoria);
  const ativaPor = (categoria: CategoriaCardapio) => buffsAtivos.find((b) => b.categoria === categoria);

  return (
    <div className="flex flex-col gap-5">
      {erro && <p className="rounded-lg bg-black/40 px-3 py-2 text-sm text-red-400">{erro}</p>}

      {buffsAtivos.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-[#F3B43F]/80">Buffs ativos</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {buffsAtivos.map((b) => (
              <BuffAtivoCard key={b.id} buff={b} />
            ))}
          </div>
        </div>
      )}

      {(["Refeicao", "Bebida"] as CategoriaCardapio[]).map((categoria) => (
        <div key={categoria} className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-[#F3B43F]/80">
            {categoria === "Refeicao" ? "Refeições" : "Bebidas"}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {porCategoria(categoria).map((oferta) => (
              <OfertaCard
                key={oferta.id}
                oferta={oferta}
                ativa={ativaPor(categoria)?.source_menu_item_id === oferta.id}
                dinheiro={character?.dinheiro ?? 0}
                onComprar={comprar}
                comprando={comprandoId === oferta.id}
              />
            ))}
            {porCategoria(categoria).length === 0 && (
              <p className="text-sm text-white/50">Nada disponível no momento.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
