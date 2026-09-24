# Wave 2 — validação autenticada dos fluxos centrais

**Início:** 24/09/2026. **Estado:** inventário e testes de contrato iniciados; aceite ponta a ponta ainda aberto.

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
- Não foram criados usuários, convites ou dados clínicos nesta abertura. A wave permanece sem deploy funcional novo.

## Critérios de aceite pendentes

| Fluxo | Prova necessária |
| --- | --- |
| Convite | Dois tipos de convite, vínculo correto, recuperação de falha e entrega real do email. |
| Documentos | Upload e confirmação com hash do objeto, listagem com/sem episódio, bloqueio de outro tenant e ausência de 404 legítimo por 24 h. |
| Antropometria | Profissional grava apenas com episódio/vínculo válido; paciente grava auto relato separadamente; histórico paginado preserva registros. |

**Dependência operacional:** contas e caixas de QA sob controle da equipe. Até existirem, a matriz autenticada em navegador e o teste de entrega não podem ser atestados. Correções independentes de código podem avançar com testes locais sem usar dados clínicos reais.
