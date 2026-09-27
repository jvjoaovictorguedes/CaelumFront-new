"use client";

// Simulador de Balanceamento PvE — compartilhado entre o admin de
// Aventura (zonas/monstros/loot) e o admin de PVE (tuning de tempo/
// drops/progressão/emboscada/grupo), pra não duplicar a mesma tela em
// dois lugares. Roda N combates reais (mesmas fórmulas/motor do jogo,
// ver adventureBalanceSimulationService.js no backend) nos 3 modos:
// Aventura (zona), Expedição (emboscada/interrupção) e Aventura em
// Party — sem afetar personagem nenhum de verdade.
import { useEffect, useState } from "react";
import {
  buscarPersonagensAdmin,
  listarMonstrosAdmin,
  listarRegioesExpedicaoAdmin,
  mensagemDeErroAdmin,
  simularBalanceamentoAdventureAdmin,
  type AdventureMonsterApi,
  type ExpeditionRegionAdminApi,
  type GrantSearchResultApi,
  type ModoSimulacaoBalanceamento,
  type SimulacaoBalanceamentoResultadoApi,
} from "@/lib/api/admin";

const ROTULO_MODO_SIMULACAO: Record<ModoSimulacaoBalanceamento, string> = {
  zona: "Aventura (zona)",
  expedicao: "Expedição",
  grupo: "Aventura em Party",
};

export function SimuladorBalanceamento() {
  const [modo, setModo] = useState<ModoSimulacaoBalanceamento>("zona");
  const [monstros, setMonstros] = useState<AdventureMonsterApi[]>([]);
  const [regioes, setRegioes] = useState<ExpeditionRegionAdminApi[]>([]);
  const [idMonstro, setIdMonstro] = useState<number | "">("");
  const [idRegiaoExpedicao, setIdRegiaoExpedicao] = useState<number | "">("");
  const [tamanhoGrupo, setTamanhoGrupo] = useState("2");
  const [termoPersonagem, setTermoPersonagem] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState<GrantSearchResultApi[]>([]);
  const [personagemSelecionado, setPersonagemSelecionado] = useState<GrantSearchResultApi | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [quantidade, setQuantidade] = useState("200");
  const [simulando, setSimulando] = useState(false);
  const [resultado, setResultado] = useState<SimulacaoBalanceamentoResultadoApi | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    listarMonstrosAdmin()
      .then(setMonstros)
      .catch(() => {});
    listarRegioesExpedicaoAdmin()
      .then(setRegioes)
      .catch(() => {});
  }, []);

  function trocarModo(novoModo: ModoSimulacaoBalanceamento) {
    setModo(novoModo);
    setResultado(null);
    setErro("");
  }

  async function buscarPersonagem(evento: React.FormEvent) {
    evento.preventDefault();
    setBuscando(true);
    setErro("");
    try {
      setResultadosBusca(await buscarPersonagensAdmin(termoPersonagem));
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível buscar."));
    } finally {
      setBuscando(false);
    }
  }

  const alvoEscolhido = modo === "expedicao" ? idRegiaoExpedicao !== "" : idMonstro !== "";

  async function simular() {
    if (!personagemSelecionado || !alvoEscolhido) return;
    setSimulando(true);
    setErro("");
    setResultado(null);
    try {
      setResultado(
        await simularBalanceamentoAdventureAdmin({
          modo,
          id_personagem: personagemSelecionado.id,
          id_monstro: modo !== "expedicao" ? Number(idMonstro) : undefined,
          id_regiao_expedicao: modo === "expedicao" ? Number(idRegiaoExpedicao) : undefined,
          tamanho_grupo: modo === "grupo" ? Number(tamanhoGrupo) : undefined,
          quantidade: quantidade ? Number(quantidade) : undefined,
        }),
      );
    } catch (error) {
      setErro(mensagemDeErroAdmin(error, "Não foi possível simular os combates."));
    } finally {
      setSimulando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-white/50">
        Roda N combates PvE de verdade (mesmas fórmulas e mesmo motor do jogo real) entre um personagem e o alvo
        escolhido, sem afetar o personagem de verdade. Não simula efeitos de status (queimadura, atordoamento etc.),
        cooldown, consumíveis nem buffs de Taverna/Guilda — suficiente pra calibrar vida/dano base.
      </p>

      <div className="flex gap-2">
        {(Object.keys(ROTULO_MODO_SIMULACAO) as ModoSimulacaoBalanceamento[]).map((chave) => (
          <button
            key={chave}
            type="button"
            onClick={() => trocarModo(chave)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${modo === chave ? "bg-[#BC8418] text-black" : "bg-black/20 text-white/70 hover:text-white"}`}
          >
            {ROTULO_MODO_SIMULACAO[chave]}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <p className="mb-2 text-xs font-bold uppercase text-[#F3B43F]/80">1. Personagem</p>
        <form onSubmit={buscarPersonagem} className="flex gap-2">
          <input
            value={termoPersonagem}
            onChange={(e) => setTermoPersonagem(e.target.value)}
            placeholder="Nome do personagem ou username..."
            className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
          />
          <button type="submit" disabled={buscando} className="rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50">
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {resultadosBusca.length > 0 && (
          <div className="mt-2 flex flex-col gap-1">
            {resultadosBusca.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPersonagemSelecionado(p);
                  setResultadosBusca([]);
                  setResultado(null);
                }}
                className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
              >
                <span>
                  <span className="font-bold text-[#F3B43F]">{p.nome}</span> · nível {p.nivel}{" "}
                  {p.username && <span className="text-white/50">· @{p.username}</span>}
                </span>
              </button>
            ))}
          </div>
        )}

        {personagemSelecionado && (
          <p className="mt-2 text-sm text-white/70">
            Selecionado: <span className="font-bold text-[#F3B43F]">{personagemSelecionado.nome}</span> (nível{" "}
            {personagemSelecionado.nivel})
            {modo === "grupo" && (
              <span className="text-white/50"> — representa TODOS os membros do grupo simulado (mesma build, N cópias)</span>
            )}
          </p>
        )}
      </div>

      <div className="rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
        <p className="mb-2 text-xs font-bold uppercase text-[#F3B43F]/80">
          2. {modo === "expedicao" ? "Região de expedição" : "Monstro"}
          {modo === "grupo" ? ", tamanho do grupo" : ""} e quantidade de combates
        </p>
        <div className="flex flex-wrap gap-2">
          {modo === "expedicao" ? (
            <select
              value={idRegiaoExpedicao}
              onChange={(e) => setIdRegiaoExpedicao(e.target.value ? Number(e.target.value) : "")}
              className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
            >
              <option value="">Escolha uma região...</option>
              {regioes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome} ({r.profissao}, nível mín. {r.nivel_minimo})
                </option>
              ))}
            </select>
          ) : (
            <select
              value={idMonstro}
              onChange={(e) => setIdMonstro(e.target.value ? Number(e.target.value) : "")}
              className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
            >
              <option value="">Escolha um monstro...</option>
              {monstros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} (nível {m.nivel ?? "?"})
                </option>
              ))}
            </select>
          )}
          {modo === "grupo" && (
            <select
              value={tamanhoGrupo}
              onChange={(e) => setTamanhoGrupo(e.target.value)}
              className="w-40 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
            >
              <option value="2">2 aventureiros</option>
              <option value="3">3 aventureiros</option>
              <option value="4">4 aventureiros</option>
            </select>
          )}
          <input
            type="number"
            min={1}
            max={1000}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="Combates (padrão 200)"
            className="w-48 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
          />
        </div>

        <button
          type="button"
          onClick={simular}
          disabled={!personagemSelecionado || !alvoEscolhido || simulando}
          className="mt-3 w-full rounded-lg bg-[#BC8418] px-4 py-2 text-sm font-bold text-black hover:bg-[#a5710f] disabled:opacity-50"
        >
          {simulando ? "Simulando..." : "Simular"}
        </button>
      </div>

      {erro && <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-red-400">{erro}</p>}

      {resultado && <ResultadoSimulacao resultado={resultado} />}
    </div>
  );
}

function ResultadoSimulacao({ resultado }: { resultado: SimulacaoBalanceamentoResultadoApi }) {
  const alvoLabel =
    resultado.modo === "expedicao"
      ? `Expedição — ${resultado.regiao_expedicao?.nome} (monstro nível ${resultado.monstro_gerado?.nivel_forcado})`
      : resultado.modo === "grupo"
        ? `${resultado.tamanho_grupo}x ${resultado.personagem.nome} vs ${resultado.monstro?.nome}`
        : (resultado.monstro?.nome ?? "");

  return (
    <div className="rounded-2xl border-2 border-[#F3B43F] bg-[#292018] p-4 text-white">
      <p className="font-imFeel text-lg text-[#F3B43F]">
        {resultado.modo !== "grupo" && `${resultado.personagem.nome} vs `}
        {alvoLabel} — {resultado.quantidade_simulacoes} combates
      </p>

      {resultado.modo === "expedicao" && resultado.monstro_gerado && (
        <p className="mt-1 text-xs text-white/50">
          Monstro gerado na hora (como na Expedição de verdade) — vida média ≈{" "}
          {resultado.monstro_gerado.vida_maxima_media}, dano médio ≈ {resultado.monstro_gerado.dano_base_medio} por
          acerto.
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-black/30 p-3 text-center">
          <p className="text-2xl font-bold text-[#F3B43F]">{resultado.taxa_vitoria_pct}%</p>
          <p className="text-[10px] uppercase text-white/50">Taxa de vitória</p>
        </div>
        <div className="rounded-lg bg-black/30 p-3 text-center">
          <p className="text-2xl font-bold text-white">{resultado.vitorias}</p>
          <p className="text-[10px] uppercase text-white/50">Vitórias</p>
        </div>
        <div className="rounded-lg bg-black/30 p-3 text-center">
          <p className="text-2xl font-bold text-white">{resultado.derrotas}</p>
          <p className="text-[10px] uppercase text-white/50">Derrotas</p>
        </div>

        {resultado.modo === "grupo" ? (
          <>
            <div className="rounded-lg bg-black/30 p-3 text-center">
              <p className="text-2xl font-bold text-white">{resultado.rodadas_medias_vitoria}</p>
              <p className="text-[10px] uppercase text-white/50">Rodadas médias (vitória)</p>
            </div>
            <div className="rounded-lg bg-black/30 p-3 text-center">
              <p className="text-2xl font-bold text-white">{resultado.sobreviventes_medios_ao_vencer}</p>
              <p className="text-[10px] uppercase text-white/50">Sobreviventes médios ao vencer</p>
            </div>
            <div className="rounded-lg bg-black/30 p-3 text-center">
              <p className="text-2xl font-bold text-white">{resultado.dano_medio_recebido_pelo_grupo_por_combate}</p>
              <p className="text-[10px] uppercase text-white/50">Dano médio recebido (grupo)</p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg bg-black/30 p-3 text-center">
              <p className="text-2xl font-bold text-white">{resultado.turnos_medios_vitoria}</p>
              <p className="text-[10px] uppercase text-white/50">Turnos médios (vitória)</p>
            </div>
            <div className="rounded-lg bg-black/30 p-3 text-center">
              <p className="text-2xl font-bold text-white">{resultado.dano_medio_recebido_por_combate}</p>
              <p className="text-[10px] uppercase text-white/50">Dano médio recebido</p>
            </div>
          </>
        )}
        <div className="rounded-lg bg-black/30 p-3 text-center">
          <p className="text-2xl font-bold text-white">{resultado.vida_media_restante_ao_vencer_pct}%</p>
          <p className="text-[10px] uppercase text-white/50">Vida restante ao vencer</p>
        </div>
      </div>
      {resultado.combates_sem_vencedor > 0 && (
        <p className="mt-3 text-xs text-yellow-400">
          {resultado.combates_sem_vencedor} combate(s) não terminaram dentro do limite de {resultado.modo === "grupo" ? "rodadas" : "turnos"} de
          segurança — indica um confronto muito equilibrado ou travado (ex.: personagem sem dano ofensivo nenhum).
        </p>
      )}
    </div>
  );
}
