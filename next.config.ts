import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Server Actions que recebem FormData binário (uploadMediaAction.ts,
      // emblemAction.ts) caem no limite padrão de 1MB do Next e retornam
      // 500 pra qualquer arquivo real acima disso — o backend já aceita
      // até 20MB pra áudio da Biblioteca de Mídia (ver mediaAssetConfig.js),
      // então o limite aqui precisa ser igual ou maior. Um pouco de folga
      // além dos 20MB cobre o overhead do multipart/form-data.
      bodySizeLimit: "22mb",
    },
  },
};

export default nextConfig;
