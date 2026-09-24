# Wave 4 — banco e legado operacional

**Data:** 24/09/2026. **Ambiente:** projeto Supabase de produção conectado ao MCP. Esta onda cobre revisão dirigida de funções e grants, planos de consulta e preparação da reconciliação. As contagens são fotografias do momento da consulta, não decisões clínicas ou contábeis.

## Correções publicadas no banco

1. `submit_anamnesis_by_token` falhava quando o formulário público tinha campo com `clinical_flag_key`: a função atualizava `user_profiles.updated_at`, coluna inexistente. A migração `20260925001500_fix_anamnesis_token_clinical_flags.sql` remove só essa atribuição. Token, consentimento, salvamento de sinalizador e notificações foram preservados. O teste `wave4_anamnesis_token.sql` reproduziu `42703` antes da migração e passou depois, sob `anon`, com transação revertida. Verifica consentimento obrigatório, gravação, invalidação do token e recusa de replay. Não sobraram usuários sintéticos.
2. Duas assinaturas legadas de RPC recebiam UUID para entidades hoje identificadas por `bigint`: `get_meal_plan_with_foods_optimized(uuid)` e `transition_appointment_status(uuid,text,text)`. A revisão do cliente não encontrou chamadas atuais; wrappers `public` e implementações `private` perderam `EXECUTE` para `PUBLIC`, `anon` e `authenticated`. Foram preservadas para evitar alteração de dependências internas sem inventário completo.
3. `get_financial_summary(date,date)`, a transição atual de consulta e as funções internas de ativação de plano exigem ator autenticado. Grants anônimos excedentes foram revogados nas assinaturas verificadas, mantendo `authenticated` onde o fluxo depende delas. `wave4_rpc_grants.sql` impede regressão dessas ACLs.

## Revisão de segurança e acesso

O catálogo tinha 265 funções `SECURITY DEFINER` em `public`/`private` (126/139). Cinco em `public` podiam ser executadas por `anon`: as quatro funções de anamnese por token (`get`, `submit`, `attach`, `detach`) e a verificação pública de autenticidade documental. Seus contratos foram lidos: token vigente, escopo de objeto/estado ou limite de tentativa protegem os acessos; `submit` recebeu a correção acima. A presença de `SECURITY DEFINER` em `private` não torna a função automaticamente uma rota REST, mas privilégios diretos excessivos são dívida de menor privilégio. As ACLs de finanças, agenda, ativação de plano, rotas antigas e admin foram verificadas individualmente nesta onda. Não se afirma auditoria manual completa das outras funções.

As tabelas `appointments`, `financial_transactions`, `care_episodes` e `user_profiles` têm RLS ativo. Políticas de agenda exigem participação/vínculo; financeiro limita a `nutritionist_id = auth_uid()`; episódios permitem apenas paciente ou nutricionista do episódio; perfil é próprio ou de paciente vinculado. A RPC destrutiva `force_delete_test_clone(uuid)` continua sem `SECURITY DEFINER` e sem `EXECUTE` para `anon`/`authenticated`. A suíte de isolamento autenticado da wave 2 segue como evidência complementar. Revisar as demais funções `private` e as 21 tabelas sem políticas apontadas pelo advisor antes de ampliar superfície de API.

## Índices e planos

Os advisors apontaram 55 FKs sem índice dedicado e 88 índices sem uso observado. Nenhuma recomendação foi aplicada em massa. As tabelas amostradas são pequenas: `appointments` 40 linhas estimadas, `financial_transactions` 14, `care_episodes` 49, `anamnesis_records` 14. `EXPLAIN (FORMAT JSON)` para busca de lançamento por profissional/paciente/data escolheu `idx_financial_transactions_nutritionist_id` (custo 1,26); para consulta por profissional/paciente/janela de data escolheu `idx_appointments_nutritionist_id` (custo 1,27). A ausência de uso em um índice pode refletir pouco tráfego ou dados recentes; o índice único parcial de `appointment_id` é necessário para integridade mesmo com `idx_scan=0`. Não se criou nem removeu índice sem plano e carga representativos. Na próxima revisão: colher consulta real e latência, `EXPLAIN (ANALYZE, BUFFERS)` em cenário seguro, impacto de escrita, decisão por índice individual.

## Reconciliação sem alteração automática

Há 40 consultas legadas sem ligação financeira e 14 lançamentos antigos pagos sem `appointment_id` (9 receitas, 5 despesas). Uma correspondência estrita por profissional, paciente e dia da transação encontrou, nas receitas, 7 sem candidato, 1 candidato único e 1 ambíguo. Mesmo a correspondência única não comprova causalidade ou valor. O responsável deve comparar comprovante, serviço, valor, data, paciente e eventuais remarcações antes de registrar uma ligação. Não foram alterados pagamentos, saldos ou prescrições.

Existe 1 perfil com marcador textual legado `DUPLICATA DE TESTE`. Essa marca é editável e não autoriza exclusão. `is_simulation=true` não marcou nenhum paciente na fotografia atual. O responsável deve confirmar origem, proprietário e ausência de prontuário/uso real antes de decidir retenção; a exclusão forçada permanece desativada.

O inventário anterior citava 6 perfis sem episódio ativo. O recorte **atual** de pacientes com vínculo ativo em `nutritionist_patients` e sem episódio ativo retornou 0; o recorte amplo de todos os perfis `patient` retornou 28, incluindo não vinculados e históricos. O número 6 deve ser reconciliado com o filtro e a data da auditoria original antes de concluir que os casos foram resolvidos. Nenhum episódio foi aberto automaticamente.

## Fila clínica para decisão do nutricionista

| Caso | Material para revisão | Ação permitida |
| --- | --- | --- |
| Harris 20/23/40 | TMB e GET legados, mobilidade acamado confirmada, insumos originais e versões posteriores | Nutricionista autenticado registra e assina nova versão se confirmar o cálculo; preservar original. |
| VENTA e plano sinalizado | Meta, prazo, déficit, prescrição ativa e alertas clínicos | Nutricionista decide ajuste ou justificativa, sem recalcular silenciosamente. |
| Micronutrientes P2/P3 | Alimento/versão, quantidade, unidade, fonte e cobertura de dados por nutriente | Conferir com planilha e fonte alimentar antes de alterar prescrição. |
| Perfis sem episódio | Filtro original dos seis casos e situação atual de vínculo/episódio | Revisão individual; não reabrir cuidado por inferência. |

## Critério de saída e pendências

As três migrações SQL foram aplicadas no banco de produção. `wave4_anamnesis_token.sql` e `wave4_rpc_grants.sql` passaram. `npm run verify:release` passou: 114 arquivos/682 testes, lint, build, orçamento de bundle e `npm audit --omit=dev --audit-level=high` com zero vulnerabilidades. O commit e o status do deploy frontend serão registrados na conclusão da onda. Pendem decisões humanas sobre 14 lançamentos pagos, o perfil marcado e as versões clínicas. Também pendem a auditoria completa das 265 funções, medições de consultas sob carga real e a reconciliação do recorte de seis perfis. Esses itens não devem ser rotulados como corrigidos por uma mudança de ACL ou por uma contagem agregada.
