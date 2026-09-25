"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  atualizarGlobalBuffAdmin,
  criarGlobalBuffAdmin,
  desativarGlobalBuffAdmin,
  listarGlobalBuffsAdmin,
  mensagemDeErroAdmin,
  type GlobalBuffApi,
  type PayloadGlobalBuffAdmin,
  type TipoGlobalBuff,
} from "@/lib/api/admin";

const TIPO_OPCOES: TipoGlobalBuff[] = ["Xp", "Ouro", "DropAventura", "XpExpedicao"];

const RESUMO_TIPO: Record<TipoGlobalBuff, string> = {
  Xp: "XP",
  Ouro: "Ouro",
  DropAventura: "Drop de Aventura",
  XpExpedicao: "XP de Expedição",
};

type EstadoJanela = "Ativo agora" | "Agendado" | "Expirado" | "Desativado";

function estadoDaJanela(buff: GlobalBuffApi): EstadoJanela {
  if (!buff.ativo) return "Desativado";
  const agora = Date.now();
  const inicio = new Date(buff.inicio).getTime();
  const fim = new Date(buff.fim).getTime();
  if (agora < inicio) return "Agendado";
  if (agora > fim) return "Expirado";
  return "Ativo agora";
}

const CORES_ESTADO: Record<EstadoJanela, string> = {
  "Ativo agora": "bg-green-500/20 text-green-300",
  Agendado: "bg-blue-500/20 text-blue-300",
  Expirado: "bg-white/10 text-white/50",
  Desativado: "bg-red-500/20 text-red-300",
};

function paraInputDatetimeLocal(isoOuVazio: string): string {
  if (!isoOuVazio) return "";
  const d = new Date(isoOuVazio);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formularioVazio(): PayloadGlobalBuffAdmin {
  return {
    nome: "",
    tipo: "Xp",
    multiplicador_percentual: 10,
    inicio: "",
    fim: "",
    descricao: "",
  };
}

export default function AdminGlobalBuffsClient() {
  const [buffs, setBuffs] = useState<GlobalBuffApi[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const porPagina = 20;
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroNome, setFiltroNome] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<PayloadGlobalBuffAdmin>(formularioVazio());
  const [salvando, setSalvando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resultado = await listarGlobalBuffsAdmin({
        pagina,
        porPagina,
        tipo: filtroTipo || undefined,
        nome: filtroNome || undefined,
      });
      setBuffs(resultado.itens);
      setTotal(resultado.total);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível carregar os buffs globais."));
    } finally {
      setCarregando(false);
    }
  }, [pagina, filtroTipo, filtroNome]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditandoId(null);
    setForm(formularioVazio());
    setMostrarForm(true);
    setMensagem("");
  }

  function abrirEdicao(buff: GlobalBuffApi) {
    setEditandoId(buff.id);
    setForm({
      nome: buff.nome,
      tipo: buff.tipo,
      multiplicador_percentual: buff.multiplicador_percentual,
      inicio: paraInputDatetimeLocal(buff.inicio),
      fim: paraInputDatetimeLocal(buff.fim),
      descricao: buff.descricao ?? "",
    });
    setMostrarForm(true);
    setMensagem("");
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setMensagem("");
    try {
      const payload: PayloadGlobalBuffAdmin = {
        ...form,
        inicio: new Date(form.inicio).toISOString(),
        fim: new Date(form.fim).toISOString(),
      };
      if (editandoId) {
        await atualizarGlobalBuffAdmin(editandoId, payload);
        setMensagem(`Buff "${form.nome}" atualizado.`);
      } else {
        await criarGlobalBuffAdmin(payload);
        setMensagem(`Buff "${form.nome}" criado.`);
      }
      setMostrarForm(false);
      await carregar();
    } catch (error) {
      setMensagem(mensagemDeErroAdmin(error, "Não foi possível salvar o buff global."));
    } finally {
      setSalvando(false);
    }
  }

  async function desativar(buff: GlobalBuffApi) {
    if (!confirm(`Desativar o buff "${buff.nome}"? Ele para de valer imediatamente.`)) return;
    try {
      await desativarGlobalBuffAdmin(buff.id);
      await carregar();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível desativar o buff."));
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
            ← Painel Administrativo
          </Link>
          <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Buff Global</h1>
          <p className="mt-1 text-xs text-white/50">
            Evento por tempo limitado que soma XP/Ouro/Drop de Aventura/XP de Expedição pra todos os jogadores.
            Vários buffs do mesmo tipo sobrepostos se somam entre si.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirCriacao}
          className="shrink-0 rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black hover:bg-[#a5710f]"
        >
          + Novo buff
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={filtroNome}
          onChange={(e) => {
            setPagina(1);
            setFiltroNome(e.target.value);
          }}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        />
        <select
          value={filtroTipo}
          onChange={(e) => {
            setPagina(1);
            setFiltroTipo(e.target.value);
          }}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white"
        >
          <option value="">Todos os tipos</option>
          {TIPO_OPCOES.map((t) => (
            <option key={t} value={t}>
              {RESUMO_TIPO[t]}
            </option>
          ))}
        </select>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Bônus</th>
              <th className="px-3 py-2">Início</th>
              <th className="px-3 py-2">Fim</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-white/50">
                  Carregando...
                </td>
              </tr>
            ) : buffs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-white/50">
                  Nenhum buff global encontrado.
                </td>
              </tr>
            ) : (
              buffs.map((buff) => {
                const estado = estadoDaJanela(buff);
                return (
                  <tr key={buff.id} className="border-b border-white/5">
                    <td className="px-3 py-2 font-bold">{buff.nome}</td>
                    <td className="px-3 py-2">{RESUMO_TIPO[buff.tipo]}</td>
                    <td className="px-3 py-2">+{buff.multiplicador_percentual}%</td>
                    <td className="px-3 py-2 text-xs">{new Date(buff.inicio).toLocaleString("pt-BR")}</td>
                    <td className="px-3 py-2 text-xs">{new Date(buff.fim).toLocaleString("pt-BR")}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${CORES_ESTADO[estado]}`}>
                        {estado}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => abrirEdicao(buff)} className="text-[#F3B43F] hover:underline">
                          Editar
                        </button>
                        {buff.ativo && (
                          <button type="button" onClick={() => desativar(buff)} className="text-red-400 hover:underline">
                            Desativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-white/60">
        <span>
          {total} buff(s) — página {pagina} de {totalPaginas}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-white/20 px-3 py-1 disabled:opacity-30"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            className="rounded-lg border border-white/20 px-3 py-1 disabled:opacity-30"
          >
            Próxima
          </button>
        </div>
      </div>

      {mostrarForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setMostrarForm(false)}
        >
          <form
            onSubmit={salvar}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl"
          >
            <p className="font-imFeel text-xl text-[#F3B43F]">{editandoId ? "Editar buff global" : "Novo buff global"}</p>
            {mensagem && <p className="text-sm text-[#F3B43F]">{mensagem}</p>}

            <label className="flex flex-col gap-1 text-xs">
              Nome
              <input
                required
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                placeholder="Ex: Evento de Fim de Semana"
              />
            </label>

            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Tipo
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoGlobalBuff }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                >
                  {TIPO_OPCOES.map((t) => (
                    <option key={t} value={t}>
                      {RESUMO_TIPO[t]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Bônus (%)
                <input
                  required
                  type="number"
                  min={1}
                  value={form.multiplicador_percentual}
                  onChange={(e) => setForm((f) => ({ ...f, multiplicador_percentual: Number(e.target.value) }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Início
                <input
                  required
                  type="datetime-local"
                  value={form.inicio}
                  onChange={(e) => setForm((f) => ({ ...f, inicio: e.target.value }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Fim
                <input
                  required
                  type="datetime-local"
                  value={form.fim}
                  onChange={(e) => setForm((f) => ({ ...f, fim: e.target.value }))}
                  className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs">
              Descrição (opcional)
              <textarea
                value={form.descricao ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
                rows={3}
              />
            </label>

            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
