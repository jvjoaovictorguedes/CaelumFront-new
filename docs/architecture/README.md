# Consolidação arquitetural — frontend

Entrega incremental autorizada das fases 1–7, em conjunto com o backend.

- [Realtime por domínio e transporte compartilhado](realtime.md)
- [API e componentes administrativos de poderes](decomposition.md)
- [Contratos, testes e browser smoke](testing.md)

PvpSocketContext e lib/api/admin.ts mantêm as APIs públicas/reexports para consumidores existentes. Types de payload ficam em src/types/contracts. Nomes de eventos e endpoints permanecem compatíveis.

Validação local: 17 testes puros + um cenário browser passaram; types/lint/build de produção passaram. Nenhuma escrita em banco de produção foi realizada. O relatório completo, política econômica, núcleo de ações e política de migrations estão em docs/architecture no repositório backend.
