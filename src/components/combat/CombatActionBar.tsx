// src/components/combat/CombatActionBar.tsx
//
// Layout compartilhado de ações de combate (ataque básico + Poderes +
// Consumíveis) — usado tanto na Aventura/Portal de Ranque (PvE, via
// CombatArena.tsx) quanto no Duelo ao vivo (PvP, via LiveDuelArena.tsx),
// pra não duplicar o grid de botões com ícone + tooltip de mana/efeito
// nos dois lugares.
"use client";

import { resolveMediaUrl } from "@/utils/media-url";
import ActionTooltip from "@/components/Tooltip/ActionTooltip";

export interface PoderAcao {
  id: number;
  nome: string;
  imagem_url?: string | null;
  custo_mana: number;
  descricao?: string;
}

export interface ConsumivelAcao {
  id_item: number;
  nome: string;
  imagem_url?: string | null;
  quantidade: number;
  efeito_vida?: number;
  efeito_mana?: number;
}

function IconeAcao({ nome, imagemUrl }: { nome: string; imagemUrl?: string | null }) {
  const src = resolveMediaUrl(imagemUrl);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={nome} className="h-full w-full object-cover" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#F3B43F]/80">
      {nome.charAt(0).toUpperCase()}
    </div>
  );
}

export default function CombatActionBar({
  podeAgir,
  ocupado,
  manaAtual,
  onAtaqueBasico,
  poderes,
  onUsarPoder,
  consumiveis,
  onUsarConsumivel,
}: {
  podeAgir: boolean;
  ocupado: boolean;
  manaAtual: number;
  onAtaqueBasico: () => void;
  poderes: PoderAcao[];
  onUsarPoder: (id: number) => void;
  consumiveis: ConsumivelAcao[];
  onUsarConsumivel: (idItem: number) => void;
}) {
  const desabilitadoGeral = !podeAgir || ocupado;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 shadow-lg">
      <button
        type="button"
        onClick={onAtaqueBasico}
        disabled={desabilitadoGeral}
        className="self-start rounded-lg border-2 border-[#F3B43F] bg-[#BC8418] px-4 py-2 font-bold text-black shadow-md transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Ataque básico
      </button>

      {poderes.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#F3B43F]">Poderes</p>
          <div className="flex flex-wrap gap-3">
            {poderes.map((poder) => {
              const semMana = manaAtual < poder.custo_mana;
              return (
                <ActionTooltip
                  key={poder.id}
                  label={
                    <div>
                      <p className="font-bold">{poder.nome}</p>
                      <p className="text-xs">{poder.custo_mana} de mana</p>
                      {poder.descricao && (
                        <p className="mt-1 text-xs text-[#3a2f24]/80">{poder.descricao}</p>
                      )}
                    </div>
                  }
                >
                  <button
                    type="button"
                    onClick={() => onUsarPoder(poder.id)}
                    disabled={desabilitadoGeral || semMana}
                    className="h-16 w-16 overflow-hidden rounded-lg border-2 border-[#F3B43F]/60 bg-[#3a2f24] shadow-md transition hover:border-[#F3B43F] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <IconeAcao nome={poder.nome} imagemUrl={poder.imagem_url} />
                  </button>
                </ActionTooltip>
              );
            })}
          </div>
        </div>
      )}

      {consumiveis.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#F3B43F]">Consumíveis</p>
          <div className="flex flex-wrap gap-3">
            {consumiveis.map((item) => {
              const semEstoque = item.quantidade <= 0;
              return (
                <ActionTooltip
                  key={item.id_item}
                  label={
                    <div>
                      <p className="font-bold">{item.nome}</p>
                      {Boolean(item.efeito_vida) && <p className="text-xs">Recupera {item.efeito_vida}% da vida</p>}
                      {Boolean(item.efeito_mana) && <p className="text-xs">Recupera {item.efeito_mana}% da mana</p>}
                      <p className="mt-1 text-xs text-[#3a2f24]/80">Você tem {item.quantidade}</p>
                    </div>
                  }
                >
                  <button
                    type="button"
                    onClick={() => onUsarConsumivel(item.id_item)}
                    disabled={desabilitadoGeral || semEstoque}
                    className="relative h-16 w-16 overflow-hidden rounded-lg border-2 border-[#F3B43F]/60 bg-[#3a2f24] shadow-md transition hover:border-[#F3B43F] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <IconeAcao nome={item.nome} imagemUrl={item.imagem_url} />
                    <span className="absolute bottom-0 right-0 rounded-tl bg-black/70 px-1 text-[10px] font-bold text-white">
                      {item.quantidade}
                    </span>
                  </button>
                </ActionTooltip>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
