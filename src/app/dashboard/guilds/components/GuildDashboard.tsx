"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "@/utils/axiosIntance";
import { resolveMediaUrl } from "@/utils/media-url";
import type { Cargo, GuildResumo, MembroGuild, Permissao } from "./types";
import { PERMISSOES } from "./types";
import GuildMembersTab from "./GuildMembersTab";
import GuildChatTab from "./GuildChatTab";
import GuildTreasuryTab from "./GuildTreasuryTab";
import GuildContributionTab from "./GuildContributionTab";
import GuildLogsTab from "./GuildLogsTab";
import GuildBossTab from "./GuildBossTab";
import GuildMissionsTab from "./GuildMissionsTab";
import GuildBenefitsTab from "./GuildBenefitsTab";
import GuildMuralTab from "./GuildMuralTab";
import GuildEmblemUploader from "./GuildEmblemUploader";

type Aba =
  | "membros"
  | "missoes"
  | "beneficios"
  | "boss"
  | "tesouro"
  | "contribuicao"
  | "chat"
  | "mural"
  | "logs";

const ABAS: { chave: Aba; label: string }[] = [
  { chave: "membros", label: "Membros" },
  { chave: "missoes", label: "Missões" },
  { chave: "beneficios", label: "Benefícios" },
  { chave: "boss", label: "Boss" },
  { chave: "tesouro", label: "Tesouro" },
  { chave: "contribuicao", label: "Contribuição" },
  { chave: "chat", label: "Chat" },
  { chave: "mural", label: "Mural" },
  { chave: "logs", label: "Logs" },
];

export default function GuildDashboard({
  guildInicial,
  cargoInicial,
  characterId,
  characterNome,
  onSaiuOuDissolveu,
}: {
  guildInicial: GuildResumo;
  cargoInicial: Cargo;
  characterId: number;
  characterNome: string;
  onSaiuOuDissolveu: () => void;
}) {
  const [guild, setGuild] = useState(guildInicial);
  const [cargo, setCargo] = useState(cargoInicial);
  const [membros, setMembros] = useState<MembroGuild[]>([]);
  const [permissoes, setPermissoes] = useState<Record<Permissao, boolean> | null>(null);
  const [aba, setAba] = useState<Aba>("membros");
  const [mensagem, setMensagem] = useState("");
  const [editando, setEditando] = useState(false);
  const [muralNaoLido, setMuralNaoLido] = useState(false);

  const souLider = guild.id_lider === characterId;

  const recarregarGuild = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{
        data?: { guild?: GuildResumo; membros?: MembroGuild[]; muralNaoLido?: boolean };
      }>(`/guilds/${guild.id}`, { params: { characterId } });
      if (resp.data?.data?.guild) setGuild(resp.data.data.guild);
      setMembros(resp.data?.data?.membros ?? []);
      const proprio = resp.data?.data?.membros?.find((m) => m.id_personagem === characterId);
      if (proprio) setCargo(proprio.cargo);
      setMuralNaoLido(Boolean(resp.data?.data?.muralNaoLido));
    } catch (error) {
      console.error("Erro ao recarregar guilda:", error);
    }
  }, [guild.id, characterId]);

  const recarregarPermissoes = useCallback(async () => {
    try {
      const resp = await axiosInstance.get<{
        data?: {
          padrao?: Record<Cargo, Record<Permissao, boolean>>;
          overrides?: { cargo: Cargo; permissao: Permissao; permitido: boolean }[];
        };
      }>(`/guilds/${guild.id}/permissions`);
      const padrao = resp.data?.data?.padrao;
      const overrides = resp.data?.data?.overrides ?? [];
      if (!padrao) return;
      const minhas = {} as Record<Permissao, boolean>;
      for (const permissao of PERMISSOES) {
        const override = overrides.find((o) => o.cargo === cargo && o.permissao === permissao);
        minhas[permissao] = cargo === "Fundador" ? true : override ? override.permitido : Boolean(padrao[cargo]?.[permissao]);
      }
      setPermissoes(minhas);
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
    }
  }, [guild.id, cargo]);

  useEffect(() => {
    recarregarGuild();
  }, [recarregarGuild]);

  useEffect(() => {
    recarregarPermissoes();
  }, [recarregarPermissoes]);

  const pode = useMemo(() => permissoes ?? ({} as Record<Permissao, boolean>), [permissoes]);

  async function sairDaGuild() {
    if (!confirm("Tem certeza que quer sair da guilda?")) return;
    try {
      await axiosInstance.post(`/guilds/${guild.id}/leave`, { idPersonagem: characterId });
      onSaiuOuDissolveu();
    } catch (error) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Não foi possível sair da guilda.";
      setMensagem(msg);
    }
  }

  async function dissolverGuild() {
    if (!confirm(`Dissolver "${guild.nome}" permanentemente? Essa ação não pode ser desfeita.`)) return;
    try {
      await axiosInstance.delete(`/guilds/${guild.id}`, { data: { idResponsavel: characterId } });
      onSaiuOuDissolveu();
    } catch (error) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Não foi possível dissolver a guilda.";
      setMensagem(msg);
    }
  }

  const percentualXp = guild.experiencia && guild.nivel
    ? Math.min(100, (guild.experiencia / (guild.nivel * 500)) * 100)
    : 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2 sm:p-4">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#F3B43F]/60 bg-black/40 sm:h-20 sm:w-20">
              {guild.emblema_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- imagem enviada por jogador, nunca passa por next/image
                <img
                  src={resolveMediaUrl(guild.emblema_url)}
                  alt={`Emblema de ${guild.nome}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-imFeel text-2xl text-[#F3B43F]/40">{guild.sigla}</span>
              )}
            </div>
            <div>
              <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
                {guild.sigla} · Nível {guild.nivel} · Ranque {guild.rank ?? "F"}
              </p>
              <h1 className="font-imFeel text-4xl sm:text-5xl">{guild.nome}</h1>
              {guild.descricao && <p className="mt-1 text-white/70">{guild.descricao}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm">
            <span className="rounded-full border border-[#F3B43F]/60 px-3 py-1 text-[#F3B43F]">
              Seu cargo: {cargo}
            </span>
            <div className="flex gap-2">
              {pode.editar_identidade && (
                <button
                  onClick={() => setEditando((v) => !v)}
                  className="rounded-lg border border-white/30 px-3 py-1 text-xs text-white hover:bg-white/10"
                >
                  {editando ? "Fechar edição" : "Editar identidade"}
                </button>
              )}
              {souLider ? (
                <button
                  onClick={dissolverGuild}
                  className="rounded-lg border border-red-500/60 px-3 py-1 text-xs text-red-300 hover:bg-red-950/40"
                >
                  Dissolver
                </button>
              ) : (
                <button
                  onClick={sairDaGuild}
                  className="rounded-lg border border-red-500/60 px-3 py-1 text-xs text-red-300 hover:bg-red-950/40"
                >
                  Sair da guilda
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-white/60">
            <span>Nível {guild.nivel} · Experiência</span>
            <span>{guild.experiencia} XP</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
            <div className="h-full bg-[#F3B43F]" style={{ width: `${percentualXp}%` }} />
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-white/60">
          <span>Ranque {guild.rank ?? "F"} · Missões de Rank concluídas</span>
          <span>{guild.missoes_rank_concluidas_no_rank_atual ?? 0}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/60">
          <span>{guild.totalMembros ?? membros.length}/{guild.limite_membros} membros</span>
          <span>Prestígio: {guild.prestigio}</span>
          <span>
            Recrutamento:{" "}
            {guild.tipo_recrutamento === "Aberto"
              ? "Aberto"
              : guild.tipo_recrutamento === "Aprovacao"
                ? "Por aprovação"
                : "Só por convite"}
          </span>
        </div>

        {editando && (
          <EditorIdentidade
            guild={guild}
            characterId={characterId}
            onSalvo={(novo) => {
              setGuild(novo);
              setEditando(false);
            }}
          />
        )}

        {mensagem && <p className="mt-3 text-sm text-red-400">{mensagem}</p>}
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#292018]/60 p-2">
        {ABAS.map(({ chave, label }) => (
          <button
            key={chave}
            onClick={() => {
              setAba(chave);
              // Otimista: abrir a aba já limpa o indicador aqui (o
              // GuildMuralTab, ao listar, marca a leitura de verdade no
              // servidor) — sem isso o ponto ficava aceso até a próxima
              // vez que recarregarGuild rodasse.
              if (chave === "mural") setMuralNaoLido(false);
            }}
            className={`relative shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors sm:px-4 sm:text-sm ${
              aba === chave
                ? "bg-[#BC8418] text-black"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {label}
            {chave === "mural" && muralNaoLido && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
            )}
          </button>
        ))}
      </div>

      {aba === "membros" && (
        <GuildMembersTab
          guild={guild}
          membros={membros}
          characterId={characterId}
          meuCargo={cargo}
          pode={pode}
          onMudou={recarregarGuild}
        />
      )}
      {aba === "missoes" && <GuildMissionsTab idGuild={guild.id} />}
      {aba === "beneficios" && <GuildBenefitsTab idGuild={guild.id} pode={pode} />}
      {aba === "boss" && <GuildBossTab idGuild={guild.id} pode={pode} />}
      {aba === "chat" && (
        <GuildChatTab characterId={characterId} characterNome={characterNome} idGuild={guild.id} />
      )}
      {aba === "mural" && <GuildMuralTab idGuild={guild.id} pode={pode} />}
      {aba === "tesouro" && (
        <GuildTreasuryTab guild={guild} characterId={characterId} pode={pode} onMudou={recarregarGuild} />
      )}
      {aba === "contribuicao" && <GuildContributionTab idGuild={guild.id} />}
      {aba === "logs" && <GuildLogsTab idGuild={guild.id} />}
    </div>
  );
}

function EditorIdentidade({
  guild,
  characterId,
  onSalvo,
}: {
  guild: GuildResumo;
  characterId: number;
  onSalvo: (guild: GuildResumo) => void;
}) {
  const [descricao, setDescricao] = useState(guild.descricao ?? "");
  const [tipoRecrutamento, setTipoRecrutamento] = useState(guild.tipo_recrutamento);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    setSalvando(true);
    setErro("");
    try {
      const resp = await axiosInstance.patch<{ data?: { guild?: GuildResumo } }>(
        `/guilds/${guild.id}`,
        { idResponsavel: characterId, descricao, tipo_recrutamento: tipoRecrutamento },
      );
      if (resp.data?.data?.guild) onSalvo(resp.data.data.guild);
    } catch (error) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Não foi possível salvar.";
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2 rounded-lg border border-white/10 bg-black/30 p-3">
      <GuildEmblemUploader
        idGuild={guild.id}
        emblemaAtual={guild.emblema_url}
        onEnviado={(novaEmblemaUrl) => onSalvo({ ...guild, emblema_url: novaEmblemaUrl })}
      />
      <textarea
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        maxLength={500}
        placeholder="Descrição pública"
        className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-[#F3B43F]"
        rows={2}
      />
      <select
        value={tipoRecrutamento}
        onChange={(e) => setTipoRecrutamento(e.target.value as GuildResumo["tipo_recrutamento"])}
        className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#F3B43F]"
      >
        <option value="Aberto">Recrutamento aberto</option>
        <option value="Aprovacao">Por aprovação</option>
        <option value="Convite">Só por convite</option>
      </select>
      <button
        onClick={salvar}
        disabled={salvando}
        className="self-start rounded-lg bg-[#BC8418] px-4 py-1.5 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
      >
        {salvando ? "Salvando..." : "Salvar"}
      </button>
      {erro && <p className="text-xs text-red-400">{erro}</p>}
    </div>
  );
}
