"use client";
import { useEffect, useState } from "react";
import { obterWikiEnciclopedia, type WikiReferenciaApi } from "@/lib/api/wiki";
import WikiMarkdownContent from "@/components/wiki/WikiMarkdownContent";
import { resolveMediaUrl } from "@/utils/media-url";

export default function WikiEncyclopedia() {
  const [entries, setEntries] = useState<WikiReferenciaApi[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    obterWikiEnciclopedia().then(data => {if(active)setEntries(data);})
      .catch(() => {if(active)setError("Não foi possível abrir os registros. Confira se você já tem um personagem e tente novamente.");})
      .finally(() => {if(active)setLoading(false);});
    return () => {active = false;};
  }, [attempt]);
  const entry = entries.find(e => e.slug === selected);
  const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const visible = entries.filter(e => normalized(`${e.titulo} ${e.resumo ?? ""}`).includes(normalized(query.trim())));
  const matchesKind = (e: WikiReferenciaApi, kind: WikiReferenciaApi["kind"]) => e.kind === kind && (kind !== "skill" || !e.tipo_poder || skillFilter === "all" || (skillFilter === "learned" ? e.aprendida : e.tipo_poder === skillFilter));
  if (loading) return <p role="status" className="text-white/70">Abrindo os pergaminhos...</p>;
  if (error) return <div role="alert"><p className="text-red-300">{error}</p><button type="button" onClick={() => setAttempt(a => a + 1)} className="mt-3 rounded-lg border border-[#F3B43F]/50 px-4 py-2 text-[#F3B43F]">Tentar novamente</button></div>;
  if (entry) return <article>
    <button type="button" onClick={() => setSelected(null)} className="mb-5 text-[#F3B43F] underline">← Voltar à enciclopédia</button>
    <p className="text-xs uppercase tracking-widest text-[#F3B43F]/70">{entry.categoria}</p>
    <h2 className="mb-4 font-imFeel text-3xl text-[#F3B43F]">{entry.titulo}</h2>
    {entry.imagem_url && <img src={resolveMediaUrl(entry.imagem_url)} alt={entry.titulo} className="mb-5 max-h-72 w-full rounded-xl bg-black/20 object-contain" />}
    <WikiMarkdownContent conteudo={entry.conteudo} />
  </article>;
  return <div className="space-y-6">
    <div><h2 className="font-imFeel text-3xl text-[#F3B43F]">Crônicas do aventureiro</h2><p className="mt-2 font-imFeel text-lg leading-relaxed text-white/80">Conheça os caminhos de Caelum, prepare sua jornada e consulte as criaturas que você já derrotou. As fichas acompanham os valores atuais do jogo.</p></div>
    <label className="block text-sm text-white/80">Buscar nos registros<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Classe, habilidade, criatura ou assunto..." type="search" className="mt-2 w-full rounded-lg border border-[#F3B43F]/40 bg-black/30 px-3 py-2 text-white" /></label>
    {(["guide", "class", "skill", "monster"] as const).map(kind => <section key={kind}>
      <h3 className="mb-3 font-imFeel text-2xl text-[#F3B43F]">{kind === "guide" ? "Manual do aventureiro" : kind === "class" ? "Classes e evoluções" : kind === "skill" ? "Habilidades" : "Criaturas descobertas"}</h3>
      {kind === "skill" && <label className="mb-3 block text-sm text-white/80">Filtrar habilidades
        <select value={skillFilter} onChange={e => {setSkillFilter(e.target.value); setShowAllSkills(false);}} className="ml-3 rounded-lg border border-[#F3B43F]/40 bg-[#292018] px-3 py-2 text-white">
          <option value="all">Todas</option><option value="Ativo">Ativas</option><option value="Passivo">Passivas</option><option value="learned">Já aprendidas</option>
        </select>
      </label>}
      <div className="grid gap-3 sm:grid-cols-2">{visible.filter(e => matchesKind(e, kind)).slice(0, kind === "skill" && !showAllSkills ? 12 : undefined).map(e => <button key={e.slug} type="button" onClick={() => {setSelected(e.slug);}} className="flex gap-3 rounded-xl border border-[#F3B43F]/30 bg-black/20 p-4 text-left transition hover:border-[#F3B43F] hover:bg-[#BC8418]/10 focus-visible:outline-2 focus-visible:outline-[#F3B43F]">
        {e.imagem_url && <img src={resolveMediaUrl(e.imagem_url)} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-lg object-contain" />}
        <span><span className="block font-imFeel text-xl text-[#F3B43F]">{e.titulo}</span>{e.kind === "skill" && e.tipo_poder && <span className="block text-xs text-white/60">{e.tipo_poder}{e.aprendida ? " · Aprendida" : ""}</span>}{e.nivel != null && <span className="text-base tabular-nums text-white/80">Nível {e.nivel}</span>}<span className="mt-1 line-clamp-2 block text-sm text-white/70">{e.resumo ?? "Abrir o pergaminho"}</span></span>
      </button>)}</div>
      {kind === "skill" && !showAllSkills && visible.filter(e => matchesKind(e, "skill")).length > 12 && <button type="button" onClick={() => setShowAllSkills(true)} className="mt-3 rounded-lg border border-[#F3B43F]/40 px-4 py-2 text-[#F3B43F]">Mostrar todas as habilidades deste filtro</button>}
      {!visible.some(e => matchesKind(e, kind)) && <p className="text-sm text-white/60">{query ? "Nenhum registro corresponde à busca." : kind === "monster" ? "Derrote sua primeira criatura na Aventura para revelar sua história, atributos e espólios aqui." : kind === "class" ? "Nenhuma classe ativa cadastrada neste ambiente." : kind === "skill" ? "Nenhuma habilidade disponível para este filtro." : "Nenhum manual disponível."}</p>}
    </section>)}
  </div>;
}
