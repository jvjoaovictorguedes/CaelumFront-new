# Mundo explorável — Fase 0

Entrega para validação, sem rollout geral. A rota `/dashboard/mundo` passa pelo middleware existente de `/dashboard/:path*`. O Server Component consulta o manifesto autenticado; sem autorização não monta Phaser. `/prototype-2d` redireciona para esta rota e seu terreno aleatório foi removido.

## O que esta fase permite

Conferir a Capital, a escala e os pontos cadastrados usando a arte oficial. Arrastar, WASD e roda movem a **câmera**, não o personagem. Não existe escrita de posição, recompensa, dano, coleta ou presença online. A Fase 1 adicionará a Capital caminhável, as colisões validadas e os serviços que abrem as telas atuais.

O acesso começa desligado. Um admin com `world.manage` consulta o ID e habilita/retira a flag em **Admin → Mundo explorável**. O link no mapa aparece somente para personagens habilitados. Uma visualização aberta reconfirma o acesso a cada 15 segundos; revogação ou falha de confirmação desmonta o jogo. As imagens são assets públicos: a flag protege a experiência, não a confidencialidade da arte.

## Escala e fonte da verdade

`@caelum/world-contracts@0.1.0` contém a única implementação das conversões: 400 × 180 tiles de 32 px; percentuais → tiles → pixels; interesse por chunks de 32 tiles. A origem do pacote fica em `CaelumBack-new/packages/world-contracts`. O Front instala o tarball versionado em `vendor/`, com integridade registrada no lockfile. Não requer um checkout do Back no build do Front.

A imagem original tem 1536 × 961 px, proporção diferente da grade 400 × 180 especificada na missão. Nesta entrega a arte é reescalada para essa grade, e o minimapa recebe **a mesma transformação**, sem deslocar pins. A transformação matemática é exata; isso não comprova que as posições históricas dos pins correspondam aos marcos desenhados.

O seed histórico declara posições e polígonos **provisórios**. O manifesto lê os dados atuais do banco; esta fase não os corrige nem afirma conformidade artística de 2%. O botão “Conferir limites cadastrados” mostra esses polígonos para revisão. É necessário validar arte/coordenadas antes de liberar navegação na Fase 1. Se forem corrigidos, usar uma migration nova.

## Mapas Tiled e chunks

`public/world/v1/maps/` contém um Tiled JSON por Capital/território, com coordenadas globais e image layers referenciando 78 recortes da arte oficial. São **shells cartográficos**, não mapas top-down jogáveis completos: todos referenciam a mesma geografia global. A camada de colisão bloqueia conservadoramente o mundo inteiro e `navegacao_habilitada` é false. Não existem rios/estradas/biomas gerados aleatoriamente. Os tilesets de gameplay serão pintados sobre esta referência nas fases jogáveis.

O minimapa usa uma versão de 240×108 px da mesma arte e só começa a carregar após o primeiro quadro do mundo. O cliente carrega só o mapa da Capital. Para exibição, usa recortes de preview com 1/4 da largura/altura (1/16 da memória gráfica), mantendo os arquivos completos para o Tiled. A escala de apresentação fica em propriedades de cada image layer; as coordenadas globais não mudam. Importa Phaser dinamicamente na rota autorizada, prioriza os chunks visíveis no primeiro quadro e depois acrescenta uma borda de interesse, remove imagens/texturas que saem dessa área e bloqueia URLs fora do padrão de assets local. Limites da câmera são os limites do mundo. Falha em um chunk produz um aviso, sem um loop de tentativas.

Reexportar após uma atualização intencional da arte:

```sh
npm run world:maps
npm test
```

A proveniência com hash SHA-256 da imagem está em `public/world/v1/provenance.json`. Uma release de assets publicada é imutável; a próxima versão deve usar novo diretório/versão coordenado com o manifesto do Back.

Atualizar contratos a partir do Back:

```sh
node scripts/export-world-contracts.js /caminho/CaelumFront-new
# No Front:
npm install ./vendor/caelum-world-contracts-0.1.0.tgz
```

Durante este PR a versão 0.1.0 está em preparação. Após publicá-la, incrementar a versão para qualquer alteração. Conferir origem e tarball juntos em revisão.

## Contratos e próximas fases

`src/types/contracts/world.ts` reexporta os tipos compartilhados de `world:join`, `world:leave`, `world:move`, `world:interact`, `world:cast`, `world:snapshot` e `world:error`. São reservas de protocolo, **sem transporte de mundo conectado**. Movimento leva sequência/destino; conjuração leva habilidade e alvo/ponto/direção. Identidade, velocidade, custo e dano serão determinados no servidor.

Não foi escolhido nesta fase o valor de um turno em segundos, a conversão de `velocidade` para deslocamento nem a janela de combo. Essas decisões precisam de aprovação antes das fases correspondentes. Fórmulas de combate/economia existentes permanecem intactas.

Arte necessária para a Fase 1/3: 8 direções de idle, caminhada, corrida, ataque básico, conjuração, impacto e morte, mais animações específicas de habilidades (giro etc.). Os sprites laterais atuais não comprovam cobertura de 8 direções; placeholders devem continuar identificados até a arte chegar.

## Verificação

`npm test`: contratos, alinhamento matemático, proveniência, arquivos Tiled e interesse por chunks, junto das regressões existentes. `npm run build`: build e validação de TypeScript/ESLint. `npm run test:smoke`: Next/Phaser/Chromium reais com backend HTTP de fixture; cobre sessão, flag, painel, streaming da câmera e revogação. O backend tem testes próprios de autenticação/autorização e transação em Postgres local descartável.

A demonstração é uma gravação desse navegador, não um mockup. Metas de 60/30 fps, 4G, latência de ações e 100 jogadores/300 monstros **ainda não estão validadas**: não há runtime de mundo ou combate nesta fase.

Para reproduzir o smoke, o URL público precisa ser definido **no build**, porque também é usado pelo transporte Socket.IO existente. O runner usa as portas locais 3100/3101:

```sh
NEXT_PUBLIC_API_URL=http://127.0.0.1:3101/api INTERNAL_API_URL=http://127.0.0.1:3101/api npm run build
BROWSER_EXECUTABLE_PATH=/caminho/chromium npm run test:smoke
```

Esses valores são exclusivos dos testes locais; no deploy usar os URLs configurados para o ambiente.
