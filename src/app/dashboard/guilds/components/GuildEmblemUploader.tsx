"use client";

import { useRef, useState } from "react";
import { enviarEmblemaDaGuild } from "../emblemAction";
import { resolveMediaUrl } from "@/utils/media-url";

// Espelha src/config/guildEmblemConfig.js (caelumback-new) — o backend
// é quem de fato valida e recusa; isso aqui só evita fazer o jogador
// esperar um upload inteiro pra descobrir que a imagem não serve.
const DIMENSAO_MINIMA_PX = 128;
const DIMENSAO_MAXIMA_PX = 2048;
const TAMANHO_MAXIMO_BYTES = 3 * 1024 * 1024;
const TOLERANCIA_PROPORCAO = 0.05;
const TIPOS_ACEITOS = ["image/png", "image/jpeg", "image/webp"];

function lerDimensoes(arquivo: File): Promise<{ largura: number; altura: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ largura: img.naturalWidth, altura: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler essa imagem."));
    };
    img.src = url;
  });
}

export default function GuildEmblemUploader({
  idGuild,
  emblemaAtual,
  onEnviado,
}: {
  idGuild: number;
  emblemaAtual: string | null;
  onEnviado: (novaEmblemaUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [previaUrl, setPreviaUrl] = useState<string | null>(null);

  async function aoEscolherArquivo(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    event.target.value = ""; // permite escolher o MESMO arquivo de novo depois de um erro
    if (!arquivo) return;

    setErro("");

    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      setErro("Formato não aceito. Envie um PNG, JPEG ou WEBP.");
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
      setErro(`A imagem pode ter no máximo ${Math.round(TAMANHO_MAXIMO_BYTES / 1024 / 1024)}MB.`);
      return;
    }

    let dimensoes: { largura: number; altura: number };
    try {
      dimensoes = await lerDimensoes(arquivo);
    } catch {
      setErro("Não foi possível ler essa imagem. Tente outro arquivo.");
      return;
    }

    if (dimensoes.largura < DIMENSAO_MINIMA_PX || dimensoes.altura < DIMENSAO_MINIMA_PX) {
      setErro(`A imagem precisa ter pelo menos ${DIMENSAO_MINIMA_PX}x${DIMENSAO_MINIMA_PX} pixels.`);
      return;
    }
    if (dimensoes.largura > DIMENSAO_MAXIMA_PX || dimensoes.altura > DIMENSAO_MAXIMA_PX) {
      setErro(`A imagem pode ter no máximo ${DIMENSAO_MAXIMA_PX}x${DIMENSAO_MAXIMA_PX} pixels.`);
      return;
    }
    const proporcao = dimensoes.largura / dimensoes.altura;
    if (Math.abs(proporcao - 1) > TOLERANCIA_PROPORCAO) {
      setErro("A imagem precisa ser quadrada (mesma largura e altura). Recorte a imagem antes de enviar.");
      return;
    }

    setPreviaUrl(URL.createObjectURL(arquivo));
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("imagem", arquivo);
      const resultado = await enviarEmblemaDaGuild(idGuild, formData);
      if (!resultado.success || !resultado.emblemaUrl) {
        setErro(resultado.message || "Não foi possível enviar a imagem.");
        return;
      }
      onEnviado(resultado.emblemaUrl);
    } finally {
      setEnviando(false);
    }
  }

  const srcExibido = previaUrl ?? resolveMediaUrl(emblemaAtual);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/30 p-3">
      <p className="text-xs uppercase tracking-widest text-white/50">Emblema da guilda</p>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#F3B43F]/60 bg-black/40">
          {srcExibido ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagem enviada pelo jogador, nunca passa por next/image
            <img src={srcExibido} alt="Emblema da guilda" className="h-full w-full object-cover" />
          ) : (
            <span className="font-imFeel text-2xl text-[#F3B43F]/40">?</span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
            className="w-fit rounded-lg border border-white/30 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-50"
          >
            {enviando ? "Enviando..." : "Escolher imagem"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={aoEscolherArquivo}
            className="hidden"
          />
          <p className="text-xs text-white/50">
            A imagem precisa estar enquadrada em formato quadrado (mesma largura e altura), entre{" "}
            {DIMENSAO_MINIMA_PX}x{DIMENSAO_MINIMA_PX} e {DIMENSAO_MAXIMA_PX}x{DIMENSAO_MAXIMA_PX} pixels, até{" "}
            {Math.round(TAMANHO_MAXIMO_BYTES / 1024 / 1024)}MB (PNG, JPEG ou WEBP). Recorte a imagem antes de
            enviar — o sistema não corta nem distorce por você.
          </p>
        </div>
      </div>
      {erro && <p className="text-xs text-red-400">{erro}</p>}
    </div>
  );
}
