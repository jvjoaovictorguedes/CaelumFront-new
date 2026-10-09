"use client";
import { useCallback, useEffect, useState } from "react";
import { obterStatusTemplo, mensagemDeErroTemplo, type TempleStatusApi } from "@/lib/api/temple";
import TempleAdormecidaPanel from "./components/TempleAdormecidaPanel";
import TempleProvacoesPanel from "./components/TempleProvacoesPanel";
import TempleRelicarioPanel from "./components/TempleRelicarioPanel";
import TempleGuardiaoPanel from "./components/TempleGuardiaoPanel";
import TempleHistoriaPanel from "./components/TempleHistoriaPanel";

type Aba = "provacoes" | "relicario" | "guardiao" | "historia";

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "provacoes", rotulo: "Provações" },
  { id: "relicario", rotulo: "Relicário" },
  { id: "guardiao", rotulo: "Guardião" },
  { id: "historia", rotulo: "História" },
];

// §13.1/§13.2 — Adormecido (nada ativo/agendado ainda, só contagem até a
// próxima Convergência se já houver uma SCHEDULED) vs. evento aberto
// (ACTIVE/RELICARY_ONLY), com abas Provações/Relicário/Guardião/História.
// RELICARY_ONLY ainda mostra as abas, mas Provações/Guardião ficam
// fechados pros painéis — cada painel decide isso sozinho a partir do
// próprio status, pra não duplicar essa regra aqui.
export default function TempleClient() {
  const [status, setStatus] = useState<TempleStatusApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aba, setAba] = useState<Aba>("provacoes");

  const carregar = useCallback(async () => {
    try {
      const resposta = await obterStatusTemplo();
      setStatus(resposta);
    } catch (erroOriginal) {
      setErro(mensagemDeErroTemplo(erroOriginal, "Não foi possível carregar o Templo do Véu Celestial."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-white">
        Abrindo os portões do Templo...
      </div>
    );
  }

  if (erro && !status) {
    return <div className="rounded-2xl border border-white/10 bg-[#292018]/60 p-5 text-red-400">{erro}</div>;
  }

  const eventoAberto = status?.status === "ACTIVE" || status?.status === "RELICARY_ONLY";

  if (!status || !eventoAberto) {
    return <TempleAdormecidaPanel status={status} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[#F3B43F]/40 bg-[#292018]/60 p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm uppercase tracking-widest text-[#F3B43F]">
              {status.nome}
              {status.status === "RELICARY_ONLY" && " — Provações encerradas"}
            </p>
            {status.relicary_end_at && <TempleContagemRelicario relicaryEndAt={status.relicary_end_at} />}
          </div>
          <div className="rounded-lg border border-[#F3B43F]/40 bg-black/30 px-3 py-1.5 text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/50">Sigilos Celestiais</p>
            <p className="font-imFeel text-xl text-[#F3B43F]">{status.meus_sigilos ?? 0}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ABAS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAba(item.id)}
              className={`rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-widest transition ${
                aba === item.id ? "bg-[#BC8418] text-black" : "border border-white/20 text-white/70 hover:bg-white/10"
              }`}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
      </div>

      {aba === "provacoes" && <TempleProvacoesPanel aberto={status.status === "ACTIVE"} aoResgatar={carregar} />}
      {aba === "relicario" && <TempleRelicarioPanel aoSortear={carregar} />}
      {aba === "guardiao" && <TempleGuardiaoPanel />}
      {aba === "historia" && <TempleHistoriaPanel status={status} />}
    </div>
  );
}

function TempleContagemRelicario({ relicaryEndAt }: { relicaryEndAt: string }) {
  const [restanteMs, setRestanteMs] = useState(() => new Date(relicaryEndAt).getTime() - Date.now());

  useEffect(() => {
    const alvo = new Date(relicaryEndAt).getTime();
    const intervalo = setInterval(() => setRestanteMs(Math.max(0, alvo - Date.now())), 1000);
    return () => clearInterval(intervalo);
  }, [relicaryEndAt]);

  if (restanteMs <= 0) return <p className="font-imFeel text-2xl text-white">Relicário encerrado</p>;
  const dias = Math.floor(restanteMs / 86400000);
  const horas = Math.floor((restanteMs % 86400000) / 3600000);
  const minutos = Math.floor((restanteMs % 3600000) / 60000);
  return (
    <p className="font-imFeel text-2xl text-white">
      Restam {dias > 0 ? `${dias}d ` : ""}
      {horas}h {minutos}m
    </p>
  );
}
