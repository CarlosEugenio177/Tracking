# Roadmap

## MVP (Foco Atual)
- Correção de falhas na fundação (Seed de auth, especificação OpenAPI)
- UTM Governance (Gerador padronizado integrado ao banco de dados)
- Webhook Explorer V1 (Recepção e inspeção visual de payloads)
- **Tracking Doctor V1:**
  - **URL Scanner:** Detecção automática de pixels (Facebook, GTM, Analytics) no código-fonte das páginas.
  - **Page Simulator:** Navegador headless no servidor (com bypass antibloqueio e controle de navegação) capaz de visitar URLs, clicar em botões e interceptar requisições de rede (como eventos `PageView` e `Lead` do Facebook Pixel).
- Dashboard de conversão básico.

## V1 (Atingindo a Visão Básica)
- **Event Explorer:** Visualização em tempo real de eventos entrando.
- **Lead Timeline V1:** Conectar o clique à conversão visualmente.

## V2 (Inteligência e Crescimento)
- **Campaign Intelligence:** Identificar quais campanhas atraem "leads ruins".
- **Health Center:** Score de qualidade do tracking (0 a 100).
- Permissões avançadas de time (RBAC).

## V3 e Longo Prazo
- Integrações nativas bidirecionais (enviar eventos corrigidos de volta para as APIs de Conversão do Meta/Google).
- IA para sugestão de nomenclatura de UTMs e detecção de anomalias no CPL/CPA.
