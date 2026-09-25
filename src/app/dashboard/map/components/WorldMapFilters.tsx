"use client";

export type FiltroTipo = "TODOS" | "AVENTURA" | "EXPEDICAO" | "CIDADES" | "SERVICOS" | "PESCA";
export type SubfiltroExpedicao = "Mineracao" | "Silvicultura" | "Exploracao" | null;

const FILTROS: { valor: FiltroTipo; label: string }[] = [
  { valor: "TODOS", label: "Todos" },
  { valor: "AVENTURA", label: "Aventura" },
  { valor: "EXPEDICAO", label: "Expedição" },
  { valor: "CIDADES", label: "Cidades" },
  { valor: "SERVICOS", label: "Serviços" },
  { valor: "PESCA", label: "Pesca" },
];

const SUBFILTROS_EXPEDICAO: { valor: Exclude<SubfiltroExpedicao, null>; label: string }[] = [
  { valor: "Mineracao", label: "Mineração" },
  { valor: "Silvicultura", label: "Silvicultura" },
  { valor: "Exploracao", label: "Exploração" },
];

// Filtros de tipo de Node (spec §27) — territórios continuam visíveis
// de fundo independente do filtro (a camada de território não escuta
// isso, ver WorldMapCanvas). Subfiltro de profissão só aparece quando
// "Expedição" está selecionado.
export default function WorldMapFilters({
  filtro,
  onFiltroChange,
  subfiltroExpedicao,
  onSubfiltroExpedicaoChange,
}: {
  filtro: FiltroTipo;
  onFiltroChange: (f: FiltroTipo) => void;
  subfiltroExpedicao: SubfiltroExpedicao;
  onSubfiltroExpedicaoChange: (s: SubfiltroExpedicao) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {FILTROS.map(({ valor, label }) => (
        <button
          key={valor}
          type="button"
          onClick={() => onFiltroChange(valor)}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
            filtro === valor
              ? "border-[#F3B43F] bg-[#F3B43F] text-[#292018]"
              : "border-[#F3B43F]/50 bg-black/30 text-[#F3B43F] hover:bg-black/50"
          }`}
        >
          {label}
        </button>
      ))}

      {filtro === "EXPEDICAO" && (
        <div className="flex flex-wrap items-center gap-1.5 border-l border-white/20 pl-2">
          {SUBFILTROS_EXPEDICAO.map(({ valor, label }) => {
            const ativo = subfiltroExpedicao === valor;
            return (
              <button
                key={valor}
                type="button"
                onClick={() => onSubfiltroExpedicaoChange(ativo ? null : valor)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                  ativo
                    ? "border-[#F3B43F] bg-[#F3B43F]/20 text-[#F3B43F]"
                    : "border-white/20 text-white/60 hover:border-white/40"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
