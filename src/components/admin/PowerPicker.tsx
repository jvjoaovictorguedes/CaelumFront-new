"use client";

// Painel Administrativo — combobox de seleção de Power (Habilidade),
// mesmo critério do ItemSelect (ItemPicker.tsx): busca por ID ou nome,
// sempre exibindo "Nome (ID: N)", seleção sempre vinda da lista real
// carregada do catálogo (nunca um ID digitado livre). Reaproveitado
// pelo editor de Habilidades da Ameaça Mundial (§13.5) — qualquer outra
// tela do admin que precise escolher um Power pode reaproveitar este
// componente em vez de reimplementar um seletor próprio.

import { useEffect, useMemo, useRef, useState } from "react";
import { listarPowersAdmin, type PowerApi } from "@/lib/api/admin";

export function formatarPowerComId(nome: string, id: number): string {
  return `${nome} (ID: ${id})`;
}

export function usePowersParaSelecaoAdmin() {
  const [powers, setPowers] = useState<PowerApi[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    listarPowersAdmin()
      .then((resultado) => {
        if (!cancelado) setPowers(resultado);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return { powers, carregando };
}

function normalizar(texto: string): string {
  return texto.trim().toLowerCase();
}

function powerCasaComBusca(power: PowerApi, buscaNormalizada: string): boolean {
  if (!buscaNormalizada) return true;
  if (String(power.id).includes(buscaNormalizada)) return true;
  return normalizar(power.nome).includes(buscaNormalizada);
}

export function PowerSelect({
  powers,
  value,
  onChange,
  placeholderVazio = "Buscar Power por ID ou nome...",
  permitirVazio = true,
  id,
}: {
  powers: PowerApi[];
  value: number | "";
  onChange: (id: number | "") => void;
  placeholderVazio?: string;
  permitirVazio?: boolean;
  id?: string;
}) {
  const powerSelecionado = value === "" ? null : powers.find((p) => p.id === value) ?? null;

  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const textoExibido = aberto ? busca : powerSelecionado ? formatarPowerComId(powerSelecionado.nome, powerSelecionado.id) : "";

  const powersFiltrados = useMemo(() => {
    const buscaNormalizada = normalizar(busca);
    return powers.filter((p) => powerCasaComBusca(p, buscaNormalizada)).slice(0, 50);
  }, [powers, busca]);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setAberto(false);
        setBusca("");
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  function escolher(power: PowerApi) {
    onChange(power.id);
    setBusca("");
    setAberto(false);
  }
  function limpar() {
    onChange("");
    setBusca("");
    setAberto(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1">
        <input
          id={id}
          type="text"
          value={textoExibido}
          placeholder={placeholderVazio}
          onFocus={() => {
            setAberto(true);
            setBusca("");
          }}
          onChange={(e) => {
            setBusca(e.target.value);
            setAberto(true);
          }}
          onKeyDown={(e) => {
            if (!aberto) return;
            if (e.key === "Escape") {
              setAberto(false);
              setBusca("");
              (e.target as HTMLInputElement).blur();
            }
            if (e.key === "Enter") {
              e.preventDefault();
              if (powersFiltrados.length > 0) escolher(powersFiltrados[0]);
            }
          }}
          className="w-full rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-sm"
        />
        {permitirVazio && powerSelecionado && (
          <button type="button" onClick={limpar} title="Limpar seleção" className="shrink-0 rounded-lg border border-white/20 px-2 py-1.5 text-xs text-white/60 hover:bg-white/10">
            ✕
          </button>
        )}
      </div>

      {aberto && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full min-w-[16rem] overflow-y-auto rounded-lg border border-white/20 bg-[#1b140d] text-sm shadow-xl">
          {powersFiltrados.length === 0 && <li className="px-3 py-2 text-white/50">Nenhum Power encontrado para &quot;{busca}&quot;.</li>}
          {powersFiltrados.map((power) => (
            <li key={power.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  escolher(power);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-[#F3B43F]/20 ${
                  power.id === value ? "bg-[#F3B43F]/10 text-[#F3B43F]" : "text-white"
                }`}
              >
                <span>{power.nome}</span>
                <span className="text-xs text-white/40">
                  ID: {power.id} · {power.tipo_poder}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
