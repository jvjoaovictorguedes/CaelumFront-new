"use client";

// Ameaça Mundial V2 §13.4 — Balanceamento: preview de dano DA FASE
// (ataque básico do Boss), servido pelo backend com a MESMA fórmula do
// relógio de combate real (worldBossRuntimeService.furiaPctDe) — nunca
// recalculado aqui. Preview de dano/cura de uma HABILIDADE específica
// fica na própria aba Habilidades (fica mais fácil de comparar contra
// o cadastro daquela habilidade).
import { useCallback, useEffect, useState } from "react";
import { mensagemDeErroAdmin, previewDanoWorldBossAdmin, type WorldBossPhaseApi, type WorldBossPreviewDanoApi } from "@/lib/api/admin";
import { BTN_GHOST, INPUT_XS, LABEL_XS } from "./styles";

const ACOES_PADRAO = [1, 5, 10, 20, 50, 100];

export default function WorldBossBalanceTab({ configId, fases }: { configId: number; fases: WorldBossPhaseApi[] }) {
  const [faseOrdem, setFaseOrdem] = useState<number | "">(fases[0]?.ordem ?? "");
  const [preview, setPreview] = useState<WorldBossPreviewDanoApi | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const buscar = useCallback(async () => {
    if (fases.length === 0) return;
    setCarregando(true);
    setErro("");
    try {
      setPreview(await previewDanoWorldBossAdmin(configId, { faseOrdem: faseOrdem === "" ? undefined : faseOrdem, acoes: ACOES_PADRAO }));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível calcular o preview de dano."));
    } finally {
      setCarregando(false);
    }
  }, [configId, faseOrdem, fases.length]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  if (fases.length === 0) return <p className="text-sm text-white/50">Cadastre pelo menos uma fase pra ver o preview de dano.</p>;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-white/50">
        Estimativa ILUSTRATIVA do dano do ataque básico do Boss (sem mitigação de defesa — depende do alvo real) conforme o número de ações já
        executadas nesta fase, refletindo o crescimento de Fúria configurado.
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <label className={LABEL_XS}>
          Fase
          <select value={faseOrdem} onChange={(e) => setFaseOrdem(Number(e.target.value))} className={INPUT_XS}>
            {fases.map((f) => (
              <option key={f.ordem} value={f.ordem}>{f.nome_fase || `Fase ${f.ordem}`}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={buscar} className={BTN_GHOST}>Recalcular</button>
      </div>

      {erro && <p className="text-xs text-red-400">{erro}</p>}
      {carregando && <p className="text-sm text-white/50">Calculando...</p>}

      {preview && !carregando && (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-sm text-white/80">
            <thead>
              <tr className="border-b border-white/10 uppercase text-white/50">
                <th className="px-3 py-2">Ação Nº</th>
                <th className="px-3 py-2">Fúria</th>
                <th className="px-3 py-2">Dano mín.</th>
                <th className="px-3 py-2">Dano máx.</th>
              </tr>
            </thead>
            <tbody>
              {preview.estimativas.map((e) => (
                <tr key={e.acao} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold">{e.acao}ª</td>
                  <td className="px-3 py-2">{e.furia_pct}%{preview.fase.limite_furia_pct !== null && e.furia_pct >= preview.fase.limite_furia_pct && " (limite)"}</td>
                  <td className="px-3 py-2">{e.dano_min}</td>
                  <td className="px-3 py-2">{e.dano_max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
