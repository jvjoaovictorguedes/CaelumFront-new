"use client";

// Torneio da Pesca — participação automática (qualquer captura durante
// a janela conta, sem botão de "entrar"). Pontuação e leaderboard vêm
// 100% de GET /fishing/tournament, materializados na leitura pelo
// backend (fishingTournamentService.js) — este componente só exibe.
import { useEffect, useState } from "react";
import { fishingApi, type TorneioPescaResposta } from "@/lib/api/fishing";

function formatarJanela(inicio: string, fim: string) {
  const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  return `${fmt(inicio)} até ${fmt(fim)}`;
}

// Banner compacto — usado no topo da tela de Pesca, em qualquer aba.
export function TorneioBanner({ onVerTorneio }: { onVerTorneio: () => void }) {
  const [dados, setDados] = useState<TorneioPescaResposta | null>(null);

  useEffect(() => {
    let ativo = true;
    fishingApi
      .getTournament()
      .then((r) => {
        if (ativo) setDados(r);
      })
      .catch(() => {
        /* banner é best-effort — sem torneio ativo, sem erro visível */
      });
    return () => {
      ativo = false;
    };
  }, []);

  if (!dados || dados.statusTorneio === "NENHUM" || !dados.torneio) return null;

  const emAndamento = dados.statusTorneio === "EM_ANDAMENTO";

  return (
    <button
      type="button"
      onClick={onVerTorneio}
      className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm transition ${
        emAndamento
          ? "border-amber-400/60 bg-amber-950/30 text-amber-200 hover:bg-amber-950/50"
          : "border-white/15 bg-black/30 text-white/70 hover:bg-black/50"
      }`}
    >
      <span>
        {emAndamento ? "🏆 Torneio ativo agora: " : "Próximo torneio: "}
        <b>{dados.torneio.nome}</b>
        {dados.torneio.zona ? ` (zona: ${dados.torneio.zona.nome})` : " (todas as zonas)"}
      </span>
      <span className="text-xs uppercase tracking-wide opacity-80">
        {formatarJanela(dados.torneio.inicia_em, dados.torneio.termina_em)}
      </span>
    </button>
  );
}

export default function FishingTorneio() {
  const [dados, setDados] = useState<TorneioPescaResposta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    fishingApi
      .getTournament()
      .then((r) => {
        if (ativo) setDados(r);
      })
      .catch(() => {
        if (ativo) setErro("Não foi possível carregar o Torneio da Pesca.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  if (carregando) return <p className="text-white/70">Carregando Torneio…</p>;
  if (erro) return <p className="text-red-400">{erro}</p>;

  if (!dados || dados.statusTorneio === "NENHUM" || !dados.torneio) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-white/60">
        Nenhum torneio agendado no momento. Fique de olho — o Painel Administrativo pode abrir um novo a qualquer hora.
      </div>
    );
  }

  const { torneio, statusTorneio, leaderboard, minhaPosicao } = dados;
  const emAndamento = statusTorneio === "EM_ANDAMENTO";

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-xl border p-4 text-white ${
          emAndamento ? "border-amber-400/60 bg-amber-950/30" : "border-white/15 bg-black/30"
        }`}
      >
        <p className="text-sm uppercase tracking-widest text-amber-300">
          {emAndamento ? "Torneio em andamento" : "Próximo torneio agendado"}
        </p>
        <p className="text-2xl font-imFeel">{torneio.nome}</p>
        <p className="text-sm text-white/60">
          Escopo: {torneio.zona ? torneio.zona.nome : "Todas as zonas"} · Janela: {formatarJanela(torneio.inicia_em, torneio.termina_em)}
        </p>
        <p className="mt-2 text-xs text-white/50">
          Pontuação = soma de (peso × qualidade) de cada captura feita durante a janela. Participação é automática — qualquer
          peixe pescado agora, enquanto o torneio estiver ativo, já conta pro seu placar.
        </p>
      </div>

      {emAndamento && minhaPosicao && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-950/30 p-3 text-sm text-white">
          {minhaPosicao.elegivel ? (
            <p>
              Sua posição: <b className="text-sky-300">#{minhaPosicao.posicao}</b> — {minhaPosicao.pontuacao} pontos (
              {minhaPosicao.capturas} capturas)
            </p>
          ) : (
            <p className="text-white/60">{minhaPosicao.motivo}</p>
          )}
        </div>
      )}

      {leaderboard && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm text-white">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-white/50">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Personagem</th>
                <th className="px-3 py-2">Pontuação</th>
                <th className="px-3 py-2">Capturas</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.itens.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-white/50">
                    Ninguém pescou durante este torneio ainda.
                  </td>
                </tr>
              ) : (
                leaderboard.itens.map((item) => (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="px-3 py-2 font-bold text-amber-300">#{item.posicao}</td>
                    <td className="px-3 py-2">{item.nome}</td>
                    <td className="px-3 py-2">{item.pontuacao}</td>
                    <td className="px-3 py-2">{item.capturas}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
