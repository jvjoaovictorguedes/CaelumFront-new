# Fase 4 — realtime por domínio

PvpSocketContext mantém a API pública e os reexports. Estado e listeners foram separados em hooks de PvP, ranked, torneio, party e guild boss. useCombatTransport mantém uma única conexão compartilhada, autenticação por ticket/ack, presença e resync. Não há JWT acessível ao browser nem conexão adicional por domínio.

Cada registro guarda sua referência de handler e a remove no cleanup, preservando listeners de outros consumidores. A desmontagem invalida a busca de ticket pendente antes de desconectar. Reducers puros preservam ordem do histórico, merge de série e deduplicação de membro por batalha. O estado continua com React; não foi introduzida biblioteca global.

WorldBossSocketContext, mensagens e chat já possuem ciclos separados e não foram fundidos nesta extração. A migração dos consumidores para APIs de domínio pode continuar gradualmente; a fachada evita ruptura agora.

Validação: TypeScript passou; quatro testes de transição/cleanup passaram. O smoke de navegação/autenticação/realtime e o build completo serão gates da Fase 7.
