# Auditoria de desempenho e update de otimização — 23/09/2026

## Escopo e fontes

Revisão das rotas de autenticação, dashboard, Protocolos, hub do paciente, plano alimentar, energia e financeiro. Foram cruzados spans e issues do Sentry, eventos de Web Vitals e ações do PostHog, estatísticas acumuladas do PostgreSQL/Supabase e o código da release `be2c5605`. O Sentry foi consultado pelo MCP disponível nesta sessão; o conector MCP do PostHog não estava disponível, então o PostHog foi consultado pela API de leitura já configurada no projeto. Nenhuma credencial nem dado clínico foi incluído aqui.

Médias de navegação do Sentry, percentis de Web Vitals do PostHog e tempos de SQL são métricas diferentes e não devem ser comparadas diretamente. A maioria das amostras do PostHog pertence a releases anteriores e é pequena; estes valores orientam a investigação, mas não demonstram regressão da release atual.

## Achados medidos

| Área | Evidência | Interpretação |
| --- | --- | --- |
| Protocolos | Sentry, 7 dias: navegação média ~1.008 ms, 50 spans. | Rota prioritária; o hook de dietas era disparado mesmo em outras seções. |
| Hub do paciente | Sentry, 7 dias: rotas observadas ~1.007 ms (10 spans) e ~720 ms (50 spans). | Atividades consultavam sete fontes de dados em sequência; resumo aguardava contexto e depois responsáveis legais. |
| Dashboard | Sentry, 7 dias: navegação média ~263 ms, 1.330 spans. `pg_stat_statements`: ~178.531 updates e ~181.717 selects de `feed_tasks` acumulados. | Latência de navegação razoável, mas o feed produzia leitura e escrita repetida por cartão a cada atualização. Contagens SQL são acumuladas, não dos últimos sete dias. |
| Login mobile | PostHog: LCP p75 ~10.988 ms, n=10, release antiga `c53b5846`. Sentry: imagem remota do logo, n=90, duração média ~301 ms. | Sinal para reduzir o logo e a dependência de Storage no caminho de entrada; amostra insuficiente para atribuir todo o LCP ao logo. |
| Energia | PostHog: INP p75 ~528 ms, n=23, desktop, release antiga `a001a1b3`. | Exige amostra da release atual antes de alterar cálculo clínico ou interface. |
| Plano alimentar | Apenas quatro eventos `data_load_timing` em sete dias, todos de release anterior; dois `meal_plan_open` ~70,5 ms e duas buscas ~470 ms de mediana. | Telemetria insuficiente para identificar gargalo com confiança. |
| Outros | Sentry: financeiro ~527 ms (20 spans), hub geral ~347 ms (220), login ~221 ms (960), page load ~1.738 ms (130). | Monitorar por release e dispositivo; não há evidência para otimizar consultas clínicas indiscriminadamente. |

Os seis issues de produção ainda abertos no Sentry tinham últimos eventos em releases anteriores no momento da consulta. Permanecem em monitoramento; um issue aberto não prova recorrência atual, e ausência recente não o resolve automaticamente.

## Alterações deste update

1. **Feed do dashboard:** compara o snapshot atual com o registro carregado. Quando conteúdo, prioridade, estado e destino estão iguais e o item foi visto há menos de 15 minutos, reutiliza o registro; mudanças e itens mais antigos continuam no fluxo de persistência e auditoria. Leituras e updates por cartão são evitados no caso comum. Pagamentos pendentes e alertas laboratoriais agora começam juntos após carregar a lista de pacientes. Incluído `data_load_timing` para `dashboard_feed`.
2. **Hub do paciente:** as sete fontes independentes de atividade são iniciadas juntas. Contexto operacional e responsáveis legais são lidos em paralelo depois de conhecido o episódio. A autorização do resumo continua precedendo a leitura de atividades. Incluídos tempos `patient_hub_summary` e `patient_hub_activities`, sem identificador ou conteúdo clínico.
3. **Protocolos:** a consulta de modelos de dieta só é ativada quando a seção de nutrição está visível; as demais seções conservam suas consultas próprias.
4. **Autenticação e cabeçalho:** o logo público foi servido localmente em PNG de 400 × 162, 49.303 bytes, contra 609.337 bytes da imagem original (~92% menos bytes). Dimensões explícitas evitam reserva incerta de espaço. O PDF continua com seu caminho de exportação existente.

As otimizações não mudam fórmulas, permissões, conteúdo de planos, estados de check-in nem contratos de gravação clínica.

## Validação e limites

- `npm run verify:release`: 105 arquivos de teste e 619 testes passaram; build e orçamento de bundle passaram; `npm audit --omit=dev --audit-level=high` encontrou zero vulnerabilidades. ESLint teve zero erros e um aviso já existente em teste de auth.
- Testes específicos verificam que fontes independentes de atividade iniciam em paralelo, tarefa de feed inalterada não grava no banco e Protocolos não consulta dietas enquanto outra seção está ativa.
- Esta validação cobre o código, não o tempo real em todos os aparelhos e redes. Comparar por **release + rota + dispositivo** após tráfego suficiente; meta de coleta: pelo menos 30 eventos por combinação antes de concluir melhora de LCP/INP. Comparar p75 de LCP/INP e tempo de `dashboard_feed`, `patient_hub_summary`, `patient_hub_activities`; verificar no banco a redução da taxa de updates de `feed_tasks` normalizada por sessão.
- Se houver aumento de erros ou divergência de feed, reverter o commit deste update e investigar a combinação de status, prioridade e metadata; o modelo de dados permaneceu intacto.

## Próximos gargalos sob observação

O bundle inicial ainda contém um chunk de cerca de 1,07 MB bruto; PDF e conteúdo clínico têm chunks próprios grandes. A redução segura desse custo requer perfil de importação e tráfego real por rota antes de modificar divisão de módulos. O `last_seen_at` de perfis também acumula muitas gravações, mas pode sustentar presença e segurança; requer auditoria de consumidor e contrato antes de limitar frequência. Confirmar manualmente fluxos de login, dashboard, Protocolos, hub do paciente e exportação em contas de QA, incluindo celular.
