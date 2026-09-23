# Triagem Sentry e PostHog antes da onda 8 — 23/09/2026

## Fontes e limite da evidência

O relatório `bug_analysis_report.md` fornecido pelo solicitante foi tratado como hipótese. A consulta direta, somente leitura, usou o proxy Sentry existente no Supabase e a API do PostHog pelo diagnóstico local. O PostHog MCP tornou-se disponível durante a triagem e confirmou acesso de leitura ao projeto 341310. Sentry MCP continua indisponível nesta sessão; a conexão depende da configuração que o solicitante informou que fará. Supabase MCP está acessível. O Vercel MCP aparece, mas a consulta ao projeto devolveu 403 por falta de autorização ao escopo `viniflix-projects`; o deploy e seu sucesso foram conferidos pelo status Vercel do commit no GitHub. GitHub MCP não apareceu.

## Achados

| Evidência | Conclusão | Ação |
| --- | --- | --- |
| Sentry `JAVASCRIPT-REACT-2A`, evento de produção em `/nutritionist/templates` no release `c53b5846` | A prévia de formulário renderizava `field.options` diretamente como filho React. O editor e os templates base salvam opções como objetos `{label, value}`. O erro derruba a prévia. | Renderizar o rótulo da opção, mantendo compatibilidade com opções antigas em string. Teste de interface cobre ambos os formatos. |
| Sentry `JAVASCRIPT-REACT-31`, biometria parcial em desenvolvimento `0.0.0` | A consulta opcional de `user_profiles` usava `.single()`, que devolve erro quando não há linha. `Promise.all` não rejeita por esse resultado do Supabase; a função já mantinha as demais fontes, mas registrava uma falha evitável. | Usar `.maybeSingle()` e testar perfil ausente com antropometria presente. |
| Sentry `JAVASCRIPT-REACT-2N`, `22P02`, em desenvolvimento | O stack aponta para `TemplateManagerDialog` → `getMealPlanById`. A correção da onda 7 já separou ID UUID de template do ID numérico de plano. | Validar no Preview; não recriar tabelas ou mudar tipos sem nova evidência. |
| Sentry `JAVASCRIPT-REACT-2Q`, feed, e outros erros de consultas simultâneas em desenvolvimento `0.0.0` | A função `get_comprehensive_activity_feed_optimized(p_nutritionist_id uuid, p_limit integer)` existe no banco e admite execução autenticada. A hipótese de RPC ausente/assinatura errada no relatório não procede. O erro não contém código/status e ocorreu junto a múltiplas consultas falhando na mesma sessão de desenvolvimento. | Classificar falha de rede sem registrar mensagens brutas; reavaliar com novo evento em Preview ou produção e código/status/correlação. |
| PostHog, últimos 100 eventos `operation_failed` consultados | 91 eram do release de desenvolvimento `0.0.0`; os 9 eventos do release de produção `c53b5846` eram 8 tentativas de login HTTP 400 e 1 atualização de senha HTTP 422. Isso não demonstra indisponibilidade das queries em produção. | Priorizar exceções reais de produção; separar eventos esperados de autenticação dos incidentes. |
| Relatório: copiar `error.message`, `cause` e objeto integral para Sentry | Mensagens/detalhes SQL podem conter dados clínicos e identificadores. O código atual os omite intencionalmente. | Mantido o limite de privacidade. Telemetria passa a indicar uma categoria segura (`network_failure`, `record_missing`, `request_aborted`, `unclassified`), com teste de que texto sensível não é enviado. |
| Relatório: plano ativo usa `.single()` | `getActiveMealPlan` já usa `.maybeSingle()` no código atual. | Sem alteração. |

Issues antigos de `toast`, `HubPanel` e `isCloning` são de releases de agosto/início de setembro; o código atual possui imports/estado correspondentes. A lista Sentry contém issues não resolvidos historicamente, o que não significa recorrência no release atual. O próximo corte deve filtrar ambiente e release e observar eventos novos após o Preview.

## Validação

`npm run verify`: estrutura, lint, 97 arquivos/585 testes, build e orçamento de bundle aprovados. A implementação desta triagem foi destinada exclusivamente ao Preview, preservando produção. A prévia precisa de teste manual com um formulário que possua opções de seleção; a classificação de rede precisa de evento novo para avaliação em Sentry.
