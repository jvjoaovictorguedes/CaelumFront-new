"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  atualizarRedemptionCodeAdmin,
  criarRedemptionCodeAdmin,
  listarRedemptionCodesAdmin,
  mensagemDeErroAdmin,
  type RedemptionCodeApi,
} from "@/lib/api/admin";
import { ItemSelect, useItensParaSelecaoAdmin } from "@/components/admin/ItemPicker";

interface LinhaItem {
  id_item: string;
  quantidade: string;
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR");
}

function paraInputDatetimeLocal(iso: string): string {
  const data = new Date(iso);
  const offset = data.getTimezoneOffset();
  const local = new Date(data.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AdminRedemptionCodesClient() {
  const [codigos, setCodigos] = useState<RedemptionCodeApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");

  const [codigoTexto, setCodigoTexto] = useState("");
  const [expiraEm, setExpiraEm] = useState("");
  const [ouro, setOuro] = useState("");
  const [xp, setXp] = useState("");
  const [itens, setItens] = useState<LinhaItem[]>([]);
  const [criando, setCriando] = useState(false);
  const [erroCriacao, setErroCriacao] = useState("");
  const { itens: itensDisponiveis } = useItensParaSelecaoAdmin();

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [expiraEmEdicao, setExpiraEmEdicao] = useState("");
  const [erroEdicao, setErroEdicao] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErroLista("");
    try {
      setCodigos(await listarRedemptionCodesAdmin());
    } catch (error) {
      setErroLista(mensagemDeErroAdmin(error, "Não foi possível carregar os códigos."));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function adicionarLinhaItem() {
    setItens((i) => [...i, { id_item: "", quantidade: "1" }]);
  }
  function atualizarLinhaItem(indice: number, campo: keyof LinhaItem, valor: string) {
    setItens((i) => i.map((linha, idx) => (idx === indice ? { ...linha, [campo]: valor } : linha)));
  }
  function removerLinhaItem(indice: number) {
    setItens((i) => i.filter((_, idx) => idx !== indice));
  }

  async function criar(evento: React.FormEvent) {
    evento.preventDefault();
    setCriando(true);
    setErroCriacao("");
    try {
      await criarRedemptionCodeAdmin({
        codigo: codigoTexto,
        expira_em: new Date(expiraEm).toISOString(),
        recompensa: {
          ouro: ouro ? Number(ouro) : undefined,
          xp: xp ? Number(xp) : undefined,
          itens: itens
            .filter((l) => l.id_item && l.quantidade)
            .map((l) => ({ id_item: Number(l.id_item), quantidade: Number(l.quantidade) })),
        },
      });
      setCodigoTexto("");
      setExpiraEm("");
      setOuro("");
      setXp("");
      setItens([]);
      await carregar();
    } catch (error) {
      setErroCriacao(mensagemDeErroAdmin(error, "Não foi possível criar o código."));
    } finally {
      setCriando(false);
    }
  }

  async function alternarAtivo(codigo: RedemptionCodeApi) {
    try {
      await atualizarRedemptionCodeAdmin(codigo.id, { ativo: !codigo.ativo });
      await carregar();
    } catch (error) {
      setErroLista(mensagemDeErroAdmin(error, "Não foi possível atualizar o código."));
    }
  }

  function abrirEdicaoExpiracao(codigo: RedemptionCodeApi) {
    setEditandoId(codigo.id);
    setExpiraEmEdicao(paraInputDatetimeLocal(codigo.expira_em));
    setErroEdicao("");
  }

  async function salvarExpiracao(evento: React.FormEvent) {
    evento.preventDefault();
    if (editandoId == null) return;
    setSalvandoEdicao(true);
    setErroEdicao("");
    try {
      await atualizarRedemptionCodeAdmin(editandoId, { expira_em: new Date(expiraEmEdicao).toISOString() });
      setEditandoId(null);
      await carregar();
    } catch (error) {
      setErroEdicao(mensagemDeErroAdmin(error, "Não foi possível atualizar a expiração."));
    } finally {
      setSalvandoEdicao(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Códigos de Resgate</h1>
        <p className="mt-1 text-xs text-white/50">
          Crie códigos que jogadores resgatam em Meu Personagem → Informações. Cada código só pode ser resgatado uma
          vez por personagem e sempre precisa de data de expiração.
        </p>
      </div>

      <form onSubmit={criar} className="flex flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-4 text-white">
        <p className="font-imFeel text-lg text-[#F3B43F]">Criar novo código</p>
        {erroCriacao && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erroCriacao}</p>}

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-xs">
            Código
            <input
              required
              value={codigoTexto}
              onChange={(e) => setCodigoTexto(e.target.value)}
              placeholder="PROMO2026"
              className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm uppercase"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs">
            Expira em
            <input
              required
              type="datetime-local"
              value={expiraEm}
              onChange={(e) => setExpiraEm(e.target.value)}
              className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-xs">
            Ouro
            <input type="number" min={1} value={ouro} onChange={(e) => setOuro(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs">
            XP
            <input type="number" min={1} value={xp} onChange={(e) => setXp(e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm" />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase text-[#F3B43F]/80">Itens (opcional)</p>
          {itens.map((linha, i) => (
            <div key={i} className="flex items-center gap-2">
              <ItemSelect
                itens={itensDisponiveis}
                value={linha.id_item ? Number(linha.id_item) : ""}
                onChange={(id) => atualizarLinhaItem(i, "id_item", id === "" ? "" : String(id))}
                className="w-64 rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={1}
                placeholder="Quantidade"
                value={linha.quantidade}
                onChange={(e) => atualizarLinhaItem(i, "quantidade", e.target.value)}
                className="w-28 rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
              />
              <button type="button" onClick={() => removerLinhaItem(i)} className="text-xs text-red-400 hover:underline">
                Remover
              </button>
            </div>
          ))}
          <button type="button" onClick={adicionarLinhaItem} className="self-start rounded-lg border border-[#F3B43F]/50 px-3 py-1 text-xs font-bold text-[#F3B43F] hover:bg-[#F3B43F]/10">
            + Item
          </button>
        </div>

        <button type="submit" disabled={criando} className="self-end rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
          {criando ? "Criando..." : "Criar código"}
        </button>
      </form>

      <div className="flex flex-col gap-2">
        <p className="font-imFeel text-lg text-[#F3B43F]">Códigos existentes</p>
        {erroLista && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erroLista}</p>}
        {carregando && <p className="text-sm text-white/50">Carregando...</p>}
        {!carregando && codigos.length === 0 && <p className="text-sm text-white/50">Nenhum código criado ainda.</p>}

        {codigos.map((codigo) => {
          const expirado = new Date(codigo.expira_em).getTime() <= Date.now();
          return (
            <div key={codigo.id} className="flex flex-col gap-2 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-3 text-white">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#F3B43F]">{codigo.codigo}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    codigo.ativo && !expirado ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {expirado ? "Expirado" : codigo.ativo ? "Ativo" : "Desativado"}
                </span>
              </div>
              <p className="text-xs text-white/60">
                Expira em {formatarData(codigo.expira_em)} · {codigo.total_resgates} resgate(s)
              </p>
              <p className="text-xs text-white/60">
                Recompensa: {codigo.recompensa.ouro ? `${codigo.recompensa.ouro} ouro ` : ""}
                {codigo.recompensa.xp ? `${codigo.recompensa.xp} XP ` : ""}
                {(codigo.recompensa.itens ?? []).length > 0 &&
                  codigo.recompensa.itens?.map((l) => `${l.quantidade}x item#${l.id_item}`).join(", ")}
              </p>

              {editandoId === codigo.id ? (
                <form onSubmit={salvarExpiracao} className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={expiraEmEdicao}
                    onChange={(e) => setExpiraEmEdicao(e.target.value)}
                    className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-xs"
                  />
                  <button type="submit" disabled={salvandoEdicao} className="rounded-lg bg-[#BC8418] px-3 py-1 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
                    Salvar
                  </button>
                  <button type="button" onClick={() => setEditandoId(null)} className="text-xs text-white/50 hover:underline">
                    Cancelar
                  </button>
                  {erroEdicao && <span className="text-xs text-red-400">{erroEdicao}</span>}
                </form>
              ) : (
                <div className="flex gap-3">
                  <button type="button" onClick={() => alternarAtivo(codigo)} className="text-xs font-bold text-[#F3B43F] hover:underline">
                    {codigo.ativo ? "Desativar" : "Reativar"}
                  </button>
                  <button type="button" onClick={() => abrirEdicaoExpiracao(codigo)} className="text-xs font-bold text-[#F3B43F] hover:underline">
                    Editar expiração
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
