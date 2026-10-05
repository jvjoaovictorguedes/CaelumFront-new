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
  combat_slot?: number | null;
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
  // Gate SEPARADO pro consumível (bug relatado: atordoado/congelado, o
  // jogador não tinha NENHUMA ação disponível — nem item — e ficava
  // travado no turno infinitamente; ITEM não é mais bloqueado por hard
  // control no motor de status, então o botão de item não pode mais
  // depender do mesmo `podeAgir` do ataque/poder). Default = `podeAgir`
  // pra quem ainda não passa isso explicitamente (Duelo/Grupo/Ameaça
  // Mundial já nunca desabilitam a barra por status, só por turno) se
  // comportar exatamente como antes.
  podeUsarItem,
  ocupado,
  manaAtual,
  onAtaqueBasico,
  poderes,
  onUsarPoder,
  consumiveis,
  onUsarConsumivel,
  // Opcional — "passar o turno", sempre liberado (nunca bloqueado por
  // nenhum status, ver ACTION_TYPE.PASS). Sem essa ação explícita, um
  // jogador atordoado/congelado sem nenhum item pra usar ficava sem
  // NENHUM botão clicável, travado no turno infinitamente — o próprio
  // bug relatado. Só renderiza o botão quando o chamador passa o
  // callback (hoje: Aventura solo, Duelo, Grupo, Ameaça Mundial).
  onPassarTurno,
  // Turnos restantes de cooldown por id de Power (§42 da Especificação
  // Consolidada Poder/Status/Cooldown/Balanceamento) — opcional porque
  // hoje só a Aventura solo (CombatArena.tsx) manda isso; o Duelo ao
  // vivo (LiveDuelArena.tsx) ainda não integra o motor de cooldown.
  cooldownsPorPoder = {},
  // Opcional — só a Aventura solo (CombatArena.tsx) usa, pra barra
  // ocupar a largura toda em vez de encolher pro tamanho do conteúdo.
  className = "",
  // Opcional — conteúdo extra (hoje só o MissionsPanel, ver
  // CombatArena.tsx) ancorado no canto inferior direito, DENTRO da
  // mesma caixa com borda — jogador reportou que o botão de Missões/
  // chat ficava sozinho, solto, fora da borda da barra de ação.
  rightSlot,
}: {
  podeAgir: boolean;
  podeUsarItem?: boolean;
  ocupado: boolean;
  manaAtual: number;
  onAtaqueBasico: () => void;
  poderes: PoderAcao[];
  onUsarPoder: (id: number) => void;
  consumiveis: ConsumivelAcao[];
  onUsarConsumivel: (idItem: number) => void;
  onPassarTurno?: () => void;
  cooldownsPorPoder?: Record<number, number>;
  className?: string;
  rightSlot?: React.ReactNode;
}) {
  const slotsPoderes: (PoderAcao | null)[] = poderes.some((p) => p.combat_slot != null)
    ? Array.from({ length: 5 }, (_, slot) => poderes.find((p) => p.combat_slot === slot) ?? null)
    : poderes;
  const desabilitadoGeral = !podeAgir || ocupado;
  const desabilitadoItem = !(podeUsarItem ?? podeAgir) || ocupado;

  return (
    <div
      className={`flex flex-row items-end justify-between gap-3 rounded-xl border-2 border-[#F3B43F]/50 bg-[#292018]/60 p-2.5 shadow-lg backdrop-blur-sm ${className}`}
    >
      <div className="flex flex-1 flex-col gap-2.5">
      <div className="flex flex-wrap items-start gap-2">
      <button
        type="button"
        onClick={onAtaqueBasico}
        disabled={desabilitadoGeral}
        className="self-start rounded-lg border-2 border-[#F3B43F] bg-[#BC8418]/90 px-3 py-1.5 text-sm font-bold text-black shadow-md transition hover:bg-[#a5710f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Ataque básico
      </button>

      {onPassarTurno && (
        <button
          type="button"
          onClick={onPassarTurno}
          disabled={ocupado}
          className="self-start rounded-lg border-2 border-white/40 bg-white/10 px-3 py-1.5 text-sm font-bold text-white/90 shadow-md transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Passar turno
        </button>
      )}
      </div>

      {poderes.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#F3B43F]/90">Poderes</p>
          <div className="flex flex-wrap gap-1.5">
            {slotsPoderes.map((poder, slot) => {
              if (!poder) return <div key={`slot-${slot}`} aria-label={`Slot de habilidade ${slot + 1} vazio`} className="h-12 w-12 rounded-lg border-2 border-white/10 bg-black/20" />;
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
                    disabled={desabilitadoItem || semEstoque}
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

      {rightSlot && <div className="shrink-0 self-end">{rightSlot}</div>}
    </div>
  );
}
