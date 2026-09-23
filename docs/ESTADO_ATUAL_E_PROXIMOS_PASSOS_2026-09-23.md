# Nello — estado atual e próximos passos após as ondas 17–20

**Data:** 23/09/2026. **Fase:** testes públicos com nutricionistas selecionados. O produto permanece sem paywall e com funções disponíveis durante esta fase, conforme decisão do proprietário. Este mapa substitui listas de “próximo passo” datadas de abril a agosto; os documentos originais continuam como histórico e especificações, não como prova de implantação atual.

## Como a pasta `docs` foi revisada

Inventário de **161 arquivos**: 155 Markdown e seis arquivos auxiliares. Foram varridos todos os caminhos, títulos, tamanhos e marcações de estado; a reconciliação detalhada concentrou-se nos guias centrais, auditorias recentes, gates de implementação, protocolos, Supabase e telemetria. A contagem de “concluído” em um documento antigo não foi adotada como evidência de funcionamento atual. Apenas cinco Markdown desta pasta já estavam versionados no Git; os demais estão ignorados localmente por `.git/info/exclude`. Este mapa é versionado explicitamente para não depender dessa configuração local.

| Família | Quantidade Markdown | Tratamento |
| --- | ---: | --- |
| Auditoria e segurança | 12 | Bug hunt mais recente e evidência de produção prevalecem; relatórios anteriores são hipóteses/checkpoints. |
| Histórico de ondas | 17 | Evidência histórica dos gates e triagem; não abre nova tarefa por si só. |
| Implementação | 53 | Mistura gates concluídos com ideias e sprints antigos; conferir código, banco e produto antes de executar. |
| Referências | 20 | Mapeamentos e conceitos, alguns ainda com marca HipoZero. |
| Resolvidos | 21 | Registro de correções antigas, sem garantia de ausência de regressão. |
| Arquitetura Supabase | 3 | Baselines de julho/agosto; grants e políticas atuais foram verificados no banco. |
| Planos e especificações `superpowers` | 23 | Desenhos e planos históricos, não representam status de release. |
| Guias e roteiros na raiz | 6 | Visão de produto, QA e roadmap; datas e status antigos exigem leitura contextual. |

## Estado comprovado

- **Ondas 1–20:** há histórico de implementação das 1–16 e evidência de código, banco e testes das 17–20 em `BUG_HUNT_ONDAS_17_20_2026-09-23.md`. A conclusão técnica de uma onda não substitui aceite clínico nem validação em aparelhos e contas reais.
- **Clínica:** as correções de Pollock, Harris, injúria, TACO/B12 e VENTA preservam versões e sinalizam revisão quando não é legítimo substituir ato clínico confirmado. Os cálculos Harris históricos IDs 20, 23 e 40 seguem aguardando novo registro autenticado do nutricionista, já orientado para mobilidade acamado. O caso VENTA histórico e plano ativo sinalizado exigem decisão do profissional. Diferenças residuais de micronutrientes P2/P3 requerem planilha alimento a alimento e confirmação da fonte. Seis perfis de pacientes sem vínculo/episódio ativo precisam de reconciliação pelo profissional, sem reabrir cuidado automaticamente.
- **Fluxos existentes:** prontuário longitudinal, anexos privados, check-ins, modelos de protocolos, plano alimentar, agenda e financeiro têm gates técnicos e correções recentes. O roteiro manual de QA por persona e uso em aparelhos reais continuam necessários para afirmar validação humana ponta a ponta.
- **Observabilidade:** Sentry, PostHog e Supabase foram consultados neste ciclo. No Sentry, os eventos recentes analisados pertencem a releases anteriores; issues abertas não significam falha recorrente na release atual. PostHog oferece LCP/INP por rota, dispositivo e release, mas a amostra por combinação ainda é insuficiente para atribuir melhora ou regressão. A instrumentação de duração e resultado das ações centrais aumentou na onda 20, sem conteúdo clínico.
- **Segurança:** o acesso anônimo indevido à RPC de alimento personalizado e à RPC administrativa de detalhe de nutricionista foi removido no banco. A segunda agora valida administrador no próprio contrato. Há políticas RLS deny by default e grants legados em helpers `private`; novos índices ou revogações em massa não devem ser feitos sem analisar chamadas de políticas, gatilhos e wrappers.

## Fila proposta após a onda 20

| Prioridade | Próximo trabalho | Responsável e dependência | Aceite verificável |
| --- | --- | --- | --- |
| P0 | Fechar revisão dos cálculos e planos históricos sinalizados | Nutricionista responsável, com sessão autenticada e insumos clínicos; engenharia prepara comparação e trilha | Novas versões assinadas pelo profissional, planos dependentes revisados, originais preservados. |
| P0 | Auditar wrappers administrativos e grants dos helpers `private` restantes | Engenharia/segurança; mapear ACL, chamada e função antes de revogar | Nenhuma RPC pública entrega dados administrativos a não administrador; testes de admin, profissional comum e visitante. |
| P1 | Medir comportamento real da release 20 em mobile | QA + engenharia; ao menos 30 eventos por rota/release/dispositivo | LCP p75 e INP p75 comparados a metas internas, com foco em login, energia, plano e antropometria; investigar regressão mensurada. |
| P1 | Testar exportação e ações centrais em sessão real | QA + nutricionista de teste; dados não clínicos de QA | PDF de agenda, financeiro, plano, antropometria e área do paciente abre e baixa; eventos de início e resultado correspondem à ação; falhas apresentam recuperação. |
| P1 | Revisar dependências externas de lançamento pago | Produto, jurídico, contábil e nutricionista | Política de CRN/estudante, retenção/LGPD, NFS-e, assinaturas e paywall aprovados antes de habilitar restrições. |
| P2 | Reavaliar propostas de IA, WhatsApp, CRM, marketplace e app nativo | Produto; após estabilização e pesquisa com testers | Escopo, custo, segurança clínica e critérios de aceite decididos; nenhum documento antigo é tratado como autorização implícita para implementar. |

## Divergências documentais que exigem contexto

- `NELLO_ROADMAP_LANCAMENTO.md` é um roadmap de julho para release candidate e ainda lista como futuras entregas módulos que receberam gates posteriores. Mantê-lo como histórico; usar os gates datados e o código atual para verificar estado.
- O cabeçalho de `GUIA_CORRECOES_POR_ONDAS_2026-09-22.md` registra “Preview apenas” para ondas 1–11. Isso descreve aquele checkpoint e não a política atual do proprietário, que passou a exigir deploy em produção.
- `README_ORGANIZACAO.md` (abril) indica `Implementacao/00-AGORA-P0-Templates-Nutricao` como primeira fila. As ondas posteriores e a biblioteca de protocolos mudaram essa prioridade; esses sprints requerem nova comparação com o código antes de abrir trabalho.
- Vários relatórios antigos usam HipoZero e descrevem bugs já reparados. Preservar a evidência histórica, mas não reproduzir a marca nem reaplicar migrações por causa de um status antigo.

**Fonte operacional para ondas 17–20:** `Auditoria_e_Seguranca/BUG_HUNT_ONDAS_17_20_2026-09-23.md`. **Fonte de visão do produto:** `NELLO_GUIA_MESTRE.md`, sujeita às decisões explícitas mais recentes do proprietário durante os testes públicos.
