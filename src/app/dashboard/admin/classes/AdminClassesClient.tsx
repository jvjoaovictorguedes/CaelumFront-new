"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  atualizarCaminhoEvolucaoAdmin,
  atualizarClasseAdmin,
  atualizarLootAdmin,
  buscarClasseAdmin,
  catalogoEfeitosEvolucaoAdmin,
  criarCaminhoEvolucaoAdmin,
  criarEfeitoEvolucaoAdmin,
  criarHabilidadeEvolucaoAdmin,
  criarLootAdmin,
  criarRequisitoEvolucaoAdmin,
  excluirCaminhoEvolucaoAdmin,
  excluirEfeitoEvolucaoAdmin,
  excluirHabilidadeEvolucaoAdmin,
  excluirRequisitoEvolucaoAdmin,
  listarClassesAdmin,
  listarLootAdmin,
  listarMonstrosAdmin,
  mensagemDeErroAdmin,
  simularEvolucaoClasseAdmin,
  validarClassesAdmin,
  type AdventureMonsterApi,
  type AdventureMonsterLootApi,
  type AtributoClasseApi,
  type ClassAdminApi,
  type ClassEvolutionPathAdminApi,
  type EfeitoCatalogoAdminApi,
  type PayloadAtualizarClasseAdmin,
  type PayloadCaminhoAdmin,
  type ResultadoSimuladorClassesApi,
  type ResultadoValidadorClassesApi,
  type TipoRequisitoEvolucaoApi,
} from "@/lib/api/admin";
import { ItemSelect, useItensParaSelecaoAdmin } from "@/components/admin/ItemPicker";
import { PowerSelect, usePowersParaSelecaoAdmin } from "@/components/admin/PowerPicker";

const ATRIBUTOS: AtributoClasseApi[] = ["Forca", "Vitalidade", "Agilidade", "Inteligencia", "Velocidade"];
const TIPOS_REQUISITO: TipoRequisitoEvolucaoApi[] = [
  "LEVEL",
  "GOLD",
  "ITEM",
  "MONSTER_KILL",
  "ADVENTURE_GUILD_RANK",
  "ACHIEVEMENT",
  "REPUTATION",
  "QUEST",
];
const ROTULO_TIPO_REQUISITO: Record<TipoRequisitoEvolucaoApi, string> = {
  LEVEL: "Nível",
  GOLD: "Ouro",
  ITEM: "Item",
  MONSTER_KILL: "Abates de monstro",
  ADVENTURE_GUILD_RANK: "Rank na Guilda dos Aventureiros",
  ACHIEVEMENT: "Conquista",
  REPUTATION: "Reputação (não implementado)",
  QUEST: "Missão (não implementado)",
};
const RANKS_AVENTUREIRO = ["F", "E", "D", "C", "B", "A", "S"];

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#F3B43F]/80">{titulo}</p>
      {children}
    </div>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm text-white ${props.className ?? ""}`} />;
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm text-white ${props.className ?? ""}`} />;
}
function Botao({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-lg bg-[#BC8418] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#a5710f] disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

const ABAS = ["Classes", "Árvore de Evolução", "Simulador", "Validador"] as const;
type Aba = (typeof ABAS)[number];

export default function AdminClassesClient() {
  const [aba, setAba] = useState<Aba>("Classes");
  const [classes, setClasses] = useState<ClassAdminApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarClasses = useCallback(async () => {
    setCarregando(true);
    try {
      setClasses(await listarClassesAdmin());
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível carregar as classes."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarClasses();
  }, [carregarClasses]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/admin" className="text-sm text-[#F3B43F]/80 hover:underline">
          ← Painel Administrativo
        </Link>
        <h1 className="mt-1 font-imFeel text-3xl text-[#F3B43F]">Classes</h1>
        <p className="mt-1 text-sm text-white/60">
          Identidade, gameplay, árvore de evolução em 2 estágios (Lv.40/Lv.100), requisitos, habilidades e
          efeitos concedidos. Auditoria completa em{" "}
          <Link href="/dashboard/admin/audit" className="text-[#F3B43F] hover:underline">
            Auditoria
          </Link>
          .
        </p>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {ABAS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAba(a)}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
              aba === a ? "bg-[#F3B43F] text-black" : "bg-black/30 text-white/70 hover:bg-white/10"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {aba === "Classes" && (
        <AbaClasses classes={classes} carregando={carregando} onSalvo={carregarClasses} setErro={setErro} />
      )}
      {aba === "Árvore de Evolução" && <AbaArvore classes={classes} setErro={setErro} onClassesAlteradas={carregarClasses} />}
      {aba === "Simulador" && <AbaSimulador classes={classes} setErro={setErro} />}
      {aba === "Validador" && <AbaValidador setErro={setErro} />}
    </div>
  );
}

// ============================================================= Classes ==
function AbaClasses({
  classes,
  carregando,
  onSalvo,
  setErro,
}: {
  classes: ClassAdminApi[];
  carregando: boolean;
  onSalvo: () => Promise<void>;
  setErro: (s: string) => void;
}) {
  const [editando, setEditando] = useState<ClassAdminApi | null>(null);
  const [form, setForm] = useState<PayloadAtualizarClasseAdmin>({});
  const [salvando, setSalvando] = useState(false);

  function abrirEdicao(classe: ClassAdminApi) {
    setEditando(classe);
    setForm({
      descricao: classe.descricao ?? "",
      imagem_url: classe.imagem_url ?? "",
      multiplicador_vida_por_nivel: classe.multiplicador_vida_por_nivel,
      multiplicador_mana_por_nivel: classe.multiplicador_mana_por_nivel,
      multiplicador_dano_fisico: classe.multiplicador_dano_fisico,
      multiplicador_dano_magico: classe.multiplicador_dano_magico,
      slug: classe.slug ?? "",
      icone_url: classe.icone_url ?? "",
      banner_url: classe.banner_url ?? "",
      ativo: classe.ativo,
      disponivel_criacao: classe.disponivel_criacao,
      papel: classe.papel ?? "",
      atributo_principal: classe.atributo_principal ?? undefined,
      atributo_secundario: classe.atributo_secundario ?? undefined,
      ordem_exibicao: classe.ordem_exibicao,
    });
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setSalvando(true);
    setErro("");
    try {
      await atualizarClasseAdmin(editando.id, form);
      setEditando(null);
      await onSalvo();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível salvar a classe."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Secao titulo="Classes cadastradas">
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-white/50">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Papel</th>
              <th className="px-3 py-2">Atributos</th>
              <th className="px-3 py-2">Caminhos (E1/E2)</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-white/50">Carregando...</td></tr>
            ) : classes.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-white/50">Nenhuma classe cadastrada.</td></tr>
            ) : (
              classes.map((c) => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{c.nome}</td>
                  <td className="px-3 py-2 text-white/60">{c.slug ?? "—"}</td>
                  <td className="px-3 py-2">{c.papel ?? "—"}</td>
                  <td className="px-3 py-2 text-white/60">
                    {c.atributo_principal ?? "—"}
                    {c.atributo_secundario ? ` / ${c.atributo_secundario}` : ""}
                  </td>
                  <td className="px-3 py-2">{c.total_caminhos_estagio1 ?? 0} / {c.total_caminhos_estagio2 ?? 0}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.ativo ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60"}`}>
                      {c.ativo ? "Ativa" : "Inativa"}
                    </span>
                    {!c.disponivel_criacao && (
                      <span className="ml-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-yellow-300">
                        Oculta na criação
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => abrirEdicao(c)} className="text-[#F3B43F] hover:underline">
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4" onClick={() => setEditando(null)}>
          <form
            onSubmit={salvar}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-lg flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl"
          >
            <p className="font-imFeel text-xl text-[#F3B43F]">Editar {editando.nome}</p>

            <label className="flex flex-col gap-1 text-xs">Descrição
              <Input value={form.descricao ?? ""} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Slug (identificador estável, minúsculo, com hífen)
              <Input value={form.slug ?? ""} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Papel (ex.: Combatente, Mago, Suporte)
              <Input value={form.papel ?? ""} onChange={(e) => setForm((f) => ({ ...f, papel: e.target.value }))} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs">Atributo principal
                <Select value={form.atributo_principal ?? ""} onChange={(e) => setForm((f) => ({ ...f, atributo_principal: (e.target.value || undefined) as AtributoClasseApi | undefined }))}>
                  <option value="">—</option>
                  {ATRIBUTOS.map((a) => <option key={a} value={a}>{a}</option>)}
                </Select>
              </label>
              <label className="flex flex-col gap-1 text-xs">Atributo secundário
                <Select value={form.atributo_secundario ?? ""} onChange={(e) => setForm((f) => ({ ...f, atributo_secundario: (e.target.value || undefined) as AtributoClasseApi | undefined }))}>
                  <option value="">—</option>
                  {ATRIBUTOS.map((a) => <option key={a} value={a}>{a}</option>)}
                </Select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs">Mult. vida/nível
                <Input type="number" step="0.01" value={form.multiplicador_vida_por_nivel ?? 1} onChange={(e) => setForm((f) => ({ ...f, multiplicador_vida_por_nivel: Number(e.target.value) }))} />
              </label>
              <label className="flex flex-col gap-1 text-xs">Mult. mana/nível
                <Input type="number" step="0.01" value={form.multiplicador_mana_por_nivel ?? 1} onChange={(e) => setForm((f) => ({ ...f, multiplicador_mana_por_nivel: Number(e.target.value) }))} />
              </label>
              <label className="flex flex-col gap-1 text-xs">Mult. dano físico
                <Input type="number" step="0.01" value={form.multiplicador_dano_fisico ?? 1} onChange={(e) => setForm((f) => ({ ...f, multiplicador_dano_fisico: Number(e.target.value) }))} />
              </label>
              <label className="flex flex-col gap-1 text-xs">Mult. dano mágico
                <Input type="number" step="0.01" value={form.multiplicador_dano_magico ?? 1} onChange={(e) => setForm((f) => ({ ...f, multiplicador_dano_magico: Number(e.target.value) }))} />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-xs">Ordem de exibição
              <Input type="number" value={form.ordem_exibicao ?? 0} onChange={(e) => setForm((f) => ({ ...f, ordem_exibicao: Number(e.target.value) }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Ícone (URL)
              <Input value={form.icone_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, icone_url: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs">Banner (URL)
              <Input value={form.banner_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, banner_url: e.target.value }))} />
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.ativo ?? true} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} />
              Ativa
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.disponivel_criacao ?? true} onChange={(e) => setForm((f) => ({ ...f, disponivel_criacao: e.target.checked }))} />
              Disponível na criação de personagem
            </label>

            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setEditando(null)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                Cancelar
              </button>
              <Botao type="submit" disabled={salvando} className="px-4 py-2 text-sm">
                {salvando ? "Salvando..." : "Salvar"}
              </Botao>
            </div>
          </form>
        </div>
      )}
    </Secao>
  );
}

// ======================================================= Árvore de Evolução ==
function AbaArvore({
  classes,
  setErro,
  onClassesAlteradas,
}: {
  classes: ClassAdminApi[];
  setErro: (s: string) => void;
  onClassesAlteradas: () => Promise<void>;
}) {
  const [idClasseSelecionada, setIdClasseSelecionada] = useState<number | "">("");
  const [caminhos, setCaminhos] = useState<ClassEvolutionPathAdminApi[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mostrarNovoCaminho, setMostrarNovoCaminho] = useState<{ estagio: number; idPai: number | null } | null>(null);

  const carregarArvore = useCallback(async (idClasse: number) => {
    setCarregando(true);
    try {
      const dados = await buscarClasseAdmin(idClasse);
      setCaminhos(dados.caminhos);
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível carregar a árvore de evolução."));
    } finally {
      setCarregando(false);
    }
  }, [setErro]);

  useEffect(() => {
    if (idClasseSelecionada !== "") carregarArvore(idClasseSelecionada);
    else setCaminhos([]);
  }, [idClasseSelecionada, carregarArvore]);

  async function recarregar() {
    if (idClasseSelecionada !== "") await carregarArvore(idClasseSelecionada);
    await onClassesAlteradas();
  }

  const estagio1 = caminhos.filter((c) => c.estagio === 1);
  const filhosDe = (idPai: number) => caminhos.filter((c) => c.estagio === 2 && c.id_evolucao_pai === idPai);

  return (
    <Secao titulo="Árvore de Evolução">
      <label className="mb-4 flex flex-col gap-1 text-xs">
        Classe
        <Select value={idClasseSelecionada} onChange={(e) => setIdClasseSelecionada(e.target.value ? Number(e.target.value) : "")}>
          <option value="">Selecione uma classe...</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </Select>
      </label>

      {carregando && <p className="text-sm text-white/50">Carregando...</p>}

      {idClasseSelecionada !== "" && !carregando && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase text-white/50">Estágio 1 (Lv.40)</p>
              <Botao type="button" onClick={() => setMostrarNovoCaminho({ estagio: 1, idPai: null })}>+ Novo caminho</Botao>
            </div>
            <div className="flex flex-col gap-3">
              {estagio1.length === 0 && <p className="text-sm text-white/40">Nenhum caminho de estágio 1 cadastrado.</p>}
              {estagio1.map((caminho) => (
                <BlocoCaminho
                  key={caminho.id}
                  caminho={caminho}
                  filhos={filhosDe(caminho.id)}
                  onRecarregar={recarregar}
                  setErro={setErro}
                  onNovoFilho={() => setMostrarNovoCaminho({ estagio: 2, idPai: caminho.id })}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {mostrarNovoCaminho && idClasseSelecionada !== "" && (
        <ModalNovoCaminho
          idClasse={idClasseSelecionada}
          estagio={mostrarNovoCaminho.estagio}
          idPai={mostrarNovoCaminho.idPai}
          onFechar={() => setMostrarNovoCaminho(null)}
          onCriado={async () => {
            setMostrarNovoCaminho(null);
            await recarregar();
          }}
          setErro={setErro}
        />
      )}
    </Secao>
  );
}

function ModalNovoCaminho({
  idClasse,
  estagio,
  idPai,
  onFechar,
  onCriado,
  setErro,
}: {
  idClasse: number;
  estagio: number;
  idPai: number | null;
  onFechar: () => void;
  onCriado: () => Promise<void>;
  setErro: (s: string) => void;
}) {
  const [form, setForm] = useState<PayloadCaminhoAdmin>({ slug: "", nome: "", descricao: "", estagio, id_evolucao_pai: idPai ?? undefined });
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      await criarCaminhoEvolucaoAdmin(idClasse, form);
      await onCriado();
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível criar o caminho."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4" onClick={onFechar}>
      <form
        onSubmit={salvar}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-5 text-white shadow-2xl"
      >
        <p className="font-imFeel text-xl text-[#F3B43F]">Novo caminho — Estágio {estagio}</p>
        <label className="flex flex-col gap-1 text-xs">Slug
          <Input required value={form.slug ?? ""} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
        </label>
        <label className="flex flex-col gap-1 text-xs">Nome
          <Input required value={form.nome ?? ""} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
        </label>
        <label className="flex flex-col gap-1 text-xs">Descrição
          <Input required value={form.descricao ?? ""} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["bonus_forca", "bonus_vitalidade", "bonus_agilidade", "bonus_inteligencia", "bonus_velocidade"] as const).map((campo) => (
            <label key={campo} className="flex flex-col gap-1 text-xs capitalize">
              {campo.replace("bonus_", "")}
              <Input type="number" value={form[campo] ?? 0} onChange={(e) => setForm((f) => ({ ...f, [campo]: Number(e.target.value) }))} />
            </label>
          ))}
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onFechar} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
          <Botao type="submit" disabled={salvando} className="px-4 py-2 text-sm">{salvando ? "Criando..." : "Criar"}</Botao>
        </div>
      </form>
    </div>
  );
}

function BlocoCaminho({
  caminho,
  filhos,
  onRecarregar,
  setErro,
  onNovoFilho,
}: {
  caminho: ClassEvolutionPathAdminApi;
  filhos: ClassEvolutionPathAdminApi[];
  onRecarregar: () => Promise<void>;
  setErro: (s: string) => void;
  onNovoFilho: () => void;
}) {
  const [expandido, setExpandido] = useState(false);

  async function alternarAtivo() {
    try {
      await atualizarCaminhoEvolucaoAdmin(caminho.id, { ativo: !caminho.ativo });
      await onRecarregar();
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível mudar o status do caminho."));
    }
  }

  async function excluir() {
    if (!confirm(`Excluir o caminho "${caminho.nome}"? Só é possível se ninguém tiver adquirido e não houver filhos.`)) return;
    try {
      await excluirCaminhoEvolucaoAdmin(caminho.id);
      await onRecarregar();
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível excluir o caminho."));
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => setExpandido((v) => !v)} className="flex flex-1 items-center gap-2 text-left">
          <span className="text-white/50">{expandido ? "▼" : "▶"}</span>
          <span className="font-bold text-white">{caminho.nome}</span>
          <span className="text-xs text-white/40">({caminho.slug})</span>
          {!caminho.ativo && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-white/50">Inativo</span>}
        </button>
        <div className="flex shrink-0 gap-2 text-xs">
          {caminho.estagio === 1 && <button type="button" onClick={onNovoFilho} className="text-[#F3B43F] hover:underline">+ Filho (E2)</button>}
          <button type="button" onClick={alternarAtivo} className="text-white/70 hover:underline">{caminho.ativo ? "Desativar" : "Ativar"}</button>
          <button type="button" onClick={excluir} className="text-red-400 hover:underline">Excluir</button>
        </div>
      </div>

      {expandido && (
        <div className="mt-3 flex flex-col gap-3 border-t border-white/10 pt-3">
          <p className="text-xs text-white/60">{caminho.descricao}</p>
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {caminho.bonus_forca > 0 && <span className="rounded bg-[#F3B43F]/15 px-1.5 py-0.5 font-bold text-[#F3B43F]">+{caminho.bonus_forca} Força</span>}
            {caminho.bonus_vitalidade > 0 && <span className="rounded bg-[#F3B43F]/15 px-1.5 py-0.5 font-bold text-[#F3B43F]">+{caminho.bonus_vitalidade} Vitalidade</span>}
            {caminho.bonus_agilidade > 0 && <span className="rounded bg-[#F3B43F]/15 px-1.5 py-0.5 font-bold text-[#F3B43F]">+{caminho.bonus_agilidade} Agilidade</span>}
            {caminho.bonus_inteligencia > 0 && <span className="rounded bg-[#F3B43F]/15 px-1.5 py-0.5 font-bold text-[#F3B43F]">+{caminho.bonus_inteligencia} Inteligência</span>}
            {caminho.bonus_velocidade > 0 && <span className="rounded bg-[#F3B43F]/15 px-1.5 py-0.5 font-bold text-[#F3B43F]">+{caminho.bonus_velocidade} Velocidade</span>}
          </div>

          <PainelRequisitos caminho={caminho} onRecarregar={onRecarregar} setErro={setErro} />
          <PainelHabilidades caminho={caminho} onRecarregar={onRecarregar} setErro={setErro} />
          <PainelEfeitos caminho={caminho} onRecarregar={onRecarregar} setErro={setErro} />

          {filhos.length > 0 && (
            <div className="mt-1 flex flex-col gap-2 border-l-2 border-purple-400/40 pl-3">
              <p className="text-[10px] font-bold uppercase text-purple-300">Estágio 2 (filhos deste caminho)</p>
              {filhos.map((filho) => (
                <BlocoCaminho key={filho.id} caminho={filho} filhos={[]} onRecarregar={onRecarregar} setErro={setErro} onNovoFilho={() => {}} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PainelRequisitos({ caminho, onRecarregar, setErro }: { caminho: ClassEvolutionPathAdminApi; onRecarregar: () => Promise<void>; setErro: (s: string) => void }) {
  const [tipo, setTipo] = useState<TipoRequisitoEvolucaoApi>("LEVEL");
  const [quantidade, setQuantidade] = useState(1);
  const [referenceId, setReferenceId] = useState<number | "">("");
  const [referenceKey, setReferenceKey] = useState("");
  const [salvando, setSalvando] = useState(false);
  const { itens } = useItensParaSelecaoAdmin();

  async function adicionar() {
    setSalvando(true);
    setErro("");
    try {
      await criarRequisitoEvolucaoAdmin(caminho.id, {
        tipo,
        quantidade,
        reference_id: tipo === "ITEM" ? (referenceId === "" ? undefined : referenceId) : undefined,
        reference_key: ["MONSTER_KILL", "ADVENTURE_GUILD_RANK", "ACHIEVEMENT"].includes(tipo) ? referenceKey : undefined,
      });
      setQuantidade(1);
      setReferenceId("");
      setReferenceKey("");
      await onRecarregar();
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível adicionar o requisito."));
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: number) {
    try {
      await excluirRequisitoEvolucaoAdmin(id);
      await onRecarregar();
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível remover o requisito."));
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-2">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-white/50">Requisitos</p>
      <div className="flex flex-col gap-1.5 text-xs">
        {caminho.requisitos.length === 0 && <p className="text-white/40">Nenhum — evoluir pra cá é sempre liberado.</p>}
        {caminho.requisitos.map((req) => (
          <div key={req.id} className="border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
            <div className="flex items-center justify-between gap-2">
              <span>
                {ROTULO_TIPO_REQUISITO[req.tipo]}: {req.tipo === "ITEM" ? `${req.quantidade}x ${req.item?.nome ?? `#${req.reference_id}`}` : req.tipo === "GOLD" ? req.quantidade : req.tipo === "LEVEL" ? req.quantidade : req.reference_key ?? req.quantidade}
              </span>
              <button type="button" onClick={() => remover(req.id)} className="text-red-400 hover:underline">Remover</button>
            </div>
            {req.tipo === "ITEM" && req.reference_id && (
              <PainelDropDoItem idItem={req.reference_id} nomeItem={req.item?.nome ?? `Item #${req.reference_id}`} setErro={setErro} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-1.5">
        <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoRequisitoEvolucaoApi)} className="text-[11px]">
          {TIPOS_REQUISITO.map((t) => <option key={t} value={t}>{ROTULO_TIPO_REQUISITO[t]}</option>)}
        </Select>
        {tipo === "ITEM" ? (
          <div className="w-40"><ItemSelect itens={itens} value={referenceId} onChange={setReferenceId} /></div>
        ) : tipo === "ADVENTURE_GUILD_RANK" ? (
          <Select value={referenceKey} onChange={(e) => setReferenceKey(e.target.value)} className="text-[11px]">
            <option value="">Rank...</option>
            {RANKS_AVENTUREIRO.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        ) : tipo === "MONSTER_KILL" || tipo === "ACHIEVEMENT" ? (
          <Input placeholder={tipo === "MONSTER_KILL" ? "Nome do monstro" : "Key da conquista"} value={referenceKey} onChange={(e) => setReferenceKey(e.target.value)} className="w-32 text-[11px]" />
        ) : null}
        {tipo !== "ADVENTURE_GUILD_RANK" && (
          <Input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} className="w-16 text-[11px]" />
        )}
        <Botao type="button" onClick={adicionar} disabled={salvando || tipo === "REPUTATION" || tipo === "QUEST"} className="text-[11px]">+ Adicionar</Botao>
      </div>
    </div>
  );
}

// Configura ONDE um item exigido por um requisito ITEM realmente cai —
// reaproveita o mesmo AdventureMonsterLoot (§20/§21) da Aventura, nunca
// duplica um sistema de drop próprio de Classes. Sem isso, um item
// Mítico exigido pra evoluir só teria a chance genérica gigantesca de
// qualquer Material Mítico do jogo (ver dropService.js) — aqui o admin
// escolhe monstro + % de verdade, curado, igual qualquer outro drop.
function PainelDropDoItem({ idItem, nomeItem, setErro }: { idItem: number; nomeItem: string; setErro: (s: string) => void }) {
  const [drops, setDrops] = useState<AdventureMonsterLootApi[]>([]);
  const [monstros, setMonstros] = useState<AdventureMonsterApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [idMonstro, setIdMonstro] = useState<number | "">("");
  const [percentual, setPercentual] = useState(5);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [lista, catalogo] = await Promise.all([listarLootAdmin(undefined, idItem), listarMonstrosAdmin()]);
      setDrops(lista);
      setMonstros(catalogo);
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível carregar onde este item dropa."));
    } finally {
      setCarregando(false);
    }
  }, [idItem, setErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function adicionar() {
    if (idMonstro === "") return;
    setSalvando(true);
    setErro("");
    try {
      await criarLootAdmin({ id_monstro: idMonstro, id_item: idItem, chance_ppm: Math.max(1, Math.round(percentual * 10000)) });
      setIdMonstro("");
      await carregar();
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível configurar o drop."));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(drop: AdventureMonsterLootApi) {
    try {
      await atualizarLootAdmin(drop.id, { ativo: !drop.ativo });
      await carregar();
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível mudar o status do drop."));
    }
  }

  const monstrosDisponiveis = monstros.filter((m) => !drops.some((d) => d.id_monstro === m.id));

  return (
    <div className="ml-1 mt-1.5 rounded-lg border border-dashed border-[#F3B43F]/30 bg-black/20 p-2">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#F3B43F]/70">
        Onde &quot;{nomeItem}&quot; dropa
      </p>
      {carregando ? (
        <p className="text-[10px] text-white/40">Carregando...</p>
      ) : drops.length === 0 ? (
        <p className="text-[10px] text-white/40">
          Nenhum monstro configurado ainda — esse item só sai pelo pool genérico (chance mínima) ou concessão
          administrativa até você adicionar um drop curado abaixo.
        </p>
      ) : (
        <div className="mb-1.5 flex flex-col gap-0.5 text-[10px]">
          {drops.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2">
              <span className={d.ativo ? "text-white/80" : "text-white/30 line-through"}>
                {d.AdventureMonster?.nome ?? `Monstro #${d.id_monstro}`} — {(d.chance_ppm / 10000).toFixed(2)}% por vitória
              </span>
              <button type="button" onClick={() => alternarAtivo(d)} className="text-white/50 hover:underline">
                {d.ativo ? "Desativar" : "Ativar"}
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-end gap-1.5">
        <Select value={idMonstro} onChange={(e) => setIdMonstro(e.target.value ? Number(e.target.value) : "")} className="text-[10px]">
          <option value="">Monstro...</option>
          {monstrosDisponiveis.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </Select>
        <label className="flex items-center gap-1 text-[10px] text-white/50">
          <input
            type="number"
            min={0.01}
            max={100}
            step={0.01}
            value={percentual}
            onChange={(e) => setPercentual(Number(e.target.value))}
            className="w-16 rounded border border-white/20 bg-black/30 px-1.5 py-1"
          />
          %
        </label>
        <Botao type="button" onClick={adicionar} disabled={salvando || idMonstro === ""} className="text-[10px]">
          + Configurar drop
        </Botao>
      </div>
    </div>
  );
}

function PainelHabilidades({ caminho, onRecarregar, setErro }: { caminho: ClassEvolutionPathAdminApi; onRecarregar: () => Promise<void>; setErro: (s: string) => void }) {
  const [idPower, setIdPower] = useState<number | "">("");
  const [salvando, setSalvando] = useState(false);
  const { powers } = usePowersParaSelecaoAdmin();

  async function adicionar() {
    if (idPower === "") return;
    setSalvando(true);
    setErro("");
    try {
      await criarHabilidadeEvolucaoAdmin(caminho.id, { id_power: idPower });
      setIdPower("");
      await onRecarregar();
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível vincular a habilidade."));
    } finally {
      setSalvando(false);
    }
  }
  async function remover(id: number) {
    try {
      await excluirHabilidadeEvolucaoAdmin(id);
      await onRecarregar();
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível remover a habilidade."));
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-2">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-white/50">Habilidades concedidas</p>
      <div className="flex flex-col gap-1 text-xs">
        {caminho.habilidadesConcedidas.length === 0 && <p className="text-white/40">Nenhuma.</p>}
        {caminho.habilidadesConcedidas.map((h) => (
          <div key={h.id} className="flex items-center justify-between gap-2">
            <span>{h.power?.nome ?? `Power #${h.id_power}`}</span>
            <button type="button" onClick={() => remover(h.id)} className="text-red-400 hover:underline">Remover</button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-end gap-1.5">
        <div className="w-52"><PowerSelect powers={powers} value={idPower} onChange={setIdPower} /></div>
        <Botao type="button" onClick={adicionar} disabled={salvando || idPower === ""} className="text-[11px]">+ Vincular</Botao>
      </div>
    </div>
  );
}

function PainelEfeitos({ caminho, onRecarregar, setErro }: { caminho: ClassEvolutionPathAdminApi; onRecarregar: () => Promise<void>; setErro: (s: string) => void }) {
  const [catalogo, setCatalogo] = useState<EfeitoCatalogoAdminApi[]>([]);
  const [effectKey, setEffectKey] = useState("");
  const [valor, setValor] = useState(0);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    catalogoEfeitosEvolucaoAdmin().then(setCatalogo).catch(() => {});
  }, []);

  const implementados = catalogo.filter((e) => e.implementado);

  async function adicionar() {
    if (!effectKey) return;
    setSalvando(true);
    setErro("");
    try {
      await criarEfeitoEvolucaoAdmin(caminho.id, { effect_key: effectKey as EfeitoCatalogoAdminApi["effect_key"], valor });
      setEffectKey("");
      setValor(0);
      await onRecarregar();
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível adicionar o efeito."));
    } finally {
      setSalvando(false);
    }
  }
  async function remover(id: number) {
    try {
      await excluirEfeitoEvolucaoAdmin(id);
      await onRecarregar();
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível remover o efeito."));
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-2">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-white/50">Efeitos mecânicos</p>
      <div className="flex flex-col gap-1 text-xs">
        {caminho.efeitos.length === 0 && <p className="text-white/40">Nenhum.</p>}
        {caminho.efeitos.map((ef) => (
          <div key={ef.id} className="flex items-center justify-between gap-2">
            <span>{ef.effect_key}: {ef.valor}{!ef.ativo ? " (inativo)" : ""}</span>
            <button type="button" onClick={() => remover(ef.id)} className="text-red-400 hover:underline">Remover</button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-end gap-1.5">
        <Select value={effectKey} onChange={(e) => setEffectKey(e.target.value)} className="text-[11px]">
          <option value="">Efeito implementado...</option>
          {implementados.map((e) => <option key={e.effect_key} value={e.effect_key}>{e.effect_key}</option>)}
        </Select>
        <Input type="number" step="0.1" value={valor} onChange={(e) => setValor(Number(e.target.value))} className="w-20 text-[11px]" />
        <Botao type="button" onClick={adicionar} disabled={salvando || !effectKey} className="text-[11px]">+ Adicionar</Botao>
      </div>
      {catalogo.length > implementados.length && (
        <p className="mt-1.5 text-[10px] text-white/40">
          {catalogo.length - implementados.length} effect_key(s) documentadas no catálogo mas ainda sem integração no motor de
          combate — não aparecem aqui até serem implementadas.
        </p>
      )}
    </div>
  );
}

// ============================================================ Simulador ==
function AbaSimulador({ classes, setErro }: { classes: ClassAdminApi[]; setErro: (s: string) => void }) {
  const [idClasse, setIdClasse] = useState<number | "">("");
  const [caminhos, setCaminhos] = useState<ClassEvolutionPathAdminApi[]>([]);
  const [idEstagio1, setIdEstagio1] = useState<number | "">("");
  const [idEstagio2, setIdEstagio2] = useState<number | "">("");
  const [resultado, setResultado] = useState<ResultadoSimuladorClassesApi | null>(null);
  const [simulando, setSimulando] = useState(false);

  useEffect(() => {
    if (idClasse === "") { setCaminhos([]); return; }
    buscarClasseAdmin(idClasse).then((d) => setCaminhos(d.caminhos)).catch(() => {});
    setIdEstagio1("");
    setIdEstagio2("");
    setResultado(null);
  }, [idClasse]);

  const opcoesEstagio1 = useMemo(() => caminhos.filter((c) => c.estagio === 1), [caminhos]);
  const opcoesEstagio2 = useMemo(
    () => (idEstagio1 === "" ? [] : caminhos.filter((c) => c.estagio === 2 && c.id_evolucao_pai === idEstagio1)),
    [caminhos, idEstagio1],
  );

  async function simular() {
    if (idClasse === "") return;
    setSimulando(true);
    setErro("");
    setResultado(null);
    try {
      setResultado(
        await simularEvolucaoClasseAdmin({
          id_classe: idClasse,
          id_caminho_estagio1: idEstagio1 === "" ? undefined : idEstagio1,
          id_caminho_estagio2: idEstagio2 === "" ? undefined : idEstagio2,
        }),
      );
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível simular a evolução."));
    } finally {
      setSimulando(false);
    }
  }

  return (
    <Secao titulo="Simulador de Evolução">
      <p className="mb-3 text-xs text-white/60">
        Soma os bônus de atributos, o efeito de defesa (DAMAGE_REDUCTION) e as habilidades concedidas pelos
        caminhos escolhidos — os mesmos dados que o jogo lê de verdade, sem precisar de um personagem real.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs">Classe
          <Select value={idClasse} onChange={(e) => setIdClasse(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Selecione...</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs">Estágio 1
          <Select value={idEstagio1} onChange={(e) => { setIdEstagio1(e.target.value ? Number(e.target.value) : ""); setIdEstagio2(""); }} disabled={idClasse === ""}>
            <option value="">Nenhum</option>
            {opcoesEstagio1.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs">Estágio 2
          <Select value={idEstagio2} onChange={(e) => setIdEstagio2(e.target.value ? Number(e.target.value) : "")} disabled={idEstagio1 === "" || opcoesEstagio2.length === 0}>
            <option value="">Nenhum</option>
            {opcoesEstagio2.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
        </label>
        <Botao type="button" onClick={simular} disabled={simulando || idClasse === ""}>{simulando ? "Simulando..." : "Simular"}</Botao>
      </div>

      {resultado && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white">
          <p className="mb-2 font-bold text-[#F3B43F]">
            {resultado.classe.nome}
            {resultado.caminho_estagio1 ? ` → ${resultado.caminho_estagio1.nome}` : ""}
            {resultado.caminho_estagio2 ? ` → ${resultado.caminho_estagio2.nome}` : ""}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(resultado.bonus_total).map(([atributo, valor]) => (
              <span key={atributo} className="rounded bg-[#F3B43F]/15 px-2 py-1 font-bold text-[#F3B43F]">
                {atributo}: +{valor}
              </span>
            ))}
          </div>
          {resultado.habilidades_concedidas.length > 0 && (
            <div className="mt-2 text-xs text-white/70">
              Habilidades: {resultado.habilidades_concedidas.map((h) => h.nome ?? `#${h.id_power}`).join(", ")}
            </div>
          )}
        </div>
      )}
    </Secao>
  );
}

// ============================================================ Validador ==
function AbaValidador({ setErro }: { setErro: (s: string) => void }) {
  const [resultado, setResultado] = useState<ResultadoValidadorClassesApi | null>(null);
  const [validando, setValidando] = useState(false);

  async function validar() {
    setValidando(true);
    setErro("");
    try {
      setResultado(await validarClassesAdmin());
    } catch (e) {
      setErro(mensagemDeErroAdmin(e, "Não foi possível validar as classes."));
    } finally {
      setValidando(false);
    }
  }

  return (
    <Secao titulo="Validador de Integridade">
      <p className="mb-3 text-xs text-white/60">
        Varre toda a árvore de classes/evoluções e sinaliza inconsistências — nunca corrige nada sozinho, só
        relata. &quot;Erro&quot; bloqueia expectativa real do jogador; &quot;aviso&quot; é uma decisão de design
        que pode ser proposital.
      </p>
      <Botao type="button" onClick={validar} disabled={validando}>{validando ? "Validando..." : "Rodar validação"}</Botao>

      {resultado && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-sm text-white/80">
            {resultado.total_problemas} problema(s) encontrado(s), sendo {resultado.total_erros} erro(s).
          </p>
          {resultado.problemas.length === 0 && <p className="text-sm text-green-400">Nenhum problema encontrado.</p>}
          {resultado.problemas.map((p, i) => (
            <div
              key={i}
              className={`rounded-lg border p-2 text-xs ${
                p.nivel === "erro" ? "border-red-500/40 bg-red-950/30 text-red-300" : "border-yellow-500/40 bg-yellow-950/20 text-yellow-300"
              }`}
            >
              <span className="mr-2 font-bold uppercase">{p.nivel}</span>
              <span className="text-white/50">[{p.entidade} #{p.id}]</span> {p.mensagem}
            </div>
          ))}
        </div>
      )}
    </Secao>
  );
}
