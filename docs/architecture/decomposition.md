# Fase 5 — decomposição por responsabilidade

O domínio de API administrativa de poderes (tipos, vínculos, status e combat effects) foi extraído para `src/lib/api/admin/powers.ts`. O caminho antigo mantém reexports, sem alterar endpoints ou os consumidores. O restante do cliente administrativo continua no arquivo antigo; a extração é incremental por domínio.

AdminPowersClient agora cuida da listagem/criação/seleção. DetalhePower contém edição de uma habilidade, vínculos e efeitos. EvolucaoNaturezaSection contém as evoluções de classe/natureza. O formulário inicial e constantes usados em mais de uma tela ficam em powerForm. Os callbacks, payloads e textos foram preservados.

No backend, as extrações das fases 1 e 2 já separaram serializers e resolução de ação dos sockets/controllers. Não foram movidas rotas/autorização, modelos nem migrations para simular redução de linhas. Outras partes extensas continuam candidatas a extrações futuras, orientadas por mudanças concretas.

Validação: TypeScript passou após ambas as extrações. O build e smoke da Fase 7 verificarão os consumidores e navegação.
