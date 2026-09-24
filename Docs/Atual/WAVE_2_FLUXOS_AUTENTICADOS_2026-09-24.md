# Wave 2 — validação autenticada dos fluxos centrais

**Início:** 24/09/2026. **Estado:** correções de banco e testes transacionais concluídos; aceite ponta a ponta ainda aberto por falta de caixas/contas de QA acessíveis.

## Escopo e sequência

1. Criar identidades sintéticas isoladas de nutricionista e paciente, com email realmente acessível, sem reutilizar prontuários de clientes. Confirmar autenticação e vínculo em duas contas/tenants.
2. Exercitar convite digital e offline, confirmação de email, resgate, login e recuperação da falha intermediária após envio.
3. Exercitar documentos com e sem episódio, upload privado, confirmação do hash, consulta pelo paciente/profissional e negação entre tenants.
4. Exercitar antropometria clínica por profissional em episódio ativo e encerrado, e auto relato do paciente; conferir que o auto relato não vira avaliação clínica confirmada.
5. Registrar navegador, dispositivo, release, resposta visível e persistência no banco. Corrigir falhas reproduzidas, rodar gate de release e publicar antes de declarar a wave encerrada.

## Linha de base verificada

- A suíte direcionada passou: 4 arquivos, 34 testes de contratos de Auth, documentos, anexos e progresso do paciente.
- No banco de produção, `user_profiles` tinha 26 nutricionistas e 57 pacientes, mas **zero perfis `is_simulation=true`**. Não há contas de QA identificadas por esse marcador.
- `document_asset_uploads` e `patient_progress_measurements` tinham zero linhas no momento da consulta. Não é possível inferir sucesso dos fluxos autenticados apenas pelos testes com mocks.
- Na abertura não foram criados usuários, convites ou dados clínicos persistentes.

## Execução da Wave 2

| Área | Achado e correção | Evidência |
| --- | --- | --- |
| Antropometria | As políticas permissivas de `growth_records` deixavam o paciente gravar a tabela clínica diretamente. Uma política restritiva passou a exigir nutricionista responsável e episódio ativo para inserir. A atualização exige o profissional do episódio ou, para linha legada sem episódio, o nutricionista vinculado ao perfil ativo. Auto relato continua em `patient_progress_measurements`. | `wave2_growth_records_rls.sql` passou com paciente negado em INSERT/UPDATE clínicos, outro tenant sem leitura, profissional aceito em episódio ativo, INSERT negado em episódio encerrado e auto relato aceito. Transação revertida. |
| Convite digital | Vínculo pendente criado somente para código válido; código inválido não gera vínculo. | `wave2_invite_redeem.sql` passou em produção com identidades sintéticas dentro de transação revertida. |
| Convite offline | A função antiga devolvia sucesso depois de apagar em cascata o vínculo com o nutricionista. O teste reproduziu `QA_OFFLINE_INVITE_LINK_MISSING`. A função agora mantém o perfil Auth vazio, transfere dependências clínicas por FK enquanto ambos os perfis existem, remove o perfil offline e ativa o vínculo em uma subtransação. Contas Auth que já têm vínculo ou dados não são fundidas automaticamente. | Teste de regressão passou com vínculo, episódio e antropometria preservados; perfil offline removido; tentativa de fundir conta com vínculo preexistente negada sem perder dados. Transação revertida. |
| Documentos | ACL da RPC de listagem foi conferida: execução apenas por `authenticated`/`service_role`; leitura condicionada ao profissional envolvido ou ao paciente em documento assinado e compartilhado. Confirmação de upload pelo cliente está revogada e delegada ao serviço confiável. | No período de 24 h consultado, houve 38 respostas 404 e 2 respostas 502 para `list_document_artifacts`, todas com papel `anon` e agente `node`; nenhuma comprova falha de uma sessão autenticada. As tabelas de artefatos e uploads estavam vazias, portanto upload/listagem reais seguem sem teste. |

As migrações `20260924233000_growth_records_clinical_write_guard.sql`, `20260924234500_preserve_offline_invite_links.sql` e `20260924235500_reconcile_offline_invite_dependents.sql` foram aplicadas ao Supabase de produção nesta ordem. A segunda registra a correção básica do vínculo; a terceira cobre os perfis offline reais que já têm episódios. Não houve alteração de registros históricos. O gate local `npm run verify:release` passou: 114 arquivos, 677 testes, lint, build, orçamento do bundle e auditoria sem vulnerabilidades de alta gravidade.

## Critérios de aceite pendentes

| Fluxo | Prova necessária |
| --- | --- |
| Convite | Dois tipos de convite, vínculo correto, recuperação de falha e entrega real do email. |
| Documentos | Upload e confirmação com hash do objeto, listagem com/sem episódio, bloqueio de outro tenant e ausência de 404 legítimo por 24 h. |
| Antropometria | Profissional grava apenas com episódio/vínculo válido; paciente grava auto relato separadamente; histórico paginado preserva registros. |

**Dependência operacional para aceite final:** contas e caixas de QA sob controle da equipe. Até existirem, não se pode atestar entrega de email, upload privado real, renderização em navegador/dispositivo, recuperação após falha intermediária nem ausência de 404 legítimo por 24 horas de tráfego autenticado. A execução SQL sintética valida regras do banco, mas não substitui esses passos. Nenhum usuário `wave2-*@example.invalid` ou prontuário sintético foi mantido.
