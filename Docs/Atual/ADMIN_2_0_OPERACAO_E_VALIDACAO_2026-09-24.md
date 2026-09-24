# Nello Admin 2.0 — operação e validação

## Acesso e autoridade

O painel é uma aplicação cliente: o caminho `/admin` não é segredo nem controle de segurança. Toda leitura administrativa passa por RPC autenticada, associação ativa em `private.admin_operators` e JWT de sessão `aal2` emitido pelo Supabase após TOTP. O campo `user_profiles.is_admin` permanece para compatibilidade visual de áreas antigas, mas não concede acesso à API administrativa. A tabela privada não tem acesso direto de `anon` ou `authenticated`.

Operadores preexistentes foram migrados como `owner` e precisam cadastrar/verificar TOTP no primeiro acesso. Em 24/09/2026 há dois operadores e nenhum fator MFA verificado. A conta legada `ana@hipozero.com` teve login recente; não alterar email ou revogar sem comprovação de posse e plano de recuperação. A troca do endereço de identidade requer validação da caixa de destino e atualização pelo fluxo de Auth.

## Concessão, revogação e recuperação

Concessões e revogações são operações de produção revisadas, executadas por migração SQL no Supabase; nunca por alteração de `is_admin` no cliente. Exigir identidade confirmada, motivo com pelo menos dez caracteres e registro da mudança. Para revogar, preencher `revoked_at=now()` na linha do operador; RPCs negam imediatamente mesmo com JWT AAL2 válido. Revogar sessões Auth globalmente quando houver suspeita de comprometimento. Se um operador perder TOTP, confirmar identidade por canal independente, remover o fator com procedimento administrativo do Supabase, preservar trilha do incidente e exigir novo cadastro no próximo acesso. Não desativar MFA como atalho.

O painel de Segurança mostra operadores, MFA verificado e consultas ao portão de acesso agregadas por hora nos últimos sete dias. Também mostra a migração da marca por contagens atuais de contas Auth legadas, arquivos públicos e conquistas exibidas; relatos históricos são apresentados separadamente e não reescritos. O log não contém IP, token, segredo TOTP ou dado clínico. Ele não cobre chamadas diretas negadas em outras RPCs; correlacionar com logs do Supabase/Sentry para incidentes. Limitar e alertar sobre abuso na camada de infraestrutura conforme volume real; não instalar honeypot que capture credenciais.

## Dados e privacidade

Dashboard usa `user_profiles`, `activity_log`, `meals`, `meal_plans`, `appointments` e `professional_verifications`. Pessoas excluem contas de simulação. Jornada mostra contagens dos últimos 30 dias por módulo, sem prontuário. O diretório de pessoas é paginado no servidor (20 por página), com busca limitada a 80 caracteres. Verificações e LGPD mantêm seus fluxos de revisão e trilhas existentes. Receita SaaS/MRR/churn não aparecem até existir fonte de cobrança reconciliada. Financeiro do consultório não é receita Nello.

## Gates por fase

1. **Fase 1:** migração `admin20_access_foundation`, Edge `sentry-proxy` e `create-patient`, testes do portão MFA; 654 testes, lint, build, auditoria sem vulnerabilidade alta; RPCs admin fechadas a `anon`; artefato novo confirmado em `nellonutri.com.br`.
2. **Fase 2:** migração `admin20_real_overview`; métricas verificadas contra SQL direto (25 nutricionistas, 57 pacientes no momento), séries reais; sem valores simulados; 654 testes, lint, build, auditoria sem vulnerabilidade alta; artefato novo confirmado no domínio.
3. **Fase 3:** migração `admin20_operations`; 82 pessoas retornadas em páginas de 20, nove fluxos; RPCs sem `EXECUTE` para `anon`; 654 testes, lint, build, auditoria sem vulnerabilidade alta; artefato novo confirmado no domínio.
4. **Fase 4:** migrações `admin20_security_audit` e `admin20_study_metrics_repair`, visão de operadores/MFA e este procedimento. A tela de incidentes passa a chamar a Edge Function por POST e deixa de mostrar saúde/latência fictícias; a área de estudo deixa de instruir uma instalação PostHog inexistente. A RPC de estudo foi corrigida após teste direto revelar uma tabela de respostas removida e passou a contar anamneses validadas (7 de 14 no teste de produção). O release passou em 111 arquivos de teste, 655 testes, lint, build, limite de bundle e auditoria de dependências sem vulnerabilidade alta. Todas as nove RPCs administrativas auditadas negam `EXECUTE` a `anon`. O deploy público final é conferido após o push.

## Pendências externas e limites

- Os dois operadores devem cadastrar TOTP. Sem isso o novo painel não libera acesso, por projeto.
- A conta `ana@hipozero.com` ainda é um login Auth ativo e recente. A aba Conta do nutricionista agora pode solicitar a troca de email via Auth; Supabase exige confirmação nas caixas antiga e nova. Em 24/09, o DNS de `nellonutri.com.br` não publicou MX, portanto a caixa Nello proposta precisa ser criada ou encaminhada e testada antes da troca. Migrar somente após comprovar que ambas recebem email ou executar recuperação administrativa da identidade. O perfil é sincronizado automaticamente quando Auth conclui a troca. Ver `Docs/Atual/MIGRACAO_DOMINIO_REAUDITORIA_2026-09-24.md`.
- Não há integração de cobrança SaaS validada; receita, assinaturas e churn seguem sem instrumentação.
- O acesso real de um operador no navegador e fluxos de TOTP precisam de teste com a própria conta, sem compartilhar código ou segredo.
- A integração Vercel conectada nesta sessão devolveu 403 para listar deployments; os gates foram verificados por hash de artefato e HTTP 200 no domínio público.
- A auditoria do Supabase ainda aponta cinco funções públicas de token de anamnese/documento executáveis por `anon`; elas pertencem a fluxos públicos separados e devem continuar sob revisão própria de expiração, escopo e abuso. As RPCs administrativas auditadas não concedem `EXECUTE` a `anon`.
