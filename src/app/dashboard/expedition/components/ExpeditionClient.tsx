"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";
import { useCharacter } from "@/contexts/CharacterContext";
import CombatArena from "../../adventure/components/CombatArena";

type TipoProfissao = "Mineracao" | "Silvicultura" | "Exploracao";

interface Profissao {
  tipo: TipoProfissao;
  nivel: number;
  experiencia: number;
  xp_proximo_nivel: number | null;
  proxima_coleta_em: string | null;
  disponivel_em_ms: number;
}

interface RecursoRegiao {
  id_recurso: number;
  nome: string;
  peso_percentual: number;
}

interface QualidadeChance {
  qualidade: string;
  chance_percentual: number;
}

interface Regiao {
  id: number;
  nome: string;
  profissao: TipoProfissao;
  nivel_minimo: number;
  descricao: string | null;
  imagem_url: string | null;
  desbloqueada: boolean;
  recursos: RecursoRegiao[];
  qualidades: QualidadeChance[];
  chance_nada_percentual: number;
}

interface ItemGanho {
  id: number;
  nome: string;
  raridade: string;
  imagem_url?: string | null;
}

// Mesmo formato de InimigoApi em adventure/page.tsx — o inimigo da
// interrupção vem calibrado igual ao de uma Área de Caça normal (ver
// expeditionService.coletar), só que sem zona nenhuma por trás.
interface InimigoInterrupcao {
  nome: string;
  nivel: number;
  vida_atual: number;
  vida_maxima: number;
  forca: number;
  vitalidade: number;
  agilidade: number;
  velocidade: number;
  dano_base: number;
}

interface HabilidadeApi {
  id: number;
  is_active: boolean;
  Power: {
    id: number;
    nome: string;
    descricao: string;
    tipo_poder: string;
    custo_mana: number;
    dano_base: number;
    cura_base: number;
    imagem_url?: string | null;
  };
}

interface ResultadoColeta {
  interrompida: boolean;
  enemy: InimigoInterrupcao | null;
  resultado: string | null;
  item_ganho: ItemGanho | null;
  quantidade: number;
  xp_ganho: number;
  subiu_nivel: boolean;
  nivel: number;
  experiencia: number;
  xp_proximo_nivel: number | null;
  proxima_coleta_em: string;
}

const LABEL_PROFISSAO: Record<TipoProfissao, string> = {
  Mineracao: "Mineração",
  Silvicultura: "Silvicultura",
  Exploracao: "Exploração",
};

const ICONE_PROFISSAO: Record<TipoProfissao, string> = {
  Mineracao: "⛏️",
  Silvicultura: "🪓",
  Exploracao: "🧭",
};

const BORDA_RARIDADE: Record<string, string> = {
  comum: "border-[#9CA3AF]/80",
  incomum: "border-[#4ADE80]/80",
  raro: "border-[#60A5FA]/80",
  epico: "border-[#C084FC]/80",
  lendario: "border-[#FB923C]/80",
  mitico: "border-[#F87171]/80",
};

const TEXTO_RARIDADE: Record<string, string> = {
  comum: "text-[#9CA3AF]",
  incomum: "text-[#4ADE80]",
  raro: "text-[#60A5FA]",
  epico: "text-[#C084FC]",
  lendario: "text-[#FB923C]",
  mitico: "text-[#F87171]",
};

function bordaPorRaridade(raridade?: string) {
  return BORDA_RARIDADE[(raridade ?? "comum").toLowerCase()] ?? BORDA_RARIDADE.comum;
}

function textoPorRaridade(raridade?: string) {
  return TEXTO_RARIDADE[(raridade ?? "comum").toLowerCase()] ?? TEXTO_RARIDADE.comum;
}

function formatarTempo(ms: number) {
  const segundosTotais = Math.ceil(ms / 1000);
  if (segundosTotais < 60) return `${segundosTotais}s`;
  const minutos = Math.floor(segundosTotais / 60);
  const segundosRestantes = segundosTotais % 60;
  return segundosRestantes > 0 ? `${minutos}min ${segundosRestantes}s` : `${minutos}min`;
}

function ImagemItem({ nome, imagem_url, className = "" }: { nome: string; imagem_url?: string | null; className?: string }) {
  const src = resolveMediaUrl(imagem_url);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={nome} className={`object-contain ${className}`} />;
  }
  return (
    <div className={`flex items-center justify-center text-lg font-bold text-[#F3B43F]/80 ${className}`}>
      {nome.charAt(0).toUpperCase()}
    </div>
  );
}

function BarraXp({ profissao }: { profissao: Profissao }) {
  const proximo = profissao.xp_proximo_nivel;
  if (proximo === null) {
    return (
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/40">
        <div className="h-full w-full bg-[#F3B43F]" />
      </div>
    );
  }
  // xp_proximo_nivel é o XP TOTAL necessário pro próximo nível — a base do
  // nível atual é aproximada aqui só pra desenhar a barra (o servidor não
  // manda o "início" do nível atual, só o alvo do próximo).
  const percentual = Math.min(100, Math.max(0, (profissao.experiencia / proximo) * 100));
  return (
    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/40">
      <div className="h-full bg-[#F3B43F] transition-all" style={{ width: `${percentual}%` }} />
    </div>
  );
}

export default function ExpeditionClient() {
  const [profissoes, setProfissoes] = useState<Profissao[]>([]);
  const [profissaoSelecionada, setProfissaoSelecionada] = useState<TipoProfissao | null>(null);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoRegioes, setCarregandoRegioes] = useState(false);
  const [coletandoRegiao, setColetandoRegiao] = useState<number | null>(null);
  const [resultado, setResultado] = useState<ResultadoColeta | null>(null);
  const [erro, setErro] = useState("");
  const [agora, setAgora] = useState(() => Date.now());
  const [regiaoInterrompida, setRegiaoInterrompida] = useState<Regiao | null>(null);
  const [inimigoInterrupcao, setInimigoInterrupcao] = useState<InimigoInterrupcao | null>(null);
  const [habilidadesCombate, setHabilidadesCombate] = useState<HabilidadeApi[]>([]);
  const { character, refreshCharacter } = useCharacter();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poderes pro combate de interrupção (ver CombatArena abaixo) — busca
  // uma vez, igual dashboard/adventure/page.tsx faz no servidor; aqui é
  // client-side porque a interrupção só se sabe depois de um clique em
  // "Iniciar Expedição", não no carregamento da página.
  useEffect(() => {
    if (!character?.id) return;
    let cancelado = false;
    axiosInstance
      .get<{ data?: { characterAbilities?: HabilidadeApi[] } }>("/character-abilities", {
        params: { characterId: character.id },
      })
      .then((resp) => {
        if (cancelado) return;
        const todas = resp.data?.data?.characterAbilities ?? [];
        setHabilidadesCombate(
          todas.filter((h) => h.is_active && h.Power?.tipo_poder === "Ativo"),
        );
      })
      .catch((error) => {
        console.error("Erro ao carregar habilidades pra combate de expedição:", error);
      });
    return () => {
      cancelado = true;
    };
  }, [character?.id]);

  const carregarProfissoes = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{ data?: { profissoes?: Profissao[] } }>("/expeditions/professions");
      setProfissoes(resp.data?.data?.profissoes ?? []);
    } catch (error) {
      console.error("Erro ao carregar profissões de expedição:", error);
      setErro("Não foi possível carregar as profissões.");
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarRegioes = useCallback(async (profissao: TipoProfissao) => {
    setCarregandoRegioes(true);
    try {
      const resp = await axiosInstance.get<{ data?: { regioes?: Regiao[] } }>("/expeditions/regions", {
        params: { profissao },
      });
      setRegioes(resp.data?.data?.regioes ?? []);
    } catch (error) {
      console.error("Erro ao carregar regiões de expedição:", error);
      setErro("Não foi possível carregar as regiões dessa profissão.");
    } finally {
      setCarregandoRegioes(false);
    }
  }, []);

  useEffect(() => {
    carregarProfissoes();
  }, [carregarProfissoes]);

  useEffect(() => {
    if (profissaoSelecionada) carregarRegioes(profissaoSelecionada);
  }, [profissaoSelecionada, carregarRegioes]);

  // Contagem regressiva local do cooldown de cada profissão, 1x por
  // segundo — mesmo padrão da Forja: o servidor manda quanto falta, o
  // front só desenha o relógio. Coletar sempre revalida no servidor.
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => setAgora(Date.now()), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  function disponivelEmMsAtual(profissao: Profissao) {
    if (!profissao.proxima_coleta_em) return 0;
    return Math.max(0, new Date(profissao.proxima_coleta_em).getTime() - agora);
  }

  async function coletar(regiao: Regiao) {
    if (coletandoRegiao) return;
    setColetandoRegiao(regiao.id);
    setErro("");
    setResultado(null);
    try {
      const resp = await axiosInstance.post<{ data: ResultadoColeta }>(
        `/expeditions/regions/${regiao.id}/collect`,
      );
      const dados = resp.data.data;

      // O cooldown foi consumido do mesmo jeito (ver expeditionService.
      // coletar) mesmo sem ganhar recurso, então a barra/relógio da
      // profissão ainda precisa refletir isso.
      setProfissoes((atuais) =>
        atuais.map((profissao) =>
          profissao.tipo === regiao.profissao
            ? { ...profissao, proxima_coleta_em: dados.proxima_coleta_em }
            : profissao,
        ),
      );

      if (dados.interrompida && dados.enemy) {
        setRegiaoInterrompida(regiao);
        setInimigoInterrupcao(dados.enemy);
        return;
      }

      setResultado(dados);
      setProfissoes((atuais) =>
        atuais.map((profissao) =>
          profissao.tipo === regiao.profissao
            ? {
                ...profissao,
                nivel: dados.nivel,
                experiencia: dados.experiencia,
                xp_proximo_nivel: dados.xp_proximo_nivel,
                proxima_coleta_em: dados.proxima_coleta_em,
              }
            : profissao,
        ),
      );
      if (dados.item_ganho) await refreshCharacter();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível coletar nessa região.";
      setErro(msg);
    } finally {
      setColetandoRegiao(null);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        Carregando expedição...
      </div>
    );
  }

  function encerrarInterrupcao() {
    setInimigoInterrupcao(null);
    setRegiaoInterrompida(null);
    refreshCharacter();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Interrupção de monstro — cobre a tela inteira (fixed inset-0,
          ver CombatArena) igual o combate normal da Aventura; ao
          terminar (vitória ou derrota), some e devolve pra tela de
          Expedição normal. */}
      {character && inimigoInterrupcao && (
        <CombatArena
          key={`expedicao-${inimigoInterrupcao.nome}-${Date.now()}`}
          character={character}
          abilities={habilidadesCombate}
          initialEnemy={inimigoInterrupcao}
          onVitoria={encerrarInterrupcao}
          onDerrota={encerrarInterrupcao}
          labelBotaoVitoria="Voltar à expedição"
          tituloZona={regiaoInterrompida ? regiaoInterrompida.nome : "Expedição"}
          tituloArena="Emboscada!"
          aoSairEndpoint={null}
          aoSairRota="/dashboard/expedition"
        />
      )}

      {erro && (
        <p className="rounded-xl border border-red-500/40 bg-[#292018]/90 p-3 text-sm text-red-300">{erro}</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {profissoes.map((profissao) => {
          const selecionada = profissaoSelecionada === profissao.tipo;
          const emCooldown = disponivelEmMsAtual(profissao) > 0;
          return (
            <button
              key={profissao.tipo}
              type="button"
              onClick={() => setProfissaoSelecionada(profissao.tipo)}
              className={`flex flex-col gap-1 rounded-2xl border-2 bg-[#292018]/90 p-4 text-left text-white shadow-xl transition ${
                selecionada ? "border-[#F3B43F]" : "border-[#F3B43F]/30 hover:border-[#F3B43F]/70"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{ICONE_PROFISSAO[profissao.tipo]}</span>
                <div>
                  <p className="font-bold">{LABEL_PROFISSAO[profissao.tipo]}</p>
                  <p className="text-xs text-[#F3B43F]/80">Nível {profissao.nivel} / 10</p>
                </div>
                {emCooldown && (
                  <span className="ml-auto shrink-0 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white/70">
                    {formatarTempo(disponivelEmMsAtual(profissao))}
                  </span>
                )}
              </div>
              <BarraXp profissao={profissao} />
              <p className="text-[10px] text-white/50">
                {profissao.experiencia} / {profissao.xp_proximo_nivel ?? "MAX"} XP
              </p>
            </button>
          );
        })}
      </div>

      {resultado && (
        <div
          className={`flex flex-col gap-2 rounded-2xl border-2 bg-[#292018]/90 p-5 text-white shadow-xl ${bordaPorRaridade(
            resultado.item_ganho?.raridade,
          )}`}
        >
          {resultado.item_ganho ? (
            <div className="flex items-center gap-3">
              <div className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-[#3a2f24] ${bordaPorRaridade(resultado.item_ganho.raridade)}`}>
                <ImagemItem
                  nome={resultado.item_ganho.nome}
                  imagem_url={resultado.item_ganho.imagem_url}
                  className="h-full w-full p-1.5"
                />
              </div>
              <div>
                <p className={`text-xs uppercase tracking-widest ${textoPorRaridade(resultado.item_ganho.raridade)}`}>
                  {resultado.item_ganho.raridade}
                </p>
                <p className="font-bold">
                  {resultado.quantidade}x {resultado.item_ganho.nome}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-white/70">Você explorou a região, mas não encontrou nada dessa vez.</p>
          )}
          <p className="text-xs text-white/50">+{resultado.xp_ganho} XP</p>
          {resultado.subiu_nivel && (
            <p className="rounded-lg bg-[#F3B43F]/20 px-3 py-1.5 text-sm font-bold text-[#F3B43F]">
              Sua profissão subiu para o nível {resultado.nivel}!
            </p>
          )}
        </div>
      )}

      {profissaoSelecionada && (
        <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
          <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">
            Regiões de {LABEL_PROFISSAO[profissaoSelecionada]}
          </p>

          {carregandoRegioes ? (
            <p className="text-sm text-white/60">Carregando regiões...</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {regioes.map((regiao) => {
                const profissao = profissoes.find((p) => p.tipo === regiao.profissao);
                const cooldownMs = profissao ? disponivelEmMsAtual(profissao) : 0;
                const bloqueadaPorCooldown = cooldownMs > 0;
                const podeColetar = regiao.desbloqueada && !bloqueadaPorCooldown;
                return (
                  <div
                    key={regiao.id}
                    className={`flex flex-col gap-2 rounded-xl border-2 bg-[#3a2f24] p-3 ${
                      regiao.desbloqueada ? "border-[#F3B43F]/40" : "border-white/10 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#1c150f]">
                        <ImagemItem nome={regiao.nome} imagem_url={regiao.imagem_url} className="h-full w-full p-1.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{regiao.nome}</p>
                        <p className="text-xs text-white/50">Nível mínimo {regiao.nivel_minimo}</p>
                      </div>
                    </div>

                    {regiao.descricao && <p className="text-xs text-white/60">{regiao.descricao}</p>}

                    <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#F3B43F]/80">
                        O que essa região dropa
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {regiao.recursos.map((recurso) => (
                          <p key={recurso.id_recurso} className="flex justify-between text-[11px] text-white/70">
                            <span className="truncate">{recurso.nome}</span>
                            <span className="shrink-0 text-white/50">{recurso.peso_percentual}% do achado</span>
                          </p>
                        ))}
                      </div>
                      <div className="mt-1.5 flex flex-col gap-0.5 border-t border-white/10 pt-1.5">
                        {regiao.qualidades.map((q) => (
                          <p
                            key={q.qualidade}
                            className={`flex justify-between text-[11px] ${textoPorRaridade(q.qualidade)}`}
                          >
                            <span>{q.qualidade}</span>
                            <span>{q.chance_percentual}%</span>
                          </p>
                        ))}
                        <p className="flex justify-between text-[11px] text-white/40">
                          <span>Nada</span>
                          <span>{regiao.chance_nada_percentual}%</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => coletar(regiao)}
                      disabled={!podeColetar || coletandoRegiao === regiao.id}
                      className="mt-1 rounded-lg bg-[#F3B43F] px-4 py-1.5 text-sm font-bold text-black transition hover:bg-[#e0a52f] disabled:cursor-not-allowed disabled:bg-black/40 disabled:text-white/50"
                    >
                      {!regiao.desbloqueada
                        ? `Requer nível ${regiao.nivel_minimo}`
                        : coletandoRegiao === regiao.id
                          ? "Explorando..."
                          : bloqueadaPorCooldown
                            ? `Aguarde ${formatarTempo(cooldownMs)}`
                            : "Iniciar Expedição"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
