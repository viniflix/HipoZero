# Wave 3 — matriz de acesso administrativo e revogação

**Data:** 24/09/2026. **Estado:** matriz do banco validada e portão da interface corrigido. O gateway administrativo e a sessão opaca descritos no plano de segurança continuam pendentes; esta entrega não declara esse isolamento implantado.

## Escopo executado

- Conferência no catálogo das RPCs administrativas: 16 operações usadas pelo painel, verificações e privacidade negam `EXECUTE` ao papel `anon`. As leituras protegidas verificam `private.is_admin()`; as três mutações de verificação chamam `private.require_verification_admin()`. A autoridade vem de `private.admin_operators` ativa e do AAL2 do JWT, não de `user_profiles.is_admin`.
- `wave3_admin_access_matrix.sql` executado no Supabase com duas identidades sintéticas e `ROLLBACK`: não membro com `is_admin=true` foi negado; operador cadastrado com `is_admin=false` foi negado em AAL1 e autorizado em AAL2; após preencher `revoked_at`, o mesmo contexto AAL2 foi negado na próxima RPC. O teste inclui `admin_access_status`, `check_is_admin`, `admin_list_people` e grants anônimos. Nenhum usuário ou evento de QA foi mantido.
- O portão do React passou a revalidar ao retornar à aba, ao focar a janela e, enquanto autorizado, a cada 30 segundos. Usa `check_is_admin` para a verificação recorrente sem inflar o contador de tentativas e consulta o status detalhado se perder autorização. Falha de rede fecha o painel. Respostas atrasadas não podem reabrir o painel depois de outra verificação ou troca de conta.
- A rota legada `/nutritionist/foods` agora passa por `AdminAccessGate`. O antigo bloqueio local por `is_admin` foi removido; ele podia negar um operador legítimo sem proteger as operações diretas. As políticas de escrita de medidas de referência continuam exigindo `private.is_admin()` no banco.
- O redirecionamento após login preserva o destino `/admin` para qualquer usuário autenticado e entrega a decisão ao portão do servidor. Isso permite operador legítimo sem flag visual e continua negando não membros.

## Validação e limite da garantia

Os testes locais do portão cobrem MFA, flag visual falsa, operador sem flag, revogação ao retornar à aba, revalidação sem novo evento de login, troca de conta e indisponibilidade. A matriz SQL prova decisões reais do banco com papéis e claims sintéticos; não representa um login de operador com TOTP em navegador nem um ataque via token assinado externamente. As chamadas administrativas continuam acessíveis diretamente no Supabase para um operador com JWT AAL2 válido. Revogar `admin_operators` bloqueia a próxima RPC; o conteúdo já visto na tela pode permanecer até foco/revalidação (máximo nominal de 30 segundos com aba ativa).

`npm run verify:release` passou após as alterações finais: 114 arquivos, 682 testes, lint, build, orçamento de bundle e auditoria sem vulnerabilidade alta.

## Pendências para encerrar a arquitetura de segurança proposta

1. Implantar gateway de mesma origem, sessão administrativa opaca com revogação e proteção CSRF; migrar consumidores e retirar os grants administrativos diretos somente após teste de todos os fluxos. A SPA atual usa RPCs diretas; trocar grants antes do gateway interromperia o painel. Não foi implantado um proxy superficial que continuaria aceitando o mesmo JWT roubado.
2. Definir e impor privilégios por papel/ação e escopo de suporte por caso. Hoje a associação ativa + AAL2 concede o conjunto atual de RPCs a todos os operadores, embora a tabela tenha uma coluna `role`.
3. Criar canal confiável para negativas fora de transações abortadas, trilha de ações críticas, alertas e teste de falha do canal. O log de `admin_access_status` cobre o portão, não todas as chamadas diretas negadas.
4. Testar com operadores reais o TOTP, F5, revogação em uma sessão aberta e recuperação por canal independente. A migração da conta Auth de Ana e a entrega real de email continuam condicionadas ao recebimento confirmado.
5. Exercitar aliases/previews, Storage/Realtime e chamadas HTTP diretas à API em staging com dois tenants. A validação SQL desta wave não prova isolamento de todos esses caminhos.

**Critério de continuidade:** não anunciar que o gateway ou o painel separado estão protegendo produção até retirar e testar cada caminho direto. Manter as guardas existentes de associação privada e AAL2 durante a transição.
