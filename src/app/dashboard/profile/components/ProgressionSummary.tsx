"use client";

// Jornada — Forja/Expedição/Rank de Aventureiro (Especificação Perfil de
// Jogador §14/§15). Dados já existem em sistemas separados; só agrega.
import type { PerfilProgressao } from "@/lib/api/profile";

function LinhaDeProgresso({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-1.5 text-sm last:border-0">
      <span className="text-white/70">{label}</span>
      <span className="font-bold text-[#F3B43F]">{valor}</span>
    </div>
  );
}

export default function ProgressionSummary({ progression }: { progression: PerfilProgressao }) {
  return (
    <div className="rounded-2xl border-2 border-[#F3B43F]/60 bg-[#292018]/90 p-4 text-white shadow-lg">
      <p className="mb-2 text-xs uppercase tracking-widest text-[#F3B43F]">Progressão</p>
      <LinhaDeProgresso label="Nível" valor={String(progression.nivel)} />
      <LinhaDeProgresso
        label="Rank de Aventureiro"
        valor={`${progression.rank_aventureiro.rank} (${progression.rank_aventureiro.contratos_concluidos} contratos)`}
      />
      <LinhaDeProgresso
        label="Reputação Comercial"
        valor={`${progression.reputacao_comercial.titulo} (${progression.reputacao_comercial.encomendas_concluidas} encomendas)`}
      />
      <LinhaDeProgresso
        label="Reputação de Caçador"
        valor={`${progression.reputacao_cacador.titulo} (${progression.reputacao_cacador.cacadas_concluidas} caçadas)`}
      />
      <LinhaDeProgresso label="Forja" valor={`Nv. ${progression.forja.nivel}`} />
      <LinhaDeProgresso label="Mineração" valor={`Nv. ${progression.expedicao.mineracao}`} />
      <LinhaDeProgresso label="Silvicultura" valor={`Nv. ${progression.expedicao.silvicultura}`} />
      <LinhaDeProgresso label="Exploração" valor={`Nv. ${progression.expedicao.exploracao}`} />
    </div>
  );
}
