"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { resolveMediaUrl } from "@/utils/media-url";

// Pedido do jogador: "implementar formatação de texto, como inclusão
// de imagens, formatação de texto, fontes se possível, negrito, etc".
// Troca o texto plano da Wiki por Markdown (negrito/itálico/títulos/
// listas/links/imagens/citação/tabela via remark-gfm), com os
// elementos estilizados usando as DUAS fontes do jogo: títulos em
// font-imFeel (a fonte de destaque usada em todo o resto do site) e o
// corpo em letra medieval — nunca uma fonte nova só pra Wiki. Usado tanto
// na leitura pública (WikiClient.tsx) quanto na prévia do editor admin
// (AdminWikiClient.tsx), pra prévia e resultado real serem idênticos.
//
// react-markdown nunca renderiza HTML bruto embutido no texto por
// padrão (sem rehype-raw) — qualquer "<script>" ou tag digitada pelo
// admin vira texto literal na tela, não um elemento de verdade. Seguro
// por padrão, sem precisar de sanitização própria.
const componentes: Components = {
  h1: ({ children }) => <h3 className="mt-2 font-imFeel text-2xl text-[#F3B43F]">{children}</h3>,
  h2: ({ children }) => <h4 className="mt-2 font-imFeel text-xl text-[#F3B43F]">{children}</h4>,
  h3: ({ children }) => <h5 className="mt-2 font-imFeel text-lg text-[#F3B43F]">{children}</h5>,
  p: ({ children }) => <p className="text-lg leading-relaxed text-white/80">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-white/90">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#F3B43F] underline decoration-[#F3B43F]/50 hover:text-[#BC8418]"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="ml-5 list-disc space-y-1 text-base text-white/80">{children}</ul>,
  ol: ({ children }) => <ol className="ml-5 list-decimal space-y-1 text-base text-white/80">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[#F3B43F]/60 pl-3 italic text-white/70">{children}</blockquote>
  ),
  hr: () => <hr className="border-white/10" />,
  code: ({ children }) => (
    <code className="rounded bg-black/40 px-1 py-0.5 text-xs text-[#F3B43F]">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-white/80">{children}</pre>
  ),
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element -- conteúdo dinâmico vindo do admin, sem domínio fixo pro next/image
    <img
      src={resolveMediaUrl(typeof src === "string" ? src : undefined)}
      alt={alt ?? ""}
      className="max-h-96 w-full rounded-xl border border-black/30 object-contain"
      loading="lazy"
    />
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-lg leading-relaxed tabular-nums text-white/90">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-white/15 bg-black/30 px-3 py-2 text-left font-bold text-[#F3B43F]">{children}</th>
  ),
  td: ({ children }) => <td className="border border-white/10 px-3 py-2">{children}</td>,
};

export default function WikiMarkdownContent({ conteudo }: { conteudo: string }) {
  return (
    <div className="font-imFeel flex flex-col gap-3">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={componentes}>
        {conteudo}
      </ReactMarkdown>
    </div>
  );
}
