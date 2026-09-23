"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cancelarTorneioAdmin,
  criarTorneio,
  dataCurta,
  iniciarTorneioAdmin,
  listarTorneiosAdmin,
  marcarPremioEntregueAdmin,
  mensagemDeErro,
  type NovoTorneio,
  type ResumoTorneio,
} from "@/lib/api/pvp";

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  inscricoes: "Inscrições abertas",
  aguardando: "Inscrições fechadas",
  em_andamento: "Em andamento",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

const STATUS_COR: Record<string, string> = {
  rascunho: "bg-white/10 text-white/60",
  inscricoes: "bg-green-500/20 text-green-300",
  aguardando: "bg-yellow-500/20 text-yellow-300",
  em_andamento: "bg-[#F3B43F]/20 text-[#F3B43F]",
  finalizado: "bg-white/10 text-white/60",
  cancelado: "bg-red-500/20 text-red-300",
};

const FORM_INICIAL: NovoTorneio = {
  name: "",
  description: "",
  level_min: 1,
  level_max: 999,
  starts_at: "",
  max_participants: 8,
  prize_description: "",
};

export default function AdminTournamentsClient() {
  const [torneios, setTorneios] = useState<ResumoTorneio[] | null>(null);
  const [form, setForm] = useState<NovoTorneio>(FORM_INICIAL);
  const [criando, setCriando] = useState(false);
  const [erroForm, setErroForm] = useState("");
  const [ocupadoId, setOcupadoId] = useState<number | null>(null);
  const [erroLista, setErroLista] = useState("");

  const carregar = useCallback(async () => {
    setTorneios(await listarTorneiosAdmin());
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function aoCriar(evento: React.FormEvent) {
    evento.preventDefault();
    if (criando) return;
    setCriando(true);
    setErroForm("");
    try {
      if (!form.name.trim()) throw new Error("Dê um nome pro torneio.");
      if (!form.starts_at) throw new Error("Escolha a data/hora de início.");
      await criarTorneio({
        ...form,
        // <input type="datetime-local"> devolve horário local sem
        // timezone — Date() já interpreta como local e toISOString()
        // converte pro formato que o backend espera (validado como
        // `new Date(starts_at)` em tournamentService.criar).
        starts_at: new Date(form.starts_at).toISOString(),
      });
      setForm(FORM_INICIAL);
      await carregar();
    } catch (error: unknown) {
      setErroForm(
        error instanceof Error && !("response" in error)
          ? error.message
          : mensagemDeErro(error, "Não foi possível criar o torneio."),
      );
    } finally {
      setCriando(false);
    }
  }

  async function aoIniciar(torneio: ResumoTorneio) {
    setOcupadoId(torneio.id);
    setErroLista("");
    try {
      await iniciarTorneioAdmin(torneio.id);
      await carregar();
    } catch (error: unknown) {
      setErroLista(mensagemDeErro(error, `Não foi possível iniciar "${torneio.nome}".`));
    } finally {
      setOcupadoId(null);
    }
  }

  async function aoCancelar(torneio: ResumoTorneio) {
    setOcupadoId(torneio.id);
    setErroLista("");
    try {
      await cancelarTorneioAdmin(torneio.id);
      await carregar();
    } catch (error: unknown) {
      setErroLista(mensagemDeErro(error, `Não foi possível cancelar "${torneio.nome}".`));
    } finally {
      setOcupadoId(null);
    }
  }

  async function aoAlternarPremio(torneio: ResumoTorneio) {
    setOcupadoId(torneio.id);
    setErroLista("");
    try {
      await marcarPremioEntregueAdmin(torneio.id, !torneio.premioEntregue);
      await carregar();
    } catch (error: unknown) {
      setErroLista(mensagemDeErro(error, `Não foi possível atualizar o prêmio de "${torneio.nome}".`));
    } finally {
      setOcupadoId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-5 text-white shadow-xl">
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Administração</p>
        <h1 className="font-imFeel text-4xl">Torneios</h1>
        <p className="mt-2 text-xs text-white/55">
          Só conta DEV/ADM cria ou gerencia torneios — a premiação descrita aqui é só informativa e
          precisa ser entregue manualmente; o sistema não credita nada sozinho.
        </p>
      </div>

      <form
        onSubmit={aoCriar}
        className="flex flex-col gap-3 rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-5 text-white shadow-lg"
      >
        <p className="text-sm uppercase tracking-widest text-[#F3B43F]">Criar novo torneio</p>

        <Campo label="Nome">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={CAMPO_CLASSE}
            placeholder="Ex: Copa de Caelum"
            required
          />
        </Campo>

        <Campo label="Descrição">
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={CAMPO_CLASSE}
            rows={2}
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Campo label="Nível mín.">
            <input
              type="number"
              min={1}
              value={form.level_min}
              onChange={(e) => setForm((f) => ({ ...f, level_min: Number(e.target.value) }))}
              className={CAMPO_CLASSE}
            />
          </Campo>
          <Campo label="Nível máx.">
            <input
              type="number"
              min={1}
              value={form.level_max}
              onChange={(e) => setForm((f) => ({ ...f, level_max: Number(e.target.value) }))}
              className={CAMPO_CLASSE}
            />
          </Campo>
          <Campo label="Máx. participantes">
            <select
              value={form.max_participants}
              onChange={(e) => setForm((f) => ({ ...f, max_participants: Number(e.target.value) }))}
              className={CAMPO_CLASSE}
            >
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={16}>16</option>
            </select>
          </Campo>
          <Campo label="Início">
            <input
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
              className={CAMPO_CLASSE}
              required
            />
          </Campo>
        </div>

        <p className="-mt-1 text-[11px] text-white/45">
          Mínimo de 2 inscritos pra iniciar. Se o número de inscritos for menor que o formato
          escolhido, quem ficar sem oponente avança sozinho pra próxima fase (W.O.).
        </p>

        <Campo label="Premiação (informativa)">
          <input
            type="text"
            value={form.prize_description}
            onChange={(e) => setForm((f) => ({ ...f, prize_description: e.target.value }))}
            className={CAMPO_CLASSE}
            placeholder="Ex: 500 Gold + item raro pro campeão"
          />
        </Campo>

        {erroForm && <p className="text-sm text-red-400">{erroForm}</p>}

        <button
          type="submit"
          disabled={criando}
          className="mt-1 self-start rounded-lg border-2 border-[#F3B43F] bg-[#BC8418] px-4 py-2 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-[#a5710f] disabled:opacity-50"
        >
          {criando ? "Criando..." : "Criar torneio"}
        </button>
      </form>

      <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-5 text-white shadow-lg">
        <p className="mb-3 text-sm uppercase tracking-widest text-[#F3B43F]">Todos os torneios</p>

        {erroLista && <p className="mb-3 text-sm text-red-400">{erroLista}</p>}

        {torneios === null ? (
          <p className="text-sm text-white/60">Carregando...</p>
        ) : torneios.length === 0 ? (
          <p className="text-sm text-white/60">Nenhum torneio criado ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {torneios.map((torneio) => {
              const statusChave = torneio.status;
              const podeIniciar = statusChave === "inscricoes" || statusChave === "aguardando";
              const podeCancelar = statusChave !== "finalizado" && statusChave !== "cancelado";
              const podeMarcarPremio = statusChave === "finalizado";
              const ocupado = ocupadoId === torneio.id;

              return (
                <div
                  key={torneio.id}
                  className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#F3B43F]">{torneio.nome}</p>
                      <p className="text-xs text-white/55">
                        Nível {torneio.nivelMinimo ?? "?"}–{torneio.nivelMaximo ?? "?"} · até{" "}
                        {torneio.maxParticipantes ?? 8} participantes
                        {torneio.comecaEm ? ` · Início: ${dataCurta(torneio.comecaEm)}` : ""}
                      </p>
                      {torneio.premio && (
                        <p className="mt-1 text-xs text-white/70">
                          Prêmio: {torneio.premio}{" "}
                          {torneio.premioEntregue && (
                            <span className="text-green-400">(entregue)</span>
                          )}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        STATUS_COR[statusChave] ?? "bg-white/10 text-white/60"
                      }`}
                    >
                      {STATUS_LABEL[statusChave] ?? statusChave}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {podeIniciar && (
                      <BotaoAcao
                        texto="Iniciar"
                        ocupado={ocupado}
                        onClick={() => aoIniciar(torneio)}
                        cor="verde"
                      />
                    )}
                    {podeCancelar && (
                      <BotaoAcao
                        texto="Cancelar"
                        ocupado={ocupado}
                        onClick={() => aoCancelar(torneio)}
                        cor="vermelho"
                      />
                    )}
                    {podeMarcarPremio && (
                      <BotaoAcao
                        texto={torneio.premioEntregue ? "Desmarcar prêmio entregue" : "Marcar prêmio entregue"}
                        ocupado={ocupado}
                        onClick={() => aoAlternarPremio(torneio)}
                        cor="neutro"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const CAMPO_CLASSE =
  "w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#F3B43F]";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-widest text-white/50">{label}</span>
      {children}
    </label>
  );
}

function BotaoAcao({
  texto,
  ocupado,
  onClick,
  cor,
}: {
  texto: string;
  ocupado: boolean;
  onClick: () => void;
  cor: "verde" | "vermelho" | "neutro";
}) {
  const cores = {
    verde: "border-green-400 text-green-300 hover:bg-green-400/10",
    vermelho: "border-red-400 text-red-300 hover:bg-red-400/10",
    neutro: "border-[#F3B43F]/60 text-[#F3B43F] hover:bg-[#F3B43F]/10",
  }[cor];

  return (
    <button
      type="button"
      disabled={ocupado}
      onClick={onClick}
      className={`rounded-lg border-2 bg-transparent px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition disabled:opacity-50 ${cores}`}
    >
      {ocupado ? "Aguarde..." : texto}
    </button>
  );
}
