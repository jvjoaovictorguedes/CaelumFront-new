import type { TempleStatusApi } from "@/lib/api/temple";

// §13.2 — aba "História": lore da Convergência atual. O Relicário já
// tem seu próprio histórico recente de draws (§13.4); esta aba é sobre
// a narrativa do evento, não um log de ações.
export default function TempleHistoriaPanel({ status }: { status: TempleStatusApi }) {
  return (
    <div className="rounded-2xl border border-[#F3B43F]/40 bg-[#292018]/60 p-5 text-white">
      <p className="text-sm uppercase tracking-widest text-[#F3B43F]">{status.nome}</p>
      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="font-imFeel text-xl text-[#F3B43F]">O Templo do Véu Celestial</p>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          Antes do Eclipse, sacerdotes e arcanistas ergueram um santuário capaz de preservar ecos de grandes feitos.
          O Templo não reconhece ouro comum: apenas Sigilos formados quando suas Provações são cumpridas. Em cada
          Convergência, inscrições antigas despertam, o Relicário volta a responder e um Guardião assume a forma
          necessária para julgar quem atravessa o último altar. A forma do Guardião é a mesma; o julgamento, não.
        </p>
      </div>

      {status.lore && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="font-imFeel text-xl text-[#F3B43F]">{status.nome}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{status.lore}</p>
        </div>
      )}
    </div>
  );
}
