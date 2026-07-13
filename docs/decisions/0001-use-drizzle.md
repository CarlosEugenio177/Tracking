# 0001 - Uso do Drizzle ORM

## Problema
Precisamos de um ORM que seja type-safe, suporte ambientes Edge/Serverless para escalabilidade futura, e integre perfeitamente com Zod para validação.

## Opções Consideradas
1. Prisma
2. TypeORM
3. Drizzle ORM

## Decisão
Escolhemos o **Drizzle ORM**.

## Consequências
- Tipagem SQL-like diretamente no TypeScript, sem geração pesada de clientes intermediários.
- Melhor performance de cold-start se migrarmos para Edge.
- Curva de aprendizado um pouco maior para quem vem do Prisma, mas compensada pela clareza do SQL gerado.
