"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { usePvpSocket } from "@/contexts/PvpSocketContext";
import { useCharacter } from "@/contexts/CharacterContext";
import type { ZonaApi } from "./ZoneSelector";

// Convite pra Aventura em grupo (party) — mesma tela da Aventura solo,
// só ganha esta seção pra chamar amigos online, esperar todo mundo
// marcar "pronto" (estilo DDTank) e o anfitrião escolher a área e
// iniciar. A batalha em si (N aliados vs 1 monstro escalado) é outra
// tela em tela cheia, mostrada automaticamente quando o servidor manda
// "party:batalha-iniciada" (ver PvpSocketContext).
export default function PartyAdventureSection({ zonas }: { zonas: ZonaApi[] }) {
  const { character } = useCharacter();
  const characterId = character?.id;
  const {
    onlineIds,
    grupoAtual,
    convitePartyEnviadoPara,
    erroParty,
    convidarParaGrupo,
    marcarPronto,
    sairDoGrupo,
    iniciarAventuraEmGrupo,
    limparErroParty,
  } = usePvpSocket();

  const [mostrarConvidar, setMostrarConvidar] = useState(false);
  const [zonaEscolhida, setZonaEscolhida] = useState<number | "">("");
  const [iniciando, setIniciando] = useState(false);
  const timeoutIniciarRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function limparTimeoutIniciar() {
    if (timeoutIniciarRef.current) {
      clearTimeout(timeoutIniciarRef.current);
      timeoutIniciarRef.current = null;
    }
  }

  // "Iniciando..." nunca tinha um jeito de voltar a "Iniciar" — nem
  // quando o servidor respondia com erro (ex.: área sem monstro
  // configurado), nem quando o grupo mudava. Um clique que não
  // completasse deixava o botão travado pro resto da sessão (bug
  // reportado: preso em "Iniciando..." mesmo com os dois prontos).
  useEffect(() => {
    if (erroParty) {
      limparTimeoutIniciar();
      setIniciando(false);
    }
  }, [erroParty]);

  useEffect(() => {
    limparTimeoutIniciar();
    setIniciando(false);
  }, [grupoAtual?.partyId]);

  useEffect(() => limparTimeoutIniciar, []);

  const outrosOnline = useMemo(
    () => Array.from(onlineIds).filter((id) => id !== characterId),
    [onlineIds, characterId],
  );

  if (!grupoAtual) {
    return (
      <div className="w-full rounded-2xl border border-[#F3B43F]/30 bg-[#292018]/80 p-4 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-imFeel text-xl">Aventura em grupo</h2>
            <p className="text-sm text-white/70">
              Chame amigos online pra enfrentar juntos um monstro mais forte.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMostrarConvidar((atual) => !atual)}
            className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black transition hover:bg-[#a5710f]"
          >
            {mostrarConvidar ? "Fechar" : "Chamar amigos"}
          </button>
        </div>

        {erroParty && (
          <p className="mt-3 rounded-lg bg-red-900/50 p-2 text-sm text-red-200">
            {erroParty}
            <button type="button" onClick={limparErroParty} className="ml-2 underline">
              ok
            </button>
          </p>
        )}

        {mostrarConvidar && (
          <div className="mt-4">
            {outrosOnline.length === 0 ? (
              <p className="text-sm text-white/60">Nenhum outro jogador online agora.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {outrosOnline.map((id) => (
                  <li
                    key={id}
                    className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Jogador #{id}
                    </span>
                    <button
                      type="button"
                      disabled={convitePartyEnviadoPara === id}
                      onClick={() => convidarParaGrupo(id)}
                      className="rounded-lg border border-[#F3B43F]/60 px-3 py-1 text-xs font-bold text-[#F3B43F] transition hover:bg-[#F3B43F]/10 disabled:opacity-50"
                    >
                      {convitePartyEnviadoPara === id ? "Convite enviado..." : "Convidar"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  const souHost = grupoAtual.hostId === String(characterId);
  const meuMembro = grupoAtual.membros.find((m) => m.id === characterId);
  const todosProntos = grupoAtual.membros.every((m) => m.pronto);

  return (
    <div className="w-full rounded-2xl border-2 border-[#F3B43F] bg-[#292018]/90 p-4 text-white shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-imFeel text-xl">
          Grupo ({grupoAtual.membros.length}/4){souHost ? " — você é o anfitrião" : ""}
        </h2>
        <button
          type="button"
          onClick={sairDoGrupo}
          className="rounded-lg border border-white/30 px-3 py-1 text-xs font-bold text-white/70 transition hover:bg-white/10"
        >
          Sair do grupo
        </button>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {grupoAtual.membros.map((membro) => (
          <li
            key={membro.id}
            className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 text-sm"
          >
            <span>
              {membro.nome}
              {String(membro.id) === grupoAtual.hostId && (
                <span className="ml-2 text-[10px] uppercase text-[#F3B43F]">anfitrião</span>
              )}
            </span>
            <span className={`text-xs font-bold ${membro.pronto ? "text-green-400" : "text-white/40"}`}>
              {membro.pronto ? "Pronto" : "Aguardando"}
            </span>
          </li>
        ))}
      </ul>

      {erroParty && (
        <p className="mt-3 rounded-lg bg-red-900/50 p-2 text-sm text-red-200">
          {erroParty}
          <button type="button" onClick={limparErroParty} className="ml-2 underline">
            ok
          </button>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => marcarPronto(!meuMembro?.pronto)}
          className={`rounded-lg px-4 py-2 font-bold transition ${
            meuMembro?.pronto
              ? "border border-white/30 text-white hover:bg-white/10"
              : "bg-[#BC8418] text-black hover:bg-[#a5710f]"
          }`}
        >
          {meuMembro?.pronto ? "Cancelar pronto" : "Marcar pronto"}
        </button>

        {souHost && (
          <>
            <select
              value={zonaEscolhida}
              onChange={(e) => setZonaEscolhida(e.target.value ? Number(e.target.value) : "")}
              className="rounded-lg border border-[#F3B43F]/40 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="">Escolha a área de caça...</option>
              {zonas.map((zona) => (
                <option key={zona.id} value={zona.id}>
                  {zona.nome}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!todosProntos || !zonaEscolhida || iniciando}
              onClick={() => {
                if (!zonaEscolhida) return;
                setIniciando(true);
                iniciarAventuraEmGrupo(zonaEscolhida);
                // Nem toda falha volta como "party:erro" (ex.: soquete
                // caiu no meio do caminho) — sem esse limite o botão
                // ficava preso em "Iniciando..." pra sempre nesse caso.
                limparTimeoutIniciar();
                timeoutIniciarRef.current = setTimeout(() => {
                  setIniciando(false);
                }, 15000);
              }}
              className="rounded-lg bg-[#BC8418] px-4 py-2 font-bold text-black transition hover:bg-[#a5710f] disabled:opacity-50"
            >
              {iniciando ? "Iniciando..." : "Iniciar aventura em grupo"}
            </button>
          </>
        )}
        {!souHost && (
          <p className="text-sm text-white/60">Aguardando o anfitrião escolher a área e iniciar...</p>
        )}
      </div>
    </div>
  );
}
