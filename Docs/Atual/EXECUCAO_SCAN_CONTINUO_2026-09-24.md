# Execução do scan contínuo — 24/09/2026

Fonte: `../Auditoria_e_Seguranca/SCAN_CONTINUO_PLATAFORMA_2026-09-24.md`. Este registro distingue alteração implantada de aceite completo. O proprietário decidiu manter a senha inicial simples nos convites; **SC26-01 não foi alterado**.

| Achado | Estado em 24/09/2026 | Evidência e próximo gate |
| --- | --- | --- |
| SC26-02, proxy de alimentos | Mitigação publicada | Edge v19 com JWT, validação, timeout de 5 s por fornecedor, token/resultados em cache e cota de 60 buscas externas novas por usuário/minuto. Migrações `food_proxy_quota` e `food_proxy_quota_adjustment`; chamada anônima recebeu 401. Falta busca funcional com profissional de QA e medição de 429 legítimos. |
| SC26-03, documentos | Contrato corrigido e publicado | RPC aceita episódio opcional sem ampliar permissões; frontend envia `null` e mostra erro. Logs de 404 amostrados tinham corpo `{}`, agente `node`, papel `anon` e código `PGRST202`, compatíveis com sondagem sem argumentos. Não atribuir os 55 erros às telas sem correlação. Falta smoke autenticado por paciente/profissional e janela de 24 h sem erro legítimo. |
| SC26-04, criação de paciente | Integridade reforçada e publicada | Criação offline agora é transação SQL com chave idempotente. Convite digital não responde 200 após falha na senha; tenta remover a conta convidada e retorna estado de recuperação se compensação falhar. A senha simples foi preservada. Falta teste ponta a ponta com duas contas sintéticas e revisão do caso de email entregue antes de falha de senha. |
| SC26-05, modelos | Corrigido e publicado | Prévia converte opções legadas inválidas em texto seguro; validação impede novos objetos aninhados. Testes com string e objeto inválido passaram. Acompanhar Sentry na release nova. |
| SC26-06, feed | Otimização publicada | Tarefas idênticas deixam de ser regravadas a cada 15 min; estado já lido elimina GET por item; sincronização usa lotes de quatro e guarda por `updated_at`. Falta medir chamadas por sessão e P95 após janela representativa; RPC em lote permanece uma evolução se o tráfego ainda for alto. |
| SC26-07, autosave | Perda no debounce corrigida e publicada | Última alteração é enviada ao desmontar; gravações são seriadas; aplicar/salvar espera flush; indicador mostra salvamento em curso. `useShadowDraft` já mantém cópia recuperável e revisão para conflito entre abas. Falta exercício real com duas abas, rede interrompida e navegação rápida. |
| SC26-08, banco | Parcial | Quatro políticas `editor_shadow_drafts` usam `(select auth.uid())`; advisor deixou de listar `auth_rls_initplan`. Permanecem 55 FKs sem índice de cobertura, 88 índices sem uso observado e revisão por função dos grants `SECURITY DEFINER`. Não adicionar índices nem revogar helpers `private` sem plano de consulta/dependências. |
| SC26-09, reenvio | Corrigido e publicado | 429 mostra espera, usa `Retry-After` quando presente, guarda cooldown na sessão após F5 e segue sem alerta operacional para rejeição esperada. Testes do contrato passaram; falta observar novos envios reais. |
| SC26-10, antropometria | Fluxo de auto relato corrigido; causa dos 403 clínicos ainda não provada | Paciente grava peso/altura em tabela própria, sem promover a avaliação clínica; equipe ativa pode ler. Políticas preexistentes de `growth_records` foram conferidas; duas políticas redundantes criadas durante a investigação foram removidas na migração imediatamente seguinte. Erros 42501 agora explicam vínculo/autorização e P0001 passa pela tradução de erro. As issues Sentry 32/33 tiveram uma ocorrência cada em release antiga `963ffd79`, em 23/09. Falta reprodução autenticada de profissional em episódio ativo/encerrado. |
| SC26-11, monitor legado | Corrigido | Monitor Sentry `6935051` do domínio antigo removido; monitor `10435462` para `https://nellonutri.com.br/login` ativo e OK. |
| SC26-12, histórico do paciente | Otimização publicada | Colunas explícitas e páginas de 100 registros para avaliações, auto relatos e glicemia; botão carrega histórico anterior. Falta QA com mais de mil linhas e medir payload/P75 em celular. |

## Gate técnico executado

- `npm run verify:release` passou após as mudanças de feed e novamente após progresso: 113 arquivos de teste, 671 testes, lint, build, orçamento de bundle e audit de produção sem vulnerabilidade alta.
- O bundle público de produção foi conferido para `PatientProgressPage` com `patient_progress_measurements` e paginação, para `ConfirmSignupPage` com cooldown persistido, e para modelos/autosave após seus pushes.
- Migrações e funções Edge foram conferidas no catálogo do Supabase; as políticas originais de `growth_records` permanecem ativas.
- O monitor Sentry atual foi relido e está ativo/OK. A confirmação de HTTP 200 e de bundle **não** substitui QA autenticado.
- Wrappers públicos `admin_*` e `get_nutritionist_detail` foram inspecionados: acesso anônimo revogado e guarda `private.is_admin()` presente; a guarda exige operador ativo em `private.admin_operators` e JWT AAL2. Isso não encerra a auditoria das demais funções privilegiadas.

## Outras pendências atuais em `Docs/Atual`

1. `ADMIN_SEGURANCA_UPDATE_PLANO_2026-09-24.md` é proposta para atualização adicional do admin, não implementação comprovada. Priorizar auditoria de grants/helpers `private`, wrapper por ação, sessão administrativa independente e trilha confiável. Exige projeto e gates próprios, inclusive recuperação de MFA.
2. `ESTADO_ATUAL_E_PROXIMOS_PASSOS_2026-09-23.md` e `PLANO_EVOLUCAO_2026-09-23.md`: revisão/assinatura pelo nutricionista dos registros Harris 20/23/40, VENTA, plano sinalizado, seis perfis sem episódio e diferenças de micronutrientes. Engenharia não deve assinar ou alterar silenciosamente versões clínicas.
3. `INCIDENTE_MFA_E_EMAIL_RECEBIMENTO_2026-09-24.md` e `MIGRACAO_DOMINIO_REAUDITORIA_2026-09-24.md`: provar recebimento real de `ana@nellonutri.com.br` e `suporte@nellonutri.com.br`, recuperação da conta Ana e configuração externa de Auth/Resend. Não trocar email de conta administrativa antes de confirmar caixa e canal independente.
4. QA móvel e de exportações com contas sintéticas, amostras por release e dispositivo, Web Vitals e entrega de email ainda precisam de execução humana/operacional. Planos históricos de IA, WhatsApp, CRM, marketplace e paywall não são autorização automática para implantar funcionalidades durante o beta gratuito.

## Próximo ciclo de validação

Executar matriz de duas identidades de QA em staging ou produção controlada: convite offline/digital, documentos por paciente/episódio, antropometria em episódio ativo e encerrado, plano em duas abas e rede interrompida, histórico acima de mil registros. Comparar logs de `feed_tasks`, RPC documental e 429 do proxy por release após 24 horas. Para o banco, revisar `SECURITY DEFINER` por função e usar `EXPLAIN`/cardinalidade antes de cada índice. O advisor `auth_leaked_password_protection` permanece fora do escopo por decisão explícita e dependência do plano pago.
