"use client";

import { useCallback, useEffect, useState } from "react";
import {
  atualizarVersaoEventPuzzleAdmin,
  criarVersaoEventPuzzleAdmin,
  listarVersoesEventPuzzleAdmin,
  mensagemDeErroAdmin,
  transicionarVersaoEventPuzzleAdmin,
  validarSolvabilidadeEventPuzzleAdmin,
  type PuzzleBlueprintVersionApi,
  type PuzzleBlueprintVersionStatus,
  type PuzzleSolvabilidadeAcaoApi,
  type PuzzleSolvabilidadeResultadoApi,
} from "@/lib/api/admin";
import { BTN, BTN_GHOST, CARD, INPUT_XS } from "./styles";
import PuzzlePreview from "./PuzzlePreview";

const STATUS_LABEL: Record<PuzzleBlueprintVersionStatus, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicada",
  ARCHIVED: "Arquivada",
};
const PROXIMOS_STATUS: Record<PuzzleBlueprintVersionStatus, PuzzleBlueprintVersionStatus[]> = {
  DRAFT: ["PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: [],
};

function tentarParsear(texto: string): { valor: unknown; erro: string | null } {
  try {
    return { valor: JSON.parse(texto), erro: null };
  } catch (e) {
    return { valor: null, erro: e instanceof Error ? e.message : "JSON inválido." };
  }
}

export default function VersionsSection({
  idBlueprint,
  editavel,
  setErroGlobal,
}: {
  idBlueprint: number;
  editavel: boolean;
  setErroGlobal: (s: string) => void;
}) {
  const [versoes, setVersoes] = useState<PuzzleBlueprintVersionApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [idSelecionada, setIdSelecionada] = useState<number | null>(null);
  const [configTexto, setConfigTexto] = useState("{}");
  const [erroJson, setErroJson] = useState<string | null>(null);
  const [acoesTexto, setAcoesTexto] = useState("[]");
  const [erroAcoesJson, setErroAcoesJson] = useState<string | null>(null);
  const [resultadoValidacao, setResultadoValidacao] = useState<PuzzleSolvabilidadeResultadoApi | null>(null);
  const [validando, setValidando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const lista = await listarVersoesEventPuzzleAdmin(idBlueprint);
      setVersoes(lista);
      if (lista.length > 0 && idSelecionada === null) {
        setIdSelecionada(lista[0].id);
        setConfigTexto(JSON.stringify(lista[0].config, null, 2));
      }
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível carregar as versões."));
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idBlueprint]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const versaoSelecionada = versoes.find((v) => v.id === idSelecionada) ?? null;

  function selecionar(v: PuzzleBlueprintVersionApi) {
    setIdSelecionada(v.id);
    setConfigTexto(JSON.stringify(v.config, null, 2));
    setErroJson(null);
    setResultadoValidacao(null);
  }

  async function criarNova() {
    try {
      const nova = await criarVersaoEventPuzzleAdmin(idBlueprint, {});
      await carregar();
      selecionar(nova);
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível criar a revisão."));
    }
  }

  function onMudarConfig(texto: string) {
    setConfigTexto(texto);
    const { erro } = tentarParsear(texto);
    setErroJson(erro);
  }

  async function salvarConfig() {
    if (!versaoSelecionada) return;
    const { valor, erro } = tentarParsear(configTexto);
    if (erro) {
      setErroJson(erro);
      return;
    }
    setSalvando(true);
    try {
      const atualizada = await atualizarVersaoEventPuzzleAdmin(versaoSelecionada.id, valor as Record<string, unknown>);
      await carregar();
      selecionar(atualizada);
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível salvar o config."));
    } finally {
      setSalvando(false);
    }
  }

  async function transicionar(status: PuzzleBlueprintVersionStatus) {
    if (!versaoSelecionada) return;
    try {
      const atualizada = await transicionarVersaoEventPuzzleAdmin(versaoSelecionada.id, status);
      await carregar();
      selecionar(atualizada);
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível transicionar a revisão."));
    }
  }

  function onMudarAcoes(texto: string) {
    setAcoesTexto(texto);
    const { erro } = tentarParsear(texto);
    setErroAcoesJson(erro);
  }

  async function validar() {
    if (!versaoSelecionada) return;
    const { valor, erro } = tentarParsear(acoesTexto);
    if (erro) {
      setErroAcoesJson(erro);
      return;
    }
    setValidando(true);
    setResultadoValidacao(null);
    try {
      const resultado = await validarSolvabilidadeEventPuzzleAdmin(versaoSelecionada.id, valor as PuzzleSolvabilidadeAcaoApi[]);
      setResultadoValidacao(resultado);
      await carregar();
    } catch (error) {
      setErroGlobal(mensagemDeErroAdmin(error, "Não foi possível validar a solvabilidade."));
    } finally {
      setValidando(false);
    }
  }

  const configParaPreview = erroJson ? null : tentarParsear(configTexto).valor;

  if (carregando) return <p className="text-sm text-white/50">Carregando...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {versoes.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => selecionar(v)}
              className={`rounded px-2 py-1 text-xs font-bold ${v.id === idSelecionada ? "bg-[#F3B43F] text-black" : "border border-white/20 text-white/70 hover:bg-white/10"}`}
            >
              v{v.version} · {STATUS_LABEL[v.status]}
            </button>
          ))}
        </div>
        {editavel && (
          <button type="button" onClick={criarNova} className={BTN}>
            + Nova revisão
          </button>
        )}
      </div>

      {versaoSelecionada && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
            <span>
              Status: <span className="font-bold text-[#F3B43F]">{STATUS_LABEL[versaoSelecionada.status]}</span>
            </span>
            {versaoSelecionada.solvability_signature && (
              <span>
                Assinatura de solvabilidade: <code className="text-white/80">{versaoSelecionada.solvability_signature}</code> (validada em{" "}
                {versaoSelecionada.solvability_validated_at ? new Date(versaoSelecionada.solvability_validated_at).toLocaleString("pt-BR") : "—"})
              </span>
            )}
            {editavel &&
              PROXIMOS_STATUS[versaoSelecionada.status].map((proximo) => (
                <button key={proximo} type="button" onClick={() => transicionar(proximo)} className={BTN_GHOST}>
                  → {STATUS_LABEL[proximo]}
                </button>
              ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={CARD}>
              <p className="mb-2 font-imFeel text-lg text-[#F3B43F]">Config (JSON)</p>
              <p className="mb-2 text-xs text-white/50">
                Estrutura esperada: <code>dominio</code> (MECANICO/OPTICO/HIDRAULICO), <code>components</code>, <code>connections</code>,{" "}
                <code>objectives</code> — ver puzzleEngineCore.js/puzzle*Components.js no backend pros tipos de componente de cada domínio.
                Só editável enquanto a revisão está em Rascunho.
              </p>
              <textarea
                disabled={!editavel || versaoSelecionada.status !== "DRAFT"}
                value={configTexto}
                onChange={(e) => onMudarConfig(e.target.value)}
                rows={18}
                spellCheck={false}
                className={`${INPUT_XS} w-full font-mono disabled:opacity-60`}
              />
              {erroJson && <p className="mt-1 text-xs text-red-400">JSON inválido: {erroJson}</p>}
              {editavel && versaoSelecionada.status === "DRAFT" && (
                <button type="button" disabled={!!erroJson || salvando} onClick={salvarConfig} className={`${BTN} mt-2`}>
                  {salvando ? "Salvando..." : "Salvar config"}
                </button>
              )}
            </div>

            <div className={CARD}>
              <p className="mb-2 font-imFeel text-lg text-[#F3B43F]">Preview da topologia (somente leitura)</p>
              <p className="mb-2 text-xs text-white/50">
                Renderiza com os MESMOS componentes visuais do jogo (Fases 4/5/6), mostrando cada peça em repouso — nunca uma simulação.
              </p>
              <PuzzlePreview config={configParaPreview} />
            </div>
          </div>

          <div className={CARD}>
            <p className="mb-1 font-imFeel text-lg text-[#F3B43F]">Validar solvabilidade (dry-run)</p>
            <p className="mb-2 text-xs text-white/50">
              Nunca um solver automático: cole a sequência de ações candidata (a golden solution que você pretende) e o backend simula
              exatamente o que o jogador faria, passo a passo — ex.: <code>[{"{"}&quot;type&quot;:&quot;LIGAR&quot;,&quot;componentId&quot;:&quot;motor1&quot;{"}"}]</code>.
            </p>
            <textarea
              value={acoesTexto}
              onChange={(e) => onMudarAcoes(e.target.value)}
              rows={6}
              spellCheck={false}
              className={`${INPUT_XS} w-full font-mono`}
            />
            {erroAcoesJson && <p className="mt-1 text-xs text-red-400">JSON inválido: {erroAcoesJson}</p>}
            <button type="button" disabled={!!erroAcoesJson || validando} onClick={validar} className={`${BTN} mt-2`}>
              {validando ? "Validando..." : "Validar"}
            </button>

            {resultadoValidacao && (
              <div className={`mt-3 rounded-lg border p-3 text-xs ${resultadoValidacao.valido ? "border-green-500/50 bg-green-950/30 text-green-200" : "border-red-500/50 bg-red-950/30 text-red-200"}`}>
                {resultadoValidacao.valido ? (
                  <>
                    <p className="font-bold">✓ Sequência válida — resolve todos os objetivos.</p>
                    <p>
                      Assinatura: <code>{resultadoValidacao.assinatura}</code>
                    </p>
                    <p>Objetivos concluídos: {resultadoValidacao.objetivosConcluidos?.join(", ") || "—"}</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold">✗ Falhou na etapa: {resultadoValidacao.etapa}</p>
                    {resultadoValidacao.erro && <p>Erro: {resultadoValidacao.erro}</p>}
                    {resultadoValidacao.indiceFalha !== undefined && <p>Índice da ação que falhou: {resultadoValidacao.indiceFalha}</p>}
                    {resultadoValidacao.acao && <p>Ação: {JSON.stringify(resultadoValidacao.acao)}</p>}
                    {resultadoValidacao.etapa === "OBJETIVOS_INCOMPLETOS" && (
                      <p>Objetivos concluídos até o fim da sequência: {resultadoValidacao.objetivosConcluidos?.join(", ") || "nenhum"}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {versoes.length === 0 && <p className="text-sm text-white/50">Nenhuma revisão encontrada (inesperado — todo blueprint nasce com a v1).</p>}
    </div>
  );
}
