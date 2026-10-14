# Regra permanente: testar como jogador, não como máquina

Antes de dar um bug como corrigido ou subir qualquer mudança visual/
funcional, **sempre testar o jogo como um ser humano olharia e jogaria
o jogo — nunca só como máquina** (tsc/eslint/testes unitários passando
não é suficiente).

Isso significa, na prática, antes de reportar algo como resolvido:

- Rodar a tela de verdade (dev server ou o smoke de `test/smoke/`
  contra um build real) e olhar o resultado — não só ler o diff do
  código.
- Para bug visual (tooltip cortado, layout quebrado, elemento
  sobreposto), tirar um screenshot no estado relevante (ex.: hover,
  erro, loading) e OLHAR a imagem antes de dizer que está corrigido.
- Para bug de fluxo (botão travado, conexão que não completa, ação que
  não responde), reproduzir o cenário real via um teste Playwright
  contra `test/smoke/mock-backend.mjs` (ou equivalente) que force a
  mesma condição relatada — nunca assumir que "o código parece certo"
  é prova de que o bug sumiu.
- Rodar `npm test`, `npm run lint` e o build continuam obrigatórios,
  mas são o mínimo, não o critério final de "está pronto".

Contexto: esta regra existe porque um fix de bug real (Boss da Guilda
travado em "conectando") foi reportado como corrigido com base só em
tsc/eslint/testes passando, e na prática não resolveu nada — e, no
mesmo ciclo, um tooltip saiu cortado/sobreposto ao topo da aba sem
ninguém ter olhado a tela renderizada. Motivo direto do jogador:
"não é meio óbvio você testar como um ser humano antes de subir?
Fazer estilo máquina não dá certo."

Ver `test/smoke/mock-backend.mjs` e
`test/smoke/realtime-recovery-and-tooltip.test.mjs` como exemplo do
padrão esperado: reproduzir a falha de verdade (não só o caminho feliz)
contra um browser real, e confirmar visualmente (screenshot lido, não
só geometria calculada) antes de reportar um fix como pronto.
