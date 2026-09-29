"use client";

// Ameaça Mundial V2 §14.2 — Simulador de balanceamento: roda N combates
// sintéticos server-side entre o relógio real do Boss e um perfil de
// personagem (HP/Defesa/Agilidade). Mede a LETALIDADE do Boss contra
// esse perfil — nunca simula o ataque dos jogadores nele (isso exigiria
// reproduzir uma raid inteira, fora do escopo desta V1 por decisão
// explícita do backend).
import { useState } from "react";
import { mensagemDeErroAdmin, simularBalanceamentoWorldBossAdmin, type WorldBossSimulacaoResultadoApi } from "@/lib/api/admin";
import { BTN, CARD, INPUT, LABEL } from "./styles";

export default function WorldBossSimulatorPanel({ configId }: { configId: number }) {
  const [hpMaximo, setHpMaximo] = useState(1000);
  const [defesa, setDefesa] = useState(0);
  const [agilidade, setAgilidade] = useState(0);
  const [dpsAgregado, setDpsAgregado] = useState<string>("");
  const [acoesPorFase, setAcoesPorFase] = useState<string>("");
  const [quantidadeSimulacoes, setQuantidadeSimulacoes] = useState(200);
  const [resultado, setResultado] = useState<WorldBossSimulacaoResultadoApi | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function simular() {
    setCarregando(true);
    setErro("");
    try {
      const dados = await simularBalanceamentoWorldBossAdmin(configId, {
        personagem: { hp_maximo: hpMaximo, defesa, agilidade },
        dps_agregado: dpsAgregado === "" ? undefined : Number(dpsAgregado),
        acoes_por_fase: acoesPorFase === "" ? undefined : Number(acoesPorFase),
        quantidade_simulacoes: quantidadeSimulacoes,
      });
      setResultado(dados);
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível rodar a simulação."));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className={CARD}>
      <p className="mb-1 font-imFeel text-lg text-[#F3B43F]">Simulador de balanceamento</p>
      <p className="mb-3 text-xs text-white/50">
        Roda N combates sintéticos contra um perfil de personagem (HP/Defesa/Agilidade) usando o relógio real do Boss (dano, Fúria, fases,
        cooldowns e IA de habilidades) — mede a letalidade do Boss, não simula o ataque dos jogadores contra ele.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className={LABEL}>
          HP do personagem-perfil
          <input type="number" min={1} value={hpMaximo} onChange={(e) => setHpMaximo(Number(e.target.value))} className={INPUT} />
        </label>
        <label className={LABEL}>
          Defesa
          <input type="number" min={0} value={defesa} onChange={(e) => setDefesa(Number(e.target.value))} className={INPUT} />
        </label>
        <label className={LABEL}>
          Agilidade
          <input type="number" min={0} value={agilidade} onChange={(e) => setAgilidade(Number(e.target.value))} className={INPUT} />
        </label>
        <label className={LABEL}>
          DPS agregado da raid (opcional)
          <input type="number" min={0} placeholder="Nº fixo de ações/fase" value={dpsAgregado} onChange={(e) => setDpsAgregado(e.target.value)} className={INPUT} />
        </label>
        <label className={LABEL}>
          Ações por fase (se sem DPS)
          <input type="number" min={1} placeholder="30 (padrão)" value={acoesPorFase} onChange={(e) => setAcoesPorFase(e.target.value)} className={INPUT} />
        </label>
        <label className={LABEL}>
          Quantidade de simulações
          <input type="number" min={1} max={1000} value={quantidadeSimulacoes} onChange={(e) => setQuantidadeSimulacoes(Number(e.target.value))} className={INPUT} />
        </label>
      </div>

      <button type="button" disabled={carregando} onClick={simular} className={`${BTN} mt-3`}>
        {carregando ? "Simulando..." : "Rodar simulação"}
      </button>

      {erro && <p className="mt-2 text-xs text-red-400">{erro}</p>}

      {resultado && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 text-sm text-white/80 sm:grid-cols-4">
            <div>
              <p className="text-[10px] uppercase text-white/40">Taxa de sobrevivência</p>
              <p className="font-bold text-[#F3B43F]">{resultado.taxa_sobrevivencia_pct}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-white/40">Ação média até derrotar</p>
              <p>{resultado.acao_media_ate_derrotar ?? "— (nunca morreu)"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-white/40">Fase mais letal</p>
              <p>{resultado.fase_mais_letal ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-white/40">Fúria média / máxima</p>
              <p>{resultado.furia_media_pct}% / {resultado.furia_maxima_pct}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-white/40">Mana gasta (média)</p>
              <p>{resultado.mana_gasta_media}</p>
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] uppercase text-white/40">Dano por fase</p>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-left text-xs text-white/80">
                <thead>
                  <tr className="border-b border-white/10 uppercase text-white/50">
                    <th className="px-2 py-1">Fase</th>
                    <th className="px-2 py-1">Ações estimadas</th>
                    <th className="px-2 py-1">Duração estimada</th>
                    <th className="px-2 py-1">Dano médio</th>
                    <th className="px-2 py-1">Min / Max</th>
                    <th className="px-2 py-1">Alcançada em</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.dano_por_fase.map((f) => (
                    <tr key={f.ordem} className="border-b border-white/5">
                      <td className="px-2 py-1 font-bold">{f.nome_fase}</td>
                      <td className="px-2 py-1">{f.acoes_estimadas}</td>
                      <td className="px-2 py-1">{Math.round(f.duracao_estimada_ms / 1000)}s</td>
                      <td className="px-2 py-1">{f.dano_medio}</td>
                      <td className="px-2 py-1">{f.dano_min} / {f.dano_max}</td>
                      <td className="px-2 py-1">{f.alcancada_em_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] uppercase text-white/40">Frequência de Powers</p>
            {resultado.frequencia_powers.length === 0 ? (
              <p className="text-xs text-white/50">Nenhuma habilidade foi usada — o Boss só ataca com o dano básico.</p>
            ) : (
              <ul className="flex flex-wrap gap-2 text-xs text-white/80">
                {resultado.frequencia_powers.map((p) => (
                  <li key={p.nome} className="rounded bg-black/30 px-2 py-1">{p.nome}: {p.usos_medios_por_simulacao}/simulação</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
