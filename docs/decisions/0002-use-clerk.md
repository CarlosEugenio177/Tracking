# 0002 - Autenticação com Clerk

## Problema
Construir autenticação B2B, gestão de sessões, reset de senha e suporte a Workspaces consome muito tempo e é sensível a falhas de segurança.

## Opções Consideradas
1. Auth.js (NextAuth) com banco próprio
2. Supabase Auth
3. Clerk

## Decisão
Escolhemos o **Clerk**.

## Consequências
- Acelera o Go-to-Market focado no Core Product (Tracking) ao invés de reinventar auth.
- Gestão nativa de Workspaces (Organizações B2B).
- Dependência de um serviço terceiro crítico (vendor lock-in de auth).
