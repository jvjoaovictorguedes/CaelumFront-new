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

const NOME_ATRIBUTO: Record<string, string> = {
  Forca: "Força",
  Vitalidade: "Vitalidade",
  Agilidade: "Agilidade",
  Inteligencia: "Inteligência",
  Velocidade: "Velocidade",
};

export interface PoderAcao {
  id: number;
  nome: string;
  imagem_url?: string | null;
  custo_mana: number;
  descricao?: string;
  escala_atributo?: string;
  valor_escala?: number;
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
  // Turnos restantes de cooldown por id de Power (§42 da Especificação
  // Consolidada Poder/Status/Cooldown/Balanceamento) — opcional porque
  // hoje só a Aventura solo (CombatArena.tsx) manda isso; o Duelo ao
  // vivo (LiveDuelArena.tsx) ainda não integra o motor de cooldown.
  cooldownsPorPoder = {},
}: {
  podeAgir: boolean;
  ocupado: boolean;
  manaAtual: number;
  onAtaqueBasico: () => void;
  poderes: PoderAcao[];
  onUsarPoder: (id: number) => void;
  consumiveis: ConsumivelAcao[];
  onUsarConsumivel: (idItem: number) => void;
  cooldownsPorPoder?: Record<number, number>;
}) {
  const desabilitadoGeral = !podeAgir || ocupado;

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border-2 border-[#F3B43F]/50 bg-[#292018]/60 p-2.5 shadow-lg backdrop-blur-sm">
      <button
        type="button"
        onClick={onAtaqueBasico}
        disabled={desabilitadoGeral}
        className="self-start rounded-lg border-2 border-[#F3B43F] bg-[#BC8418]/90 px-3 py-1.5 text-sm font-bold text-black shadow-md transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Ataque básico
      </button>

      {poderes.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#F3B43F]/90">Poderes</p>
          <div className="flex flex-wrap gap-1.5">
            {poderes.map((poder) => {
              const semMana = manaAtual < poder.custo_mana;
              const emCooldown = (cooldownsPorPoder[poder.id] ?? 0) > 0;
              return (
                <ActionTooltip
                  key={poder.id}
                  label={
                    <div>
                      <p className="font-bold">{poder.nome}</p>
                      <p className="text-xs">{poder.custo_mana} de mana</p>
                      {poder.escala_atributo && (
                        <p className="text-xs text-[#3a2f24]/80">
                          Escala com {NOME_ATRIBUTO[poder.escala_atributo] ?? poder.escala_atributo}
                          {poder.valor_escala ? ` (x${poder.valor_escala})` : ""}
                        </p>
                      )}
                      {poder.descricao && (
                        <p className="mt-1 text-xs text-[#3a2f24]/80">{poder.descricao}</p>
                      )}
                      {emCooldown && (
                        <p className="mt-1 text-xs font-bold text-[#F3B43F]">
                          Disponível em {cooldownsPorPoder[poder.id]} turno(s)
                        </p>
                      )}
                    </div>
                  }
                >
                  <button
                    type="button"
                    onClick={() => onUsarPoder(poder.id)}
                    disabled={desabilitadoGeral || semMana || emCooldown}
                    className="relative h-10 w-10 overflow-hidden rounded-md border-2 border-[#F3B43F]/50 bg-[#3a2f24]/70 shadow-md transition hover:border-[#F3B43F] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <IconeAcao nome={poder.nome} imagemUrl={poder.imagem_url} />
                    {emCooldown && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm font-bold text-white">
                        {cooldownsPorPoder[poder.id]}
                      </span>
                    )}
                  </button>
                </ActionTooltip>
              );
            })}
          </div>
        </div>
      )}

      {consumiveis.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#F3B43F]/90">Consumíveis</p>
          <div className="flex flex-wrap gap-1.5">
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
                    className="relative h-10 w-10 overflow-hidden rounded-md border-2 border-[#F3B43F]/50 bg-[#3a2f24]/70 shadow-md transition hover:border-[#F3B43F] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <IconeAcao nome={item.nome} imagemUrl={item.imagem_url} />
                    <span className="absolute bottom-0 right-0 rounded-tl bg-black/70 px-1 text-[9px] font-bold text-white">
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
