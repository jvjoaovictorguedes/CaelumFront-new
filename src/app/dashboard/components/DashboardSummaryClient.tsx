"use client";

// Dashboard V2 — "Centro do Aventureiro". Busca o resumo agregado
// (GET /api/dashboard/summary) e só RENDERIZA o que o backend já
// montou — nenhum cálculo de negócio acontece aqui.
import { useEffect, useState } from "react";
import Link from "next/link";
import axiosInstance from "@/utils/axiosIntance";

interface AttentionItem {
  key: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  title: string;
  description: string;
  href: string;
  progressCurrent?: number | null;
  progressMax?: number | null;
}

interface Activity {
  key: string;
  category: string;
  title: string;
  progressCurrent?: number | null;
  progressMax?: number | null;
  status?: string;
  href: string;
}

interface DashboardSummary {
  character: {
    id: number;
    nome: string;
    nivel: number;
    experiencia: number;
    vidaAtual: number;
    vidaMaxima: number;
    manaAtual: number;
    manaMaxima: number;
    dinheiro: number;
    classe: string | null;
    avatarKey: string | null;
    adventurerRank: string | null;
  };
  attentionItems: AttentionItem[];
  activities: Activity[];
  shop:
    | { exists: false }
    | {
        exists: true;
        activeProducts: number | null;
        openDemands: number;
        commissionsByStatus: { emAndamento: number; recebidas: number; enviadas: number };
        pendingActions: number;
      };
  professions: { key: string; nivel: number }[];
  guild:
    | { exists: false }
    | {
        exists: true;
        id: number;
        nome: string;
        sigla: string;
        nivel: number | null;
        missionSummary: { total: number; concluidas: number } | null;
        bossSummary: { liberadoEstaSemana: boolean; rankAtual: string | null } | null;
      };
  world: {
    worldBoss: { status: string; nome?: string } | null;
    fishingTournament: { id: number; nome: string } | null;
    pvpSeason: { id: number; nome: string; rating: number | null; jogos: number; vitorias: number } | null;
  };
  unreadMessages: number;
  generatedAt: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "border-red-500/70 bg-red-950/40",
  MEDIUM: "border-[#F3B43F]/70 bg-[#292018]/60",
  LOW: "border-white/20 bg-[#292018]/40",
};

export default function DashboardSummaryClient() {
  const [resumo, setResumo] = useState<DashboardSummary | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let cancelado = false;
    axiosInstance
      .get<{ data?: DashboardSummary }>("/dashboard/summary")
      .then((resp) => {
        if (!cancelado) setResumo(resp.data?.data ?? null);
      })
      .catch((error) => {
        console.error("Erro ao carregar o resumo do Dashboard:", error);
        if (!cancelado) setErro(true);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  if (carregando) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-[#292018]/40" />
        ))}
      </div>
    );
  }

  if (erro || !resumo) {
    return (
      <p className="rounded-xl border border-white/10 bg-[#292018]/40 p-4 text-sm text-white/60">
        Não foi possível carregar o resumo do Centro do Aventureiro agora.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {resumo.attentionItems.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-imFeel text-2xl text-[#F3B43F]">Precisa da sua atenção</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {resumo.attentionItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                prefetch={false}
                className={`rounded-xl border p-4 text-white shadow-lg transition hover:-translate-y-0.5 ${PRIORITY_STYLES[item.priority]}`}
              >
                <p className="font-bold">{item.title}</p>
                <p className="mt-1 text-sm text-white/70">{item.description}</p>
                {item.progressMax ? (
                  <p className="mt-2 text-xs text-white/50">
                    {item.progressCurrent ?? 0} / {item.progressMax}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      )}

      {resumo.activities.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-imFeel text-2xl text-[#F3B43F]">Atividades em andamento</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {resumo.activities.map((atividade) => (
              <Link
                key={atividade.key}
                href={atividade.href}
                prefetch={false}
                className="rounded-xl border border-white/10 bg-[#292018]/60 p-4 text-white shadow-lg transition hover:-translate-y-0.5"
              >
                <p className="font-bold">{atividade.title}</p>
                {atividade.progressMax ? (
                  <p className="mt-1 text-xs text-white/50">
                    {atividade.progressCurrent ?? 0} / {atividade.progressMax}
                  </p>
                ) : atividade.status ? (
                  <p className="mt-1 text-xs text-white/50">{atividade.status}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LojaCard shop={resumo.shop} />
        <ProfissoesCard profissoes={resumo.professions} />
        <GuildaCard guild={resumo.guild} />
        <MundoCard world={resumo.world} />
        <MensagensCard total={resumo.unreadMessages} />
      </section>
    </div>
  );
}

function Card({ titulo, href, children }: { titulo: string; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex flex-col gap-2 rounded-xl border border-[#F3B43F]/40 bg-[#292018]/60 p-4 text-white shadow-lg transition hover:-translate-y-0.5"
    >
      <p className="font-imFeel text-lg text-[#F3B43F]">{titulo}</p>
      {children}
    </Link>
  );
}

function LojaCard({ shop }: { shop: DashboardSummary["shop"] }) {
  if (!shop.exists) {
    return (
      <Card titulo="Minha Loja" href="/dashboard/market">
        <p className="text-sm text-white/60">Você ainda não abriu uma loja.</p>
      </Card>
    );
  }
  return (
    <Card titulo="Minha Loja" href="/dashboard/market">
      <p className="text-sm text-white/70">{shop.activeProducts ?? 0} produto(s) ativo(s)</p>
      <p className="text-sm text-white/70">{shop.openDemands} demanda(s) em aberto</p>
      {shop.pendingActions > 0 && (
        <p className="text-sm font-bold text-[#F3B43F]">{shop.pendingActions} pendência(s) aguardando você</p>
      )}
    </Card>
  );
}

function ProfissoesCard({ profissoes }: { profissoes: DashboardSummary["professions"] }) {
  return (
    <Card titulo="Profissões" href="/dashboard/forge">
      {profissoes.length === 0 ? (
        <p className="text-sm text-white/60">Nenhuma profissão iniciada ainda.</p>
      ) : (
        profissoes.map((p) => (
          <p key={p.key} className="text-sm text-white/70">
            {p.key}: nível {p.nivel}
          </p>
        ))
      )}
    </Card>
  );
}

function GuildaCard({ guild }: { guild: DashboardSummary["guild"] }) {
  if (!guild.exists) {
    return (
      <Card titulo="Guilda" href="/dashboard/guilds">
        <p className="text-sm text-white/60">Você ainda não está em uma guilda.</p>
      </Card>
    );
  }
  return (
    <Card titulo={`Guilda: ${guild.nome}`} href="/dashboard/guilds">
      <p className="text-sm text-white/70">[{guild.sigla}] Nível {guild.nivel ?? "-"}</p>
      {guild.missionSummary && (
        <p className="text-sm text-white/70">
          Missões: {guild.missionSummary.concluidas}/{guild.missionSummary.total}
        </p>
      )}
      {guild.bossSummary && !guild.bossSummary.liberadoEstaSemana && (
        <p className="text-sm font-bold text-[#F3B43F]">Boss da Guilda disponível</p>
      )}
    </Card>
  );
}

function MundoCard({ world }: { world: DashboardSummary["world"] }) {
  return (
    <Card titulo="Mundo" href="/dashboard/quests">
      {world.worldBoss && ["DISCOVERED", "ACTIVE"].includes(world.worldBoss.status) ? (
        <p className="text-sm font-bold text-[#F3B43F]">Ameaça Mundial ativa</p>
      ) : (
        <p className="text-sm text-white/60">Nenhuma Ameaça Mundial ativa.</p>
      )}
      {world.fishingTournament && <p className="text-sm text-white/70">Torneio de Pesca: {world.fishingTournament.nome}</p>}
      {world.pvpSeason && (
        <p className="text-sm text-white/70">
          PvP Ranked: {world.pvpSeason.rating ?? "-"} pts ({world.pvpSeason.vitorias}/{world.pvpSeason.jogos})
        </p>
      )}
    </Card>
  );
}

function MensagensCard({ total }: { total: number }) {
  return (
    <Card titulo="Mensagens" href="/dashboard/messages">
      <p className="text-sm text-white/70">
        {total > 0 ? `${total} mensagem(ns) não lida(s)` : "Nenhuma mensagem nova."}
      </p>
    </Card>
  );
}
