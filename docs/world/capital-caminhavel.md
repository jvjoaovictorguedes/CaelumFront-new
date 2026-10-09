# Centro de Caelum — primeiro teste web

A rota protegida `/dashboard/mundo` inicia na praça caminhável. O atlas oficial continua disponível no botão Consultar atlas. A flag administrativa e sua reconfirmação continuam controlando acesso às duas cenas.

Cena local 2D independente do atlas: arte original SVG com exportação WebP, personagem PNG, praça, fonte, salões e jardins. Reproduzir com `node scripts/generate-capital-art.cjs`. As coordenadas desta praça são locais; não alteram as coordenadas ou polígonos oficiais do banco.

WASD/setas movem o personagem, Shift corre, clique no chão move em linha reta até o primeiro obstáculo, roda ajusta zoom. Não há pathfinding: para contornar prédios use as ruas e cliques intermediários. Colisões verificam passos pequenos e permitem deslizar nas bordas. E ou botão de conversa abre o NPC próximo. Ferreiro e taverneira encaminham às telas existentes; nenhuma economia ou recompensa é simulada pela cena. O diálogo pausa o movimento.

Posição é local e reinicia ao reabrir/trocar cena. Não há persistência, presença multiplayer ou combate. Não se trata de uma implementação de movimento autoritativo do servidor. A arte e o balanço visual ao caminhar são a primeira passagem; não há sprite sheet de animação em oito direções. NPCs compartilham a silhueta do cavaleiro com cores distintas nesta etapa.

Verificação: testes de geometria e colisão, suíte existente, build TypeScript/ESLint e smoke Chromium com API de fixture. Smoke verifica movimento real, bloqueio pela fonte, diálogo do ferreiro, rota do serviço, bloqueio de movimento durante diálogo, atlas e revogação.
