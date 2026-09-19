"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { useCharacter } from "@/contexts/CharacterContext";

type Aba = "Diaria" | "Semanal" | "Mensal" | "Rank";

interface MissaoLivreApi {
  id: number;
  nome: string;
  descricao: string;
  tipo: string;
  meta: number;
  progresso: number;
  concluida: boolean;
  recompensa_resgatada: boolean;
  expira_em: string | null;
  recompensa_dinheiro: number;
  recompensa_xp: number;
  recompensa_item_id: number | null;
  recompensa_item_quantidade: number;
}

interface RecompensaApi {
  tipo: "Ouro" | "XP" | "Item";
  quantidade: number;
  item: { id: number; nome: string; imagem_url: string | null } | null;
}

interface MissaoDeRankApi {
  id: number;
  rank: string;
  nome: string;
  descricao: string;
  tipo_objetivo: string;
  quantidade_objetivo: number;
  qualidade_minima: string | null;
  id_item_alvo: number | null;
  recompensas: RecompensaApi[];
}

interface OfertaApi {
  id: number;
  ordem: number;
  missao: MissaoDeRankApi;
  ja_aceita: boolean;
}

interface ContratoApi {
  id: number;
  eh_provacao: boolean;
  status: "Ativo" | "Concluido" | "Expirado" | "Resgatado" | "Falhou";
  progresso_atual: number;
  aceito_em: string;
  expira_em: string | null;
  missao: MissaoDeRankApi;
}

interface QuadroDeRankApi {
  rank: string;
  apto_para_promocao: boolean;
  janela_inicio: string;
  proxima_rotacao_em: string;
  ofertas: OfertaApi[];
  contratos_ativos: ContratoApi[];
  contratos_concluidos: ContratoApi[];
}

interface OverviewApi {
  rank: string;
  missoes_concluidas_no_rank: number;
  requisito_promocao: number | null;
  apto_para_promocao: boolean;
  provacao_ativa: ContratoApi | null;
  cooldown_provacao_restante_ms: number;
}

function formatarExpiracao(expiraEm: string | null) {
  if (!expiraEm) return null;
  const restanteMs = new Date(expiraEm).getTime() - Date.now();
  if (restanteMs <= 0) return "renovando...";
  const horas = Math.floor(restanteMs / 3_600_000);
  const minutos = Math.floor((restanteMs % 3_600_000) / 60_000);
  return horas > 0 ? `renova em ${horas}h ${minutos}min` : `renova em ${minutos}min`;
}

function formatarContagem(ms: number) {
  if (ms <= 0) return "agora";
  const horas = Math.floor(ms / 3_600_000);
  const minutos = Math.floor((ms % 3_600_000) / 60_000);
  const segundos = Math.floor((ms % 60_000) / 1000);
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function descreverRecompensas(recompensas: RecompensaApi[]) {
  return recompensas
    .map((r) => {
      if (r.tipo === "Ouro") return `${r.quantidade} ouro`;
      if (r.tipo === "XP") return `${r.quantidade} XP`;
      return `${r.quantidade}x ${r.item?.nome ?? "item"}`;
    })
    .join(" · ");
}

const ROTULO_ABA: Record<Aba, string> = {
  Diaria: "Diárias",
  Semanal: "Semanais",
  Mensal: "Mensais",
  Rank: "Missões de Rank",
};

// Nenhum endpoint da Guilda dos Aventureiros recebe characterId do
// cliente (§38 da spec) — tudo é resolvido server-side a partir do
// personagem autenticado, então este componente não precisa da prop.
export default function AdventureGuildPanel() {
  const { refreshCharacter } = useCharacter();
  const [aba, setAba] = useState<Aba>("Diaria");
  const [overview, setOverview] = useState<OverviewApi | null>(null);
  const [missoesLivres, setMissoesLivres] = useState<MissaoLivreApi[] | null>(null);
  const [quadro, setQuadro] = useState<QuadroDeRankApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [processando, setProcessando] = useState<string | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  const carregarOverview = useCallback(async () => {
    const resp = await axiosInstance.get<{ data?: OverviewApi }>("/adventure-guild");
    setOverview(resp.data?.data ?? null);
  }, []);

  const carregarAba = useCallback(async (abaAtual: Aba) => {
    if (abaAtual === "Rank") {
      const resp = await axiosInstance.get<{ data?: QuadroDeRankApi }>("/adventure-guild/rank");
      setQuadro(resp.data?.data ?? null);
    } else {
      const rota = abaAtual === "Diaria" ? "daily" : abaAtual === "Semanal" ? "weekly" : "monthly";
      const resp = await axiosInstance.get<{ data?: { missoes?: MissaoLivreApi[] } }>(`/adventure-guild/${rota}`);
      setMissoesLivres(resp.data?.data?.missoes ?? []);
    }
  }, []);

  const carregarTudo = useCallback(
    async (abaAtual: Aba) => {
      setCarregando(true);
      try {
        await Promise.all([carregarOverview(), carregarAba(abaAtual)]);
      } catch (error) {
        console.error("Erro ao carregar Guilda dos Aventureiros:", error);
        setMensagem("Não foi possível carregar a Guilda dos Aventureiros.");
      } finally {
        setCarregando(false);
      }
    },
    [carregarOverview, carregarAba],
  );

  useEffect(() => {
    carregarTudo(aba);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba]);

  async function executar(chave: string, acao: () => Promise<void>) {
    if (processando) return;
    setProcessando(chave);
    setMensagem("");
    try {
      await acao();
      await Promise.all([carregarOverview(), carregarAba(aba), refreshCharacter()]);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Não foi possível concluir a ação.";
      setMensagem(msg);
    } finally {
      setProcessando(null);
    }
  }

  const resgatarMissaoLivre = (id: number) =>
    executar(`claim-livre-${id}`, () => axiosInstance.post(`/adventure-guild/missions/${id}/claim`).then(() => {}));
  const aceitarOferta = (id: number) =>
    executar(`accept-${id}`, () => axiosInstance.post(`/adventure-guild/rank/offers/${id}/accept`).then(() => {}));
  const entregar = (idContrato: number) =>
    executar(`deliver-${idContrato}`, () =>
      axiosInstance.post(`/adventure-guild/contracts/${idContrato}/deliver`).then(() => {}),
    );
  const resgatarContrato = (idContrato: number) =>
    executar(`claim-${idContrato}`, () =>
      axiosInstance.post(`/adventure-guild/contracts/${idContrato}/claim`).then(() => {}),
    );
  const iniciarProvacao = () =>
    executar("trial-start", () => axiosInstance.post("/adventure-guild/trial/start").then(() => {}));
  const falharProvacao = () =>
    executar("trial-fail", () => axiosInstance.post("/adventure-guild/trial/fail").then(() => {}));

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
      <p className="mb-1 text-sm uppercase tracking-widest text-[#F3B43F]">Guilda dos Aventureiros</p>

      {overview && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#F3B43F]/30 bg-black/30 p-3">
          <div>
            <p className="font-imFeel text-2xl">Aventureiro Rank {overview.rank}</p>
            {overview.requisito_promocao != null && (
              <p className="text-xs text-white/60">
                {overview.missoes_concluidas_no_rank} / {overview.requisito_promocao} pra promoção
              </p>
            )}
          </div>
          {overview.apto_para_promocao && !overview.provacao_ativa && (
            <span className="rounded-full bg-[#F3B43F] px-3 py-1 text-xs font-bold uppercase text-black">
              Promoção disponível
            </span>
          )}
          {overview.provacao_ativa && (
            <span className="rounded-full bg-red-700/80 px-3 py-1 text-xs font-bold uppercase text-white">
              Provação em andamento
            </span>
          )}
        </div>
      )}

      {mensagem && <p className="mb-3 text-sm text-red-400">{mensagem}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(ROTULO_ABA) as Aba[]).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAba(a)}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
              aba === a ? "bg-[#F3B43F] text-black" : "bg-black/20 text-white/70 hover:text-white"
            }`}
          >
            {ROTULO_ABA[a]}
          </button>
        ))}
      </div>

      {carregando && <p className="text-sm text-white/60">Carregando...</p>}

      {!carregando && aba !== "Rank" && (
        <div className="flex flex-col gap-2">
          {(missoesLivres ?? []).length === 0 && (
            <p className="text-sm text-white/60">Nenhuma missão disponível nesta categoria.</p>
          )}
          {(missoesLivres ?? []).map((missao) => {
            const percentual = Math.min(100, (missao.progresso / missao.meta) * 100);
            const expiraTexto = formatarExpiracao(missao.expira_em);
            const chave = `claim-livre-${missao.id}`;
            return (
              <div key={missao.id} className="rounded-xl border border-[#F3B43F]/30 bg-[#3a2f24] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{missao.nome}</span>
                  {expiraTexto && <span className="text-[10px] text-white/40">{expiraTexto}</span>}
                </div>
                <p className="mt-1 text-xs text-white/70">{missao.descricao}</p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/30">
                  <div
                    className={`h-full ${missao.concluida ? "bg-green-500" : "bg-[#F3B43F]"}`}
                    style={{ width: `${percentual}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-white/50">
                  <span>{missao.progresso}/{missao.meta}</span>
                  <span>
                    {missao.recompensa_dinheiro > 0 && `${missao.recompensa_dinheiro} moedas`}
                    {missao.recompensa_xp > 0 && ` · ${missao.recompensa_xp} XP`}
                  </span>
                </div>
                {missao.concluida && !missao.recompensa_resgatada && (
                  <button
                    type="button"
                    onClick={() => resgatarMissaoLivre(missao.id)}
                    disabled={processando === chave}
                    className="mt-2 w-full rounded-lg bg-[#F3B43F] px-3 py-1.5 text-xs font-bold text-black transition hover:bg-[#e0a52f] disabled:opacity-50"
                  >
                    {processando === chave ? "Resgatando..." : "Resgatar recompensa"}
                  </button>
                )}
                {missao.recompensa_resgatada && (
                  <p className="mt-2 text-center text-[11px] font-bold text-green-500">Recompensa resgatada</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!carregando && aba === "Rank" && quadro && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-white/60">
            Nova rotação em: {formatarContagem(new Date(quadro.proxima_rotacao_em).getTime() - agora)}
          </p>

          {overview?.provacao_ativa && (
            <ProvacaoCard
              contrato={overview.provacao_ativa}
              onEntregar={entregar}
              onFalhar={falharProvacao}
              onResgatar={resgatarContrato}
              processando={processando}
            />
          )}

          {!overview?.provacao_ativa && overview?.apto_para_promocao && (
            <div className="rounded-xl border-2 border-[#F3B43F] bg-black/30 p-4 text-center">
              <p className="font-imFeel text-xl">Você atingiu os requisitos deste Rank!</p>
              <p className="mb-3 text-sm text-white/70">Complete sua Provação para avançar de Rank.</p>
              <button
                type="button"
                onClick={iniciarProvacao}
                disabled={processando === "trial-start"}
                className="rounded-lg bg-[#F3B43F] px-4 py-2 font-bold text-black transition hover:bg-[#e0a52f] disabled:opacity-50"
              >
                {processando === "trial-start" ? "Iniciando..." : "Iniciar Provação"}
              </button>
            </div>
          )}

          {!overview?.provacao_ativa && !overview?.apto_para_promocao && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-white/50">Ofertas da rotação atual</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {quadro.ofertas.map((oferta) => {
                  const chave = `accept-${oferta.id}`;
                  return (
                    <div key={oferta.id} className="rounded-xl border border-[#F3B43F]/30 bg-[#3a2f24] p-3">
                      <p className="font-bold">{oferta.missao.nome}</p>
                      <p className="mt-1 text-xs text-white/70">{oferta.missao.descricao}</p>
                      <p className="mt-1 text-[11px] text-white/50">
                        Objetivo: {oferta.missao.quantidade_objetivo}x ({oferta.missao.tipo_objetivo})
                      </p>
                      <p className="text-[11px] text-white/50">{descreverRecompensas(oferta.missao.recompensas)}</p>
                      <button
                        type="button"
                        onClick={() => aceitarOferta(oferta.id)}
                        disabled={oferta.ja_aceita || processando === chave}
                        className="mt-2 w-full rounded-lg bg-[#F3B43F] px-3 py-1.5 text-xs font-bold text-black transition hover:bg-[#e0a52f] disabled:opacity-50"
                      >
                        {oferta.ja_aceita ? "Já aceito" : processando === chave ? "Aceitando..." : "Aceitar"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
              Contratos ativos: {quadro.contratos_ativos.length} / 2
            </p>
            <div className="flex flex-col gap-2">
              {[...quadro.contratos_ativos, ...quadro.contratos_concluidos].map((contrato) => (
                <ContratoCard
                  key={contrato.id}
                  contrato={contrato}
                  onEntregar={entregar}
                  onResgatar={resgatarContrato}
                  processando={processando}
                />
              ))}
              {quadro.contratos_ativos.length === 0 && quadro.contratos_concluidos.length === 0 && (
                <p className="text-sm text-white/60">Nenhum contrato aceito ainda.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContratoCard({
  contrato,
  onEntregar,
  onResgatar,
  processando,
}: {
  contrato: ContratoApi;
  onEntregar: (id: number) => void;
  onResgatar: (id: number) => void;
  processando: string | null;
}) {
  const percentual = Math.min(100, (contrato.progresso_atual / contrato.missao.quantidade_objetivo) * 100);
  const chaveEntregar = `deliver-${contrato.id}`;
  const chaveResgatar = `claim-${contrato.id}`;

  return (
    <div className="rounded-xl border border-[#F3B43F]/30 bg-[#3a2f24] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold">{contrato.missao.nome}</span>
        <span className="text-[10px] uppercase text-white/40">{contrato.status}</span>
      </div>
      <p className="mt-1 text-xs text-white/70">{contrato.missao.descricao}</p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/30">
        <div
          className={`h-full ${contrato.status === "Concluido" ? "bg-green-500" : "bg-[#F3B43F]"}`}
          style={{ width: `${percentual}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-white/50">
        {contrato.progresso_atual} / {contrato.missao.quantidade_objetivo}
      </p>

      {contrato.status === "Ativo" && contrato.missao.tipo_objetivo === "Entregar" && (
        <button
          type="button"
          onClick={() => onEntregar(contrato.id)}
          disabled={processando === chaveEntregar}
          className="mt-2 w-full rounded-lg bg-[#F3B43F] px-3 py-1.5 text-xs font-bold text-black transition hover:bg-[#e0a52f] disabled:opacity-50"
        >
          {processando === chaveEntregar ? "Entregando..." : "Entregar Itens"}
        </button>
      )}
      {contrato.status === "Concluido" && (
        <button
          type="button"
          onClick={() => onResgatar(contrato.id)}
          disabled={processando === chaveResgatar}
          className="mt-2 w-full rounded-lg bg-[#F3B43F] px-3 py-1.5 text-xs font-bold text-black transition hover:bg-[#e0a52f] disabled:opacity-50"
        >
          {processando === chaveResgatar ? "Resgatando..." : "Resgatar Recompensa"}
        </button>
      )}
    </div>
  );
}

function ProvacaoCard({
  contrato,
  onEntregar,
  onFalhar,
  onResgatar,
  processando,
}: {
  contrato: ContratoApi;
  onEntregar: (id: number) => void;
  onFalhar: () => void;
  onResgatar: (id: number) => void;
  processando: string | null;
}) {
  const percentual = Math.min(100, (contrato.progresso_atual / contrato.missao.quantidade_objetivo) * 100);
  return (
    <div className="rounded-xl border-2 border-red-700/70 bg-black/30 p-4">
      <p className="font-imFeel text-xl">{contrato.missao.nome}</p>
      <p className="mt-1 text-sm text-white/70">{contrato.missao.descricao}</p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/30">
        <div
          className={`h-full ${contrato.status === "Concluido" ? "bg-green-500" : "bg-red-600"}`}
          style={{ width: `${percentual}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-white/50">
        {contrato.progresso_atual} / {contrato.missao.quantidade_objetivo}
      </p>
      <p className="mt-1 text-[11px] text-white/50">Recompensa principal: promoção de Rank</p>

      <div className="mt-3 flex gap-2">
        {contrato.status === "Ativo" && contrato.missao.tipo_objetivo === "Entregar" && (
          <button
            type="button"
            onClick={() => onEntregar(contrato.id)}
            disabled={processando === `deliver-${contrato.id}`}
            className="flex-1 rounded-lg bg-[#F3B43F] px-3 py-1.5 text-xs font-bold text-black transition hover:bg-[#e0a52f] disabled:opacity-50"
          >
            Entregar Itens
          </button>
        )}
        {contrato.status === "Concluido" && (
          <button
            type="button"
            onClick={() => onResgatar(contrato.id)}
            disabled={processando === `claim-${contrato.id}`}
            className="flex-1 rounded-lg bg-[#F3B43F] px-3 py-1.5 text-xs font-bold text-black transition hover:bg-[#e0a52f] disabled:opacity-50"
          >
            Resgatar Promoção
          </button>
        )}
        {contrato.status === "Ativo" && (
          <button
            type="button"
            onClick={onFalhar}
            disabled={processando === "trial-fail"}
            className="rounded-lg border border-red-600 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-900/30 disabled:opacity-50"
          >
            Abandonar Provação
          </button>
        )}
      </div>
    </div>
  );
}
