# 0004 - Estratégia de Deploy com Docker (Container Único)

## Problema
Como estruturar a conteinerização do monorepo (Frontend Vite + Backend Express) para garantir deploys rápidos, reprodutibilidade de ambiente ("na minha máquina funciona") e baixo custo inicial (MVP).

## Opções Consideradas
1. **Multi-container via Docker Compose:** Um container Nginx servindo o Frontend e fazendo proxy para um container Node.js (Backend).
2. **Container Único (Unified Image):** Um único container Node.js rodando o Express, que por sua vez serve os arquivos estáticos pré-compilados (`dist`) do Frontend.

## Decisão
Escolhemos o **Container Único (Unified Image)**. 

O `Dockerfile` usa _multi-stage builds_ para instalar dependências de desenvolvimento, buildar o frontend (`pnpm build`) e o backend, e depois copiar apenas os artefatos compilados para uma imagem Node Alpine enxuta que instala apenas dependências de produção.

## Consequências
- **Vantagens:** 
  - Deploy extremamente simplificado em PaaS (Render, Railway, Fly.io) custando apenas uma instância.
  - Elimina a dor de cabeça de configurar CORS em ambientes diferentes, pois Front e Back rodam sob o mesmo domínio e porta.
- **Desvantagens:**
  - O Node.js não é tão eficiente quanto o Nginx para servir arquivos estáticos, embora para o volume inicial de acessos ao dashboard isso seja imperceptível.
  - Se precisarmos escalar o Backend de forma independente do Frontend no futuro, precisaremos separar as imagens.
