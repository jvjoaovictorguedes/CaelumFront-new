"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";

interface CustoEvolucao {
  ouro: number;
  fragmentos: number;
}

interface PoderApi {
  id_power: number;
  nome: string;
  descricao: string;
  tipo_poder: "Ativo" | "Passivo";
  custo_mana: number;
  dano_base: number | null;
  cura_base: number | null;
  cooldown: number | null;
  escala_atributo: string;
  valor_escala: number;
  imagem_url?: string | null;
  origem: "classe" | "raca";
  nivel_necessario: number;
  aprendido: boolean;
  ativo: boolean;
  id_character_ability: number | null;
  nivel_habilidade: number | null;
  nivel_maximo_habilidade: number;
  marco_atual: string | null;
  proxima_evolucao: CustoEvolucao | null;
  custo_ouro: number | null;
  pode_comprar: boolean;
}

interface RecursosEvolucao {
  ouro: number;
  fragmentos: number;
  nome_fragmento: string;
}

// Enquanto o poder não tem `imagem_url` própria, mostra a inicial do nome
// num badge — mesmo critério do ItemThumb em EquipmentPanel.tsx — em vez de
// um quadrado vazio ou ícone genérico quebrado.
function PoderThumb({ poder }: { poder: PoderApi }) {
  const src = resolveMediaUrl(poder.imagem_url);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={poder.nome}
        className="h-full w-full rounded-lg object-cover"
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg text-lg font-bold text-[#F3B43F]/80">
      {poder.nome.charAt(0).toUpperCase()}
    </div>
  );
}

const MIN_SLOTS = 14;

// Grade de slots ao estilo do inventário de Equipamentos: cada poder da
// seção vira um slot clicável, e sobram slots vazios até o mínimo — é só
// visualização/seleção aqui, sem botão de equipar pra luta (isso fica
// pra quando a aba Combate ganhar conteúdo de verdade).
function GradeDePoderes({
  titulo,
  poderes,
  bloqueada,
  selecionadoId,
  onSelecionar,
}: {
  titulo: string;
  poderes: PoderApi[];
  bloqueada?: boolean;
  selecionadoId: number | null;
  onSelecionar: (poder: PoderApi) => void;
}) {
  const vazios = Math.max(0, MIN_SLOTS - poderes.length);

  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2 flex justify-center">
        <p className="rounded-full border border-[#F3B43F]/50 bg-black/30 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#F3B43F]">
          {titulo}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {poderes.map((poder) => (
          <button
            key={poder.id_power}
            type="button"
            onClick={() => onSelecionar(poder)}
            title={poder.nome}
            className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 bg-[#3a2f24] transition ${
              selecionadoId === poder.id_power
                ? "border-[#F3B43F] ring-2 ring-[#F3B43F]/70"
                : bloqueada
                  ? "border-white/10 opacity-50"
                  : "border-[#F3B43F]/60 hover:border-[#F3B43F]"
            }`}
          >
            <PoderThumb poder={poder} />
            {!bloqueada && poder.nivel_habilidade && (
              <span className="pointer-events-none absolute -bottom-1 -right-1 rounded bg-black/80 px-1 text-[9px] font-bold text-white">
                {poder.nivel_habilidade}
              </span>
            )}
          </button>
        ))}
        {Array.from({ length: vazios }).map((_, i) => (
          <div
            key={`vazio-${i}`}
            className="h-16 w-16 rounded-lg border-2 border-white/10 bg-black/20"
          />
        ))}
      </div>
    </div>
  );
}

function DetalheDoPoder({
  poder,
  evoluindo,
  onEvoluir,
  comprando,
  onComprar,
}: {
  poder: PoderApi;
  evoluindo: boolean;
  onEvoluir: () => void;
  comprando: boolean;
  onComprar: () => void;
}) {
  const detalhes: string[] = [];
  if (poder.custo_mana > 0) detalhes.push(`${poder.custo_mana} de mana`);
  if (poder.dano_base) detalhes.push(`${poder.dano_base} de dano base`);
  if (poder.cura_base) detalhes.push(`${poder.cura_base} de cura base`);
  if (poder.cooldown) detalhes.push(`${poder.cooldown}s de recarga`);
  detalhes.push(`escala com ${poder.escala_atributo} (x${poder.valor_escala})`);

  const bloqueado = !poder.aprendido;

  return (
    <div className="rounded-xl border border-[#F3B43F]/40 bg-[#3a2f24] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-imFeel text-xl">{poder.nome}</span>
        <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
          {poder.tipo_poder}
        </span>
        {!bloqueado && poder.nivel_habilidade && (
          <span className="rounded bg-[#F3B43F]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F3B43F]">
            Nível {poder.nivel_habilidade}/{poder.nivel_maximo_habilidade}
          </span>
        )}
        {!bloqueado && poder.marco_atual && (
          <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-300">
            {poder.marco_atual}
          </span>
        )}
        {bloqueado && (
          <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-300">
            Requer nível {poder.nivel_necessario}
          </span>
        )}
        {bloqueado && poder.custo_ouro && (
          <span className="rounded bg-[#F3B43F]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F3B43F]">
            Precisa comprar: {poder.custo_ouro} ouro
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-white/80">{poder.descricao}</p>
      <p className="mt-1 text-xs text-white/60">{detalhes.join(" · ")}</p>

      {bloqueado && poder.pode_comprar && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-white/50">
            Você já tem o nível necessário — falta comprar essa habilidade pra poder ativá-la.
          </span>
          <button
            type="button"
            onClick={onComprar}
            disabled={comprando}
            className="rounded-lg bg-[#F3B43F] px-2 py-1 text-[11px] font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {comprando ? "Comprando..." : `Comprar por ${poder.custo_ouro} ouro`}
          </button>
        </div>
      )}

      {!bloqueado && poder.proxima_evolucao && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-white/50">
            Evoluir pro nível {(poder.nivel_habilidade ?? 1) + 1}: {poder.proxima_evolucao.ouro}{" "}
            ouro + {poder.proxima_evolucao.fragmentos}x fragmento
          </span>
          <button
            type="button"
            onClick={onEvoluir}
            disabled={evoluindo}
            className="rounded-lg bg-purple-500/80 px-2 py-1 text-[11px] font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Evoluir
          </button>
        </div>
      )}
      {!bloqueado && !poder.proxima_evolucao && poder.nivel_habilidade && (
        <p className="mt-3 text-[11px] font-bold text-purple-300">Nível máximo alcançado.</p>
      )}
    </div>
  );
}

export default function AbilitiesPanel({ characterId }: { characterId: number }) {
  const [poderes, setPoderes] = useState<PoderApi[]>([]);
  const [recursos, setRecursos] = useState<RecursosEvolucao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [evoluindoId, setEvoluindoId] = useState<number | null>(null);
  const [comprandoId, setComprandoId] = useState<number | null>(null);
  const [selecionado, setSelecionado] = useState<PoderApi | null>(null);

  const carregar = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{
        data?: { poderes?: PoderApi[]; recursos_evolucao?: RecursosEvolucao };
      }>(`/characters/${characterId}/powers`);
      setPoderes(resp.data?.data?.poderes ?? []);
      setRecursos(resp.data?.data?.recursos_evolucao ?? null);
    } catch (error) {
      console.error("Erro ao carregar habilidades:", error);
      setMensagem("Não foi possível carregar suas habilidades.");
    } finally {
      setCarregando(false);
    }
  }, [characterId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function evoluir(poder: PoderApi) {
    if (!poder.id_character_ability || evoluindoId) return;
    setEvoluindoId(poder.id_character_ability);
    setMensagem("");
    try {
      await axiosInstance.post(`/character-abilities/${poder.id_character_ability}/evolve`);
      await carregar();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Não foi possível evoluir essa habilidade.";
      setMensagem(msg);
    } finally {
      setEvoluindoId(null);
    }
  }

  async function comprar(poder: PoderApi) {
    if (comprandoId) return;
    setComprandoId(poder.id_power);
    setMensagem("");
    try {
      await axiosInstance.post(`/characters/${characterId}/powers/${poder.id_power}/purchase`);
      await carregar();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Não foi possível comprar essa habilidade.";
      setMensagem(msg);
    } finally {
      setComprandoId(null);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando habilidades...
      </div>
    );
  }

  const poderesClasse = poderes.filter((p) => p.origem === "classe");
  const ativasAprendidas = poderesClasse.filter((p) => p.tipo_poder === "Ativo" && p.aprendido);
  const ativasParaAprender = poderesClasse.filter((p) => p.tipo_poder === "Ativo" && !p.aprendido);
  const passivasAprendidas = poderesClasse.filter((p) => p.tipo_poder === "Passivo" && p.aprendido);
  const passivasParaAprender = poderesClasse.filter(
    (p) => p.tipo_poder === "Passivo" && !p.aprendido,
  );
  const unicas = poderes.filter((p) => p.origem === "raca");

  // Se o poder selecionado sumiu da lista (ex.: dados recarregados), some
  // com o detalhe em vez de mostrar informação desatualizada.
  const selecionadoAtual = selecionado
    ? (poderes.find((p) => p.id_power === selecionado.id_power) ?? null)
    : null;

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-1 text-sm uppercase tracking-widest text-[#F3B43F]">
        Habilidades
      </p>
      <p className="mb-4 text-xs text-white/50">
        Clique numa habilidade pra ver os detalhes. As bloqueadas liberam
        sozinhas quando seu personagem alcança o nível pedido. Cada
        habilidade aprendida evolui de nível 1 a 10 por conta própria,
        gastando ouro e {recursos?.nome_fragmento ?? "Fragmento de Grimório"}.
      </p>

      {recursos && (
        <p className="mb-4 text-xs text-[#F3B43F]/80">
          Você tem <span className="font-bold">{recursos.ouro}</span> de ouro e{" "}
          <span className="font-bold">{recursos.fragmentos}</span>x {recursos.nome_fragmento}.
        </p>
      )}

      {mensagem && <p className="mb-3 text-sm text-red-400">{mensagem}</p>}

      <GradeDePoderes
        titulo="Habilidades Aprendidas"
        poderes={ativasAprendidas}
        selecionadoId={selecionadoAtual?.id_power ?? null}
        onSelecionar={setSelecionado}
      />
      <GradeDePoderes
        titulo="Aprender Habilidades"
        poderes={ativasParaAprender}
        bloqueada
        selecionadoId={selecionadoAtual?.id_power ?? null}
        onSelecionar={setSelecionado}
      />
      <GradeDePoderes
        titulo="Habilidades Passivas"
        poderes={passivasAprendidas}
        selecionadoId={selecionadoAtual?.id_power ?? null}
        onSelecionar={setSelecionado}
      />
      <GradeDePoderes
        titulo="Aprender Habilidade Passiva"
        poderes={passivasParaAprender}
        bloqueada
        selecionadoId={selecionadoAtual?.id_power ?? null}
        onSelecionar={setSelecionado}
      />
      <GradeDePoderes
        titulo="Habilidades Únicas"
        poderes={unicas}
        selecionadoId={selecionadoAtual?.id_power ?? null}
        onSelecionar={setSelecionado}
      />

      {poderes.length === 0 && (
        <p className="text-sm text-white/60">
          Sua classe e raça ainda não têm nenhuma habilidade configurada.
        </p>
      )}

      {selecionadoAtual && (
        <DetalheDoPoder
          poder={selecionadoAtual}
          evoluindo={evoluindoId === selecionadoAtual.id_character_ability}
          onEvoluir={() => evoluir(selecionadoAtual)}
          comprando={comprandoId === selecionadoAtual.id_power}
          onComprar={() => comprar(selecionadoAtual)}
        />
      )}
    </div>
  );
}
