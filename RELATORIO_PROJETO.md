# Relatório do Projeto — TrackFlow

_Data do relatório: 11 de julho de 2026_

## 1. Visão geral

**TrackFlow** é uma plataforma SaaS de governança de rastreamento digital para times de marketing. Centraliza campanhas, links UTM, webhooks de ingestão, eventos e conversões em um único painel, com o objetivo de dar visibilidade total sobre a origem de cada lead e cada venda.

O projeto é um monorepo pnpm com três artefatos (serviços) configurados:

| Artefato | Tipo | Diretório | Função |
|---|---|---|---|
| TrackFlow | Web (React + Vite) | `artifacts/trackflow` | Frontend da aplicação |
| API Server | API (Express) | `artifacts/api-server` | Backend REST |
| Canvas | Design (mockup sandbox) | `artifacts/mockup-sandbox` | Ambiente de prototipagem visual |

Pacotes compartilhados relevantes:
- `lib/db` — schema do banco (Drizzle ORM + PostgreSQL) e tipos/validação (Zod).
- `lib/api-client-react` — hooks React Query gerados via Orval a partir do spec OpenAPI da API.

## 2. Stack técnica

- **Frontend:** React + Vite, Tailwind CSS, componentes shadcn/ui, Recharts (gráficos), Wouter (roteamento), TanStack React Query.
- **Backend:** Node.js + Express, PostgreSQL via Drizzle ORM, validação com Zod.
- **Autenticação:** Clerk (chaves de desenvolvimento configuradas via secrets `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `SESSION_SECRET`).
- **Geração de API:** Orval gera hooks tipados a partir do OpenAPI spec do backend, consumidos pelo frontend.

## 3. Funcionalidades construídas

### 3.1 Módulos de produto
- **Landing page** — página pública de apresentação do produto.
- **Dashboard** — KPIs gerais, gráficos de desempenho, linha do tempo de atividade.
- **Campanhas** — listagem, busca, filtro por status, criação, ativação/pausa e exclusão de campanhas; página de detalhe com estatísticas (cliques, leads, conversões, receita), links associados e eventos recentes.
- **Links (UTM)** — listagem de links rastreados e Gerador de UTM (formulário que monta URLs padronizadas com parâmetros utm_source/medium/campaign/content/term).
- **Webhooks** — listagem de endpoints de ingestão, criação de novos endpoints, cópia de URL; página de detalhe com logs de requisição (headers/payload expansíveis), reenvio de eventos e atualização manual dos logs.
- **Eventos** — pipeline de eventos (clique, lead, webhook, crm, venda) com filtros por tipo e por Lead ID, timeline visual.
- **Conversões** — resumo de receita, ticket médio, conversões verificadas, receita por plataforma (gráfico de pizza), top campanhas por ROAS (gráfico de barras), registro detalhado de conversões, com seletor de período (7/30/90 dias).
- **Configurações** — edição do perfil do workspace (nome/slug) e painel de integrações (Meta Ads, Google Ads, HubSpot, Slack — marcadas como "Em Breve").
- **Autenticação** — fluxo de login/cadastro via Clerk, proteção de rotas por workspace (dono + membros).

### 3.2 Backend / API
Rotas REST organizadas por domínio, todas protegidas por autenticação e checagem de acesso ao workspace:
- `workspaces` — listagem, criação, atualização.
- `campaigns` — CRUD completo + estatísticas por campanha.
- `links` — CRUD, geração de UTM, validação de link.
- `webhooks` — CRUD de endpoints, listagem de eventos recebidos, reenvio de evento.
- `events` — listagem/filtro de eventos brutos do pipeline.
- `conversions` — listagem e resumo agregado (por plataforma/campanha).
- `dashboard` — dados agregados e linha do tempo para o painel principal.

Modelo de dados (PostgreSQL via Drizzle): `workspaces`, `workspace_members`, `campaigns`, `links`, `webhooks` (endpoints + eventos), `events`, `conversions`.

## 4. Trabalho realizado nesta fase (sessões recentes)

### 4.1 Correção de bug crítico
- A página **Eventos** continha um `require("lucide-react")` duplicado dentro do componente, conflitando com o import padrão do módulo e causando `ReferenceError: require is not defined`, que travava a aplicação inteira. **Corrigido.**

### 4.2 Tradução completa para português brasileiro (pt-BR)
Todo o texto voltado ao usuário foi traduzido, mantendo termos técnicos consagrados no mercado (Webhooks, Status, ROAS, Payload) em inglês por serem jargão padrão:
- Landing page, Dashboard, Campanhas, Detalhe de Campanha, Links, Gerador de UTM, Webhooks, Detalhe de Webhook, Eventos, Conversões, Configurações, página 404, barra lateral e cabeçalho.
- Mapas de tradução para status de campanha (Ativa, Pausada, Concluída, Rascunho) e tipos de evento (clique, lead, webhook, crm, venda).
- Formatação monetária alterada de `$`/`toLocaleString()` para `R$`/`toLocaleString('pt-BR')`, e datas/horas com localização `pt-BR`.

### 4.3 Elementos clicáveis tornados funcionais
Um levantamento identificou botões que não tinham ação associada (placeholders visuais). Todos foram implementados:

| Local | Ação implementada |
|---|---|
| Campanhas → "Nova Campanha" | Abre formulário (modal) e cria a campanha de fato via API |
| Campanhas → "Filtrar" | Dropdown funcional de filtro por status |
| Campanhas → menu "⋯" de cada linha | Ver detalhes, ativar/pausar e excluir campanha (com confirmação) |
| Webhooks → "Criar Endpoint" | Abre formulário (modal) e cria o endpoint via API |
| Webhooks → busca | Filtra a lista de endpoints em tempo real |
| Detalhe do Webhook → "Atualizar" | Recarrega a lista de logs de requisição |
| Conversões → "Período: Últimos 30 Dias" | Vira seletor real (7/30/90 dias) que refiltra os dados exibidos |

Todas essas ações usam os hooks de API já gerados (`useCreateCampaign`, `useUpdateCampaign`, `useDeleteCampaign`, `useCreateWebhookEndpoint`, `refetch`), com feedback via toasts de sucesso/erro e invalidação de cache do React Query.

## 5. Verificações realizadas
- `tsc --noEmit` no frontend sem erros após cada rodada de mudanças.
- Logs do workflow do frontend e da API revisados após cada alteração — sem erros novos no console do navegador.
- Confirmação visual (screenshot) da landing page renderizada corretamente em português.

## 6. Pendências conhecidas (não relacionadas à tradução/bug corrigido)
- **Dados de seed desatualizados:** o workspace de exemplo tem um `ownerClerkId` que não corresponde a usuários reais logados, causando respostas `403` para contas reais. Requer atualização dos dados de seed ou criação de workspace pelo próprio usuário autenticado.
- **Spec OpenAPI incompleto:** a rota `/webhook/:slug` (endpoint público de ingestão) não está documentada no spec OpenAPI.
- **Estatísticas de campanha:** contagens de cliques/leads aparecem zeradas nas estatísticas agregadas por campanha (dado hardcoded/pendente de implementação no backend).
- **Integrações externas** (Meta Ads, Google Ads, HubSpot, Slack) na página de Configurações são apresentadas como "Em Breve" — ainda não conectadas de fato.
- Clerk está configurado com chaves de **desenvolvimento** (aviso visível no console) — trocar por chaves de produção antes de publicar oficialmente.

## 7. Como rodar o projeto
- Frontend: `pnpm --filter @workspace/trackflow run dev`
- Backend: `pnpm --filter @workspace/api-server run dev`
- Typecheck completo: `pnpm run typecheck`
- Regerar hooks de API a partir do spec OpenAPI: `pnpm --filter @workspace/api-spec run codegen`
- Aplicar mudanças de schema no banco (dev): `pnpm --filter @workspace/db run push`
