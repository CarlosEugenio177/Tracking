const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs');
const decisionsDir = path.join(docsDir, 'decisions');

// Create directories
[docsDir, decisionsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const files = {
  'README.md': `# TrackFlow - Documentação

Bem-vindo à documentação oficial do TrackFlow. Esta pasta contém todas as definições estratégicas, decisões arquiteturais e documentação técnica do projeto.

## Produto
- [Visão (vision.md)](vision.md)
- [Posicionamento (positioning.md)](positioning.md)
- [Roadmap (roadmap.md)](roadmap.md)
- [Concorrentes (competitors.md)](competitors.md)
- [Personas (personas.md)](personas.md)
- [Precificação (pricing.md)](pricing.md)

## Engenharia
- [Arquitetura (architecture.md)](architecture.md)
- [Banco de Dados (database.md)](database.md)
- [API (api.md)](api.md)
- [Segurança (security.md)](security.md)
- [Deploy (deployment.md)](deployment.md)

## Registro de Decisões
- [ADRs (decisions/)](decisions/)
`,

  'vision.md': `# Visão do Produto

## Qual problema resolvemos?
Times de marketing e growth perdem muito dinheiro porque:
1. Dependem de planilhas frágeis para padronizar UTMs.
2. Pixels e eventos quebram silenciosamente sem ninguém notar.
3. Não há uma visibilidade confiável da jornada completa: do clique no anúncio até a venda no CRM.
4. As ferramentas atuais são caixas-pretas que dificultam o debug.

## Para quem?
- Gestores de Tráfego
- Engenheiros de Analytics
- Times de Growth
- Agências B2B e produtores digitais focados em performance extrema.

## Por que esse produto existe?
Para ser o **Sistema Operacional do Tracking Digital**. Queremos centralizar links, webhooks, eventos e conversões em um único hub, oferecendo governança proativa e ferramentas de nível "developer" (como Webhook Explorer e Event Timeline) adaptadas para profissionais de marketing.

## O que não faremos?
- Não seremos mais um gerador de link curto genérico.
- Não seremos um dashboard de métricas vaidosas. Toda métrica deve ser acionável.
- Não substituiremos o CRM, nós o alimentaremos com dados melhores.
`,

  'positioning.md': `# Posicionamento

## Proposta de Valor
Governança absoluta e inteligência acionável sobre todo o pipeline de dados de marketing. Pare de tentar adivinhar de onde vêm suas vendas e descubra onde o seu tracking está quebrado antes de perder dinheiro.

## Diferenciais
- **Tracking Doctor:** Diagnóstico proativo de falhas no tracking.
- **Webhook Explorer:** Uma experiência "Postman-like" nativa para inspecionar webhooks de marketing.
- **Lead Timeline:** A jornada visual completa do usuário.
- **UTM Governance:** Padronização forçada sem esforço manual.

## Concorrentes
Nós nos posicionamos de forma diferente das ferramentas tradicionais. Enquanto o Hyros e Voluum focam puramente no cálculo de atribuição final, nós focamos na **governança da operação inteira**, dando visibilidade técnica e de negócio.

## Slogan
O Sistema Operacional do Tracking Digital.

## ICP (Ideal Customer Profile)
Agências de performance e produtores digitais com investimento mensal em ads acima de R$ 50k, que dependem fortemente de integrações via webhook (Stripe, Hotmart, HubSpot) e sentem dor crônica com discrepância de dados.
`,

  'roadmap.md': `# Roadmap

## MVP (Foco Atual)
- Correção de falhas na fundação (Seed de auth, especificação OpenAPI)
- UTM Governance (Gerador padronizado integrado ao banco de dados)
- Webhook Explorer V1 (Recepção e inspeção visual de payloads)
- Dashboard de conversão básico.

## V1 (Atingindo a Visão Básica)
- **Tracking Doctor:** Alertas proativos ("Pixel não disparou", "Webhook falhou").
- **Event Explorer:** Visualização em tempo real de eventos entrando.
- **Lead Timeline V1:** Conectar o clique à conversão visualmente.

## V2 (Inteligência e Crescimento)
- **Campaign Intelligence:** Identificar quais campanhas atraem "leads ruins".
- **Health Center:** Score de qualidade do tracking (0 a 100).
- Permissões avançadas de time (RBAC).

## V3 e Longo Prazo
- Integrações nativas bidirecionais (enviar eventos corrigidos de volta para as APIs de Conversão do Meta/Google).
- IA para sugestão de nomenclatura de UTMs e detecção de anomalias no CPL/CPA.
`,

  'competitors.md': `# Análise de Concorrentes

## Hyros
- **Funcionalidades:** Atribuição ultra-focada em IA, relatórios de ROAS.
- **Preço:** Muito alto ($349+/mês, convite apenas muitas vezes).
- **Pontos Fracos:** Fechado, difícil de fazer debug ("caixa preta"), UX complexa.
- **O que podemos fazer melhor:** Oferecer transparência. Com o Webhook/Event Explorer, o usuário vê exatamente o que entrou e como foi classificado, gerando confiança.

## Voluum / RedTrack
- **Funcionalidades:** Tracking de cliques para afiliados, redirecionamento.
- **Preço:** Médio-Alto ($149+).
- **Pontos Fracos:** Foco excessivo no mercado de afiliados e CPA, interface defasada, pouca visão de funil longo (CRM).
- **O que podemos fazer melhor:** Focar em operações B2B/SaaS e e-commerce moderno, com uma UX muito mais clean e voltada para a jornada longa do Lead, não apenas o redirecionamento.

## Triple Whale
- **Funcionalidades:** Dashboard unificado para E-commerce (Shopify).
- **Pontos Fracos:** Muito dependente do ecossistema Shopify.
- **O que podemos fazer melhor:** Ser agnósticos de plataforma, focando na solidez da ingestão de webhooks genéricos (ex: Hotmart, Kiwify, Stripe, Pipedrive).
`,

  'personas.md': `# Personas\n\nEm elaboração...`,
  'pricing.md': `# Pricing\n\nEm elaboração...`,
  'architecture.md': `# Arquitetura\n\nEm elaboração...`,
  'database.md': `# Banco de Dados\n\nEm elaboração...`,
  'api.md': `# Documentação da API\n\nEm elaboração...`,
  'integrations.md': `# Integrações\n\nEm elaboração...`,
  'security.md': `# Segurança\n\nEm elaboração...`,
  'deployment.md': `# Deploy\n\nEm elaboração...`,
  'changelog.md': `# Changelog\n\nTodas as mudanças notáveis serão documentadas aqui, usando Versionamento Semântico.`,
  'backlog.md': `# Backlog\n\n- [ ] Must Have\n- [ ] Should Have\n- [ ] Could Have\n- [ ] Won't Have`,
  'glossary.md': `# Glossário\n\nEm elaboração...`,

  'decisions/0001-use-drizzle.md': `# 0001 - Uso do Drizzle ORM

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
`,

  'decisions/0002-use-clerk.md': `# 0002 - Autenticação com Clerk

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
`,

  'decisions/0003-monorepo.md': `# 0003 - Arquitetura Monorepo (pnpm)

## Problema
Compartilhar tipagens Zod, definições de banco de dados e schemas OpenAPI entre o frontend e backend sem criar pacotes npm privados ou duplicar código.

## Opções Consideradas
1. Repositórios separados
2. Turborepo
3. pnpm workspaces nativo

## Decisão
Escolhemos **pnpm workspaces**.

## Consequências
- Código compartilhado facilmente na pasta \`lib/\`.
- Build rápido com \`onlyBuiltDependencies\`.
- Simplifica testes e CI, garantindo que front e back estejam sempre sincronizados com os mesmos tipos de dados.
`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(docsDir, filepath), content);
}

console.log('Docs scaffolded successfully.');
