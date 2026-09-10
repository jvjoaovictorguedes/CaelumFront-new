interface ComingSoonProps {
  titulo: string;
  descricao?: string;
}

// Placeholder para as seções do jogo que ainda não foram desenvolvidas
// (Loja, Guildas, Mapa, Missões, Duelo, Mensagens, Ranking). Antes essas
// abas apontavam para rotas fora do layout do dashboard e quebravam a
// navegação; agora pelo menos abrem uma tela consistente dentro do jogo.
export default function ComingSoon({ titulo, descricao }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <h1 className="font-imFeel text-5xl mb-4">{titulo}</h1>
      <p className="text-lg text-black/70 max-w-md">
        {descricao ?? "Essa área ainda está sendo construída. Em breve chega novidade por aqui."}
      </p>
    </div>
  );
}
