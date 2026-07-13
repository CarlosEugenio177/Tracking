# 0003 - Arquitetura Monorepo (pnpm)

## Problema
Compartilhar tipagens Zod, definições de banco de dados e schemas OpenAPI entre o frontend e backend sem criar pacotes npm privados ou duplicar código.

## Opções Consideradas
1. Repositórios separados
2. Turborepo
3. pnpm workspaces nativo

## Decisão
Escolhemos **pnpm workspaces**.

## Consequências
- Código compartilhado facilmente na pasta `lib/`.
- Build rápido com `onlyBuiltDependencies`.
- Simplifica testes e CI, garantindo que front e back estejam sempre sincronizados com os mesmos tipos de dados.
