# Fase 7 — validação do frontend

O runner usa o Node disponível, sem Jest/Vitest ou transpiler extra: `npm test` executa os testes puros de editor, contratos, reducers e cleanup. Node 22.6+ suporta o strip de TypeScript usado aqui; CI instala o último Node 22. O build verifica também os fixtures TS com satisfies.

Fixtures de eventos/início/turno/fim/rating/grupo são exportadas dos serializers do backend para test/fixtures/combat-contracts.{json,ts}. O teste compara os eventos com o espelho frontend. Atualizações de contrato exigem revisão nos dois repositórios; o snapshot não deve ser regenerado só para esconder quebra de compatibilidade.

## Smoke real Next com backend e realtime simulados

O browser usa playwright-core e um mock Socket.IO (ambos dev dependencies). O teste inicia backend em 127.0.0.1:3101 e Next standalone em 127.0.0.1:3100; fecha os processos ao terminar. Nenhum dado real ou segredo é usado. Os endpoints externos são bloqueados no browser.

Para reproduzir:

```sh
npm ci
npm test
npm run lint
NEXT_PUBLIC_API_URL=http://127.0.0.1:3101/api INTERNAL_API_URL=http://127.0.0.1:3101/api npm run build
npx playwright-core install --with-deps chromium
npm run test:smoke
```

Com Chromium já instalado, BROWSER_EXECUTABLE_PATH pode fornecer o binário. Os dois ports devem estar livres. Build smoke precisa do NEXT_PUBLIC_API_URL de teste porque o Next incorpora essa variável no bundle. Esse é um artefato de teste; builds de deploy continuam usando as variáveis reais do ambiente. Para voltar à aplicação local, refaça o build com as URLs locais reais.

O cenário valida formulário/login por Server Action, cookie httpOnly, Bearer no BFF, dashboard, transporte de combate compartilhado em navegações, slot 5 preservado com quatro vazios, tooltip, turno/fim casual, início/rating ranked, resync/rodada de grupo, 403 que preserva sessão e 401 que limpa cookies. Não é teste de gameplay contra produção ou teste de carga.

## Gates e custo observado

CI executa testes puros, lint, build e smoke. Cache do browser reduz downloads; apt/dependências do Chromium acrescentam custo no primeiro runner.

Execução local: 17 testes puros, zero falhas/ignorados, ~0,17 s. Smoke: um cenário, zero falhas/ignorados, ~3,8 s após build. Build passou incluindo types/lint; build final com URLs locais reais levou 46,4 s. Warnings existentes não foram convertidos em erros nem ocultados. CI remoto não foi executado.

As extrações de realtime e do admin são descritas em realtime.md e decomposition.md. Lifecycle completo de todos os modos e todas as telas administrativas continuam fora desse smoke curto.
