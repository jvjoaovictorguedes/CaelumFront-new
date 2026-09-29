import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deploy no Railway (Railpack, sem Dockerfile próprio) empacotava o
  // node_modules inteiro (600MB+) dentro da imagem final por padrão —
  // era exatamente a etapa "Build › Publishing image..." que ficava
  // travada minutos subindo essa imagem gigante pro registry. Standalone
  // faz o Next gerar só o subconjunto de node_modules que o servidor
  // realmente usa em runtime (via tracing de dependências), reduzindo
  // drasticamente o tamanho da imagem publicada. Exige copiar public/ e
  // .next/static pro pacote standalone no build (não é automático — ver
  // script "build" no package.json) e trocar o start pra rodar o
  // server.js gerado em vez de `next start`.
  //
  // Pegadinha real que isso causou (bug reportado: site respondendo
  // "Application failed to respond" / connection refused mesmo com o
  // deploy "successful" e o log mostrando "Ready"): o server.js gerado
  // pelo standalone escuta em `process.env.HOSTNAME || '0.0.0.0'` — e
  // o Docker SEMPRE define HOSTNAME sozinho como o ID do próprio
  // container (ex.: "9393e05d8643", visível no log de boot). Sem
  // sobrescrever isso, o servidor escuta só nesse hostname interno, não
  // na interface coringa 0.0.0.0 que o proxy da Railway precisa pra
  // rotear até ele de fora — o processo fica "Ready" mas a porta
  // recusa qualquer conexão externa. Corrigido forçando
  // `HOSTNAME=0.0.0.0` no script "start" do package.json.
  output: "standalone",
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
