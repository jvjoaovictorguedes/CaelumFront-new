"use client";

import { useCallback, useEffect, useState } from "react";
import { useCharacter } from "@/contexts/CharacterContext";
import {
  apostar,
  historicoDeApostas,
  listarJogos,
  mensagemDeErroTaverna,
  type ApostaHistorico,
  type ApostaResultado,
  type PresentationKey,
  type TavernGame,
} from "@/lib/api/tavern";

const ESCOLHAS_POR_PRESENTATION: Record<PresentationKey, { key: string; rotulo: string }[]> = {
  COIN: [
    { key: "HEADS", rotulo: "Dourada" },
    { key: "TAILS", rotulo: "Sombria" },
  ],
  RUNES: [
    { key: "GOLD", rotulo: "Runa Dourada" },
    { key: "SHADOW", rotulo: "Runa Sombria" },
  ],
  DICE_PARITY: [
    { key: "EVEN", rotulo: "Par" },
    { key: "ODD", rotulo: "Ímpar" },
  ],
  CARD_SIDE: [
    { key: "LEFT", rotulo: "Esquerda" },
    { key: "RIGHT", rotulo: "Direita" },
  ],
};

const ICONE_POR_PRESENTATION: Record<PresentationKey, string> = {
  COIN: "🪙",
  RUNES: "🔮",
  DICE_PARITY: "🎲",
  CARD_SIDE: "🃏",
};

function gerarRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function TavernGamesPanel() {
  const { character, atualizarCharacter } = useCharacter();
  const [jogos, setJogos] = useState<TavernGame[]>([]);
  const [historico, setHistorico] = useState<ApostaHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [apostandoId, setApostandoId] = useState<number | null>(null);
  const [ultimosResultados, setUltimosResultados] = useState<Record<number, ApostaResultado>>({});

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [listaJogos, listaHistorico] = await Promise.all([listarJogos(), historicoDeApostas(10)]);
      setJogos(listaJogos);
      setHistorico(listaHistorico);
    } catch (error) {
      setErro(mensagemDeErroTaverna(error, "Não foi possível carregar os jogos."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function jogar(jogo: TavernGame, choiceKey: string, betAmount: number) {
    setApostandoId(jogo.id);
    setErro("");
    try {
      const resultado = await apostar(jogo.id, {
        request_id: gerarRequestId(),
        bet_amount: betAmount,
        choice_key: choiceKey,
      });
      atualizarCharacter({ dinheiro: resultado.dinheiro });
      setUltimosResultados((atual) => ({ ...atual, [jogo.id]: resultado }));
      const historicoAtualizado = await historicoDeApostas(10);
      setHistorico(historicoAtualizado);
    } catch (error) {
      setErro(mensagemDeErroTaverna(error, "Não foi possível fazer essa aposta."));
    } finally {
      setApostandoId(null);
    }
  }

  if (carregando) return <p className="text-sm text-white/60">Carregando...</p>;

  return (
    <div className="flex flex-col gap-5">
      {erro && <p className="rounded-lg bg-black/40 px-3 py-2 text-sm text-red-400">{erro}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {jogos.map((jogo) => (
          <GameCardWrapper
            key={jogo.id}
            jogo={jogo}
            dinheiro={character?.dinheiro ?? 0}
            onApostar={jogar}
            apostando={apostandoId === jogo.id}
            ultimoResultado={ultimosResultados[jogo.id]}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-widest text-[#F3B43F]/80">Últimas apostas</p>
        <div className="overflow-x-auto rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80">
          <table className="w-full text-left text-sm text-white">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-white/50">
                <th className="px-3 py-2">Jogo</th>
                <th className="px-3 py-2">Aposta</th>
                <th className="px-3 py-2">Resultado</th>
                <th className="px-3 py-2">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {historico.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-white/50">
                    Nenhuma aposta ainda.
                  </td>
                </tr>
              ) : (
                historico.map((aposta) => (
                  <tr key={aposta.id} className="border-b border-white/5">
                    <td className="px-3 py-2">{aposta.jogo?.nome ?? "—"}</td>
                    <td className="px-3 py-2">{aposta.bet_amount}</td>
                    <td className={`px-3 py-2 font-bold ${aposta.outcome === "Win" ? "text-green-400" : "text-red-400"}`}>
                      {aposta.outcome === "Win" ? "Vitória" : "Derrota"}
                    </td>
                    <td className={`px-3 py-2 ${aposta.net_change >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {aposta.net_change >= 0 ? "+" : ""}
                      {aposta.net_change}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function GameCardWrapper({
  jogo,
  dinheiro,
  onApostar,
  apostando,
  ultimoResultado,
}: {
  jogo: TavernGame;
  dinheiro: number;
  onApostar: (jogo: TavernGame, choiceKey: string, betAmount: number) => Promise<void>;
  apostando: boolean;
  ultimoResultado?: ApostaResultado;
}) {
  const [valor, setValor] = useState(jogo.min_bet);
  const escolhas = ESCOLHAS_POR_PRESENTATION[jogo.presentation_key] ?? [];
  const retornoTotal = Math.floor(valor * jogo.payout_multiplier);
  const lucroLiquido = retornoTotal - valor;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#F3B43F]/40 bg-[#292018]/80 p-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{ICONE_POR_PRESENTATION[jogo.presentation_key]}</span>
        <div>
          <p className="font-imFeel text-lg text-[#F3B43F]">{jogo.nome}</p>
          <p className="text-xs text-white/60">{jogo.descricao}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-white/70">
        <span>Chance: {Math.round(jogo.win_chance_ppm / 10000)}%</span>
        <span>·</span>
        <span>Retorno: {jogo.payout_multiplier.toFixed(2)}x</span>
      </div>

      <label className="flex flex-col gap-1 text-xs text-white/70">
        Aposta (Gold)
        <input
          type="number"
          min={jogo.min_bet}
          max={jogo.max_bet}
          value={valor}
          onChange={(e) => setValor(Math.max(jogo.min_bet, Math.min(jogo.max_bet, Number(e.target.value) || 0)))}
          className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm text-white"
        />
      </label>

      <p className="text-xs text-white/60">
        Retorno na vitória: <span className="font-bold text-[#F3B43F]">{retornoTotal} Gold</span> (lucro líquido +{lucroLiquido})
      </p>

      <div className="flex gap-2">
        {escolhas.map((escolha) => (
          <button
            key={escolha.key}
            type="button"
            disabled={apostando || dinheiro < valor}
            onClick={() => onApostar(jogo, escolha.key, valor)}
            className="flex-1 rounded-lg border-2 border-[#F3B43F]/60 bg-black/30 px-3 py-2 text-sm font-bold text-white hover:bg-[#3a2c14] disabled:opacity-50"
          >
            {escolha.rotulo}
          </button>
        ))}
      </div>
      {dinheiro < valor && <p className="text-xs text-red-400">Gold insuficiente pra essa aposta.</p>}

      {ultimoResultado && (
        <p className={`text-center text-sm font-bold ${ultimoResultado.outcome === "Win" ? "text-green-400" : "text-red-400"}`}>
          {ultimoResultado.outcome === "Win"
            ? `Vitória! +${ultimoResultado.net_change} Gold`
            : `Derrota — ${ultimoResultado.net_change} Gold`}
        </p>
      )}
    </div>
  );
}
