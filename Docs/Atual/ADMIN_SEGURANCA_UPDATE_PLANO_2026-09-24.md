# Nello — plano de atualização da segurança administrativa

**Data:** 24/09/2026

**Status:** proposta para implementação futura. Esta entrega altera somente documentação.
**Objetivo:** reduzir exposição, limitar privilégios e tornar verificáveis a autorização, a revogação e a recuperação do acesso administrativo dentro das capacidades gratuitas disponíveis. Não existe garantia de invulnerabilidade; o sucesso será medido por controles comprovados e riscos residuais explícitos.

## 1. Escopo e regra de evidência

Base: pesquisa anexada pelo responsável pelo Nello, contexto das entregas anteriores e documentos `ADMIN_2_0_PLANO_2026-09-24.md`, `ADMIN_2_0_OPERACAO_E_VALIDACAO_2026-09-24.md` e `INCIDENTE_MFA_E_EMAIL_RECEBIMENTO_2026-09-24.md`, nesta pasta.

**Não foi feita nova inspeção da implementação nesta etapa, conforme solicitado.** As descrições de estado são registros históricos, não atestados atuais de produção. A fase 1 deverá confrontá-las com código, migrations, catálogo e configurações implantadas. Auditorias antigas não devem ser reapresentadas como falhas atuais sem reprodução.

Estados de acompanhamento: **documentado anteriormente**, **proposto**, **confirmado por evidência**, **divergente**, **bloqueado por dependência**. Confirmar um controle exige ambiente, data, commit/configuração e teste reproduzível. Tela oculta, HTTP 200 e build aprovado não provam autorização segura.

Escopo: frontend admin, API, Auth/Postgres/Storage/Realtime, Cloudflare/Vercel, identidades, recuperação, auditoria e cadeia de entrega. Não autoriza acesso indiscriminado a prontuários nem mudanças nos portais clínicos sem análise de impacto.

## 2. Adaptação da pesquisa ao projeto

| Proposta original | Decisão para o Nello |
|---|---|
| Middleware/Server Actions de Next.js | O contexto é React/Vite na Vercel. Usar endpoints de servidor e proteção de origem compatíveis; não migrar de framework apenas para criar o portão. |
| URL e anon key permitem manipular tudo | São informações públicas por projeto. A proteção depende de grants, RLS, funções e autorização corretas; esconder a chave pública não é controle suficiente. |
| RLS em todas as tabelas sem exceção | Exigir RLS e grants mínimos nas tabelas expostas. Schemas privados precisam de isolamento próprio; não alterar indiscriminadamente tabelas internas gerenciadas pelo Supabase. |
| Política `false` significa negação total | Uma política permissiva falsa não cancela outra permissiva verdadeira. Revisar composição, papéis, `USING`, `WITH CHECK`, proprietários e caminhos que ignoram RLS. |
| Allowlist de IPs da Vercel | Restrição de rede do Supabase protege Postgres/pooler, não APIs HTTPS Auth/REST/Storage. Verificar egress fixo, IPv4/IPv6, plano e recuperação; não presumir IP estático em funções serverless. |
| Sempre SECURITY INVOKER | Preferir quando suficiente. Definer exige necessidade demonstrada, proprietário restrito, nomes qualificados, search_path seguro, parâmetros validados e grants explícitos. |
| Esconder `/admin` | Pode reduzir descoberta casual. DNS, certificados, bundles e histórico revelam endereços; autorização deve resistir à URL conhecida. |
| JWT curto resolve sequestro de sessão | Access token curto não encerra sessão renovável. Exigir sessão administrativa revogável no servidor e autenticação recente para ações críticas. |
| Bloquear países/Tor | Usar como sinais complementares de risco, sem substituir identidade ou excluir operadores legítimos indiscriminadamente. |
| Log com INSERT liberado é imutável | Clientes podem forjar eventos. Escrita deve ser confiável; resistência ao proprietário do banco exige arquivo externo com retenção protegida. |
| Sanitizar só ao salvar | Sanitizar no contexto de renderização, incluindo conteúdo histórico, HTML de emails e anexos. React não protege sinks HTML inseguros automaticamente. |

Fontes: [restrições de rede Supabase](https://supabase.com/docs/guides/platform/network-restrictions) e [proteção da origem Cloudflare](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/).

## 3. Estado documentado e conferência futura

| Controle | Registro anterior, ainda não revalidado | Evidência exigida na fase 1 |
|---|---|---|
| Autoridade administrativa | `private.admin_operators`; perfil `is_admin` apenas para compatibilidade visual | Nenhuma política, função, Edge Function ou job concede privilégio por dado editável do perfil. |
| MFA | AAL2 exigido no gate e nas funções administrativas | Chamadas diretas AAL1 negadas em todos os endpoints. |
| RPCs | Nove funções administrativas auditadas sem EXECUTE para anon | Inventário completo, incluindo novas funções, overloads e default privileges. |
| Cadastro TOTP | QR e conflito após F5 corrigidos | Teste real de navegador, concorrência, falha de rede e preservação do fator confirmado. |
| Revogação | Associação com `revoked_at` | JWT ainda válido deixa de autorizar após revogação; medir caches e conexões persistentes. |
| Auditoria | Gate registra acessos; negações diretas têm cobertura limitada | Mapear lacunas e demonstrar persistência de eventos em transações abortadas. |
| Operadores | Duas contas foram descritas como owner em perfis clínicos | Justificar cada concessão e planejar contas administrativas dedicadas. |
| Email de recuperação | Migração de Ana pendente; MX Resend configurado, entrega não comprovada no último registro | Validar entrega, acesso restrito à caixa e canal independente antes da migração. |
| Perímetro/sessão | Cloudflare e Vercel presentes; gateway dedicado não comprovado | Levantar hosts, aliases, previews, APIs diretas, cookies, tokens e capacidades dos planos. |

## 4. Modelo de ameaça

Ativos: autoridade administrativa, dados clínicos/identificáveis, regras financeiras, sessões, segredos de infraestrutura, evidências e disponibilidade. Adversários: visitante anônimo; paciente/nutricionista malicioso; conta clínica comprometida; operador com excesso de privilégio; sessão roubada; dependência maliciosa; invasor das contas dos provedores.

| Cenário | Defesa e prova esperadas |
|---|---|
| Descobrir URL e chamar APIs sem UI | Autorização no servidor e ausência de caminho privilegiado alternativo. |
| Forjar `is_admin`, UUID, role ou cabeçalho | Autoridade obtida de fonte canônica confiável, não do navegador. |
| Roubar JWT AAL1/AAL2 e chamar RPC antiga | Gateway obrigatório, retirada de grants diretos administrativos e sessão revogável. |
| Usar domínio Vercel, preview ou deploy antigo | Mesma proteção da origem; previews sem dados/segredos de produção. |
| Phishing de senha e TOTP em tempo real | Passkey/chave física no provedor do perímetro quando viável; TOTP não é resistente a phishing. |
| XSS em relato, mensagem, nome ou email | Conteúdo inerte, sanitização contextual, CSP e isolamento de arquivos. |
| SQL injection em filtro/ordenação | Parametrização, allowlist de identificadores e limite de custo. |
| Trocar paciente/caso/tenant | Autorização por objeto, finalidade e vínculo, inclusive para operadores. |
| Repetir ação financeira/destrutiva | Idempotência, estado esperado, transação e auditoria. |
| Esgotar banco com busca/exportação | Paginação, timeout, quotas e concorrência limitada. |
| Tomar conta por reset MFA/email | Recuperação independente, reautenticação, revogação e alertas. |
| Apagar/inundar logs | Escrita confiável, arquivo externo e agregação limitada de negações. |

Ensaios ofensivos devem usar staging, identidades sintéticas e limites controlados. Não executar carga destrutiva em produção. Este plano não afirma que esses ataques foram executados.

## 5. Arquitetura alvo

### 5.1 Decisão de isolamento do frontend e perímetro

**Decisão revisada para o cenário gratuito:** separar o frontend administrativo em outro projeto Vercel é viável sem criar outro banco Supabase. Ambos os deploys podem usar o mesmo projeto Supabase existente, o mesmo Auth e a mesma fonte de dados. A Vercel documenta até 200 projetos no Hobby e múltiplos projetos ligados ao mesmo repositório; o Supabase limita projetos gratuitos ativos, mas essa separação não consome outro projeto Supabase. Separar o deploy é uma opção para isolar bundle, ambiente e controle de acesso, não um pré-requisito de autorização.

**Opção inicial recomendada:** primeiro comprovar e endurecer as autorizações no Supabase e no gateway com o projeto atual. Depois, decidir se vale o segundo deploy conforme o custo de manutenção, a capacidade de proteger todos os hosts e a existência de bypass pela API pública. É possível manter o painel na aplicação atual com as mesmas regras de servidor e banco; uma URL administrativa conhecida continua segura se cada operação for autorizada corretamente.

**Se o deploy separado for adotado:** manter React/Vite e identidade visual Nello, usando host `admin.nellonutri.com.br`, sem duplicar Auth/banco. O bundle público deixa de carregar módulos administrativos. O endereço não é um segredo de autenticação. Exigir configuração explícita de hosts, callbacks, CSP, variáveis de ambiente, deploys de preview e testes de acesso direto à API.

Para o segundo projeto, avaliar **Vercel Authentication com All Deployments** como camada gratuita de acesso ao frontend: anúncio oficial de 09/09/2026 informa proteção da produção sem custo adicional em todos os planos. Verificar o controle na conta e testar produção, previews, aliases e URLs geradas. Cloudflare Access, cujo plano gratuito anuncia até 50 usuários, é alternativa ou camada adicional com allowlist individual; não adicionar ambos sem benefício operacional claro. Preferir MFA resistente a phishing no provedor escolhido quando disponível, com fator reserva. Não liberar qualquer pessoa do domínio de email. Recursos e limites exigem nova checagem na fase de execução.

**Quando Cloudflare Access for usado como controle de origem:** a Vercel deve validar criptograficamente o token Access: assinatura, algoritmo permitido, emissor fixo, audience, expiração e claims aplicáveis. Não confiar apenas em header presente, email textual, Host, Referer ou IP informado pelo cliente. Cache de JWKS com rotação controlada; sem chave válida, negar. Se Vercel Authentication for escolhido, seguir seu mecanismo nativo e continuar exigindo autorização da aplicação e do banco; não inventar validação de token Cloudflare que não existe nesse desenho.

Proteger também arquivos do painel, aliases, previews e endpoints. Se o plano/runtime escolhido não permitir proteger todas as superfícies, manter a autorização no gateway e no banco e registrar o limite antes de declarar isolamento concluído. Proteger HTML não protege APIs. [Validação na origem com Cloudflare](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/).

**Limite de uso do Hobby:** a Vercel define o plano como destinado a uso pessoal não comercial. Se o Nello já for uma operação comercial, o segundo projeto não resolve essa restrição contratual do projeto atual; verificar enquadramento e planejar hospedagem/plano adequado. Essa avaliação não justifica abrir outro banco nem enfraquecer a segurança existente.

### 5.2 Gateway administrativo no servidor — BFF

```text
Operador → perímetro escolhido, se adotado → origem validada → sessão opaca no BFF
         → identidade Supabase e MFA → associação ativa e permissão
         → escopo e autenticação recente → operação restrita + auditoria
```

O navegador chama somente a API administrativa de mesma origem. O gateway usa endpoints específicos e tipados; proibir proxy genérico de SQL, tabela, função ou URL fornecida pelo cliente.

Quando houver identidade própria no perímetro, vinculá-la a `auth.users.id` por cadastro revisado, usando identificador estável do provedor. Não provisionar operador automaticamente por domínio, primeiro login ou coincidência de email. Rejeitar identidades divergentes. Sem perímetro adicional, a conta Supabase e a associação privada continuam sendo a autoridade.

Preferir papel de banco dedicado, sem DDL/concessão, com EXECUTE somente nas operações aprovadas. Definir contexto confiável de identidade por operação e testes contra falsificação. Uma conexão SQL dedicada não possui automaticamente `auth.uid()`/AAL2: validar identidade no servidor e implementar propagação segura, nunca aceitar claims do navegador como autoridade.

Se alguma integração exigir service role, isolar o uso em módulo mínimo, com autorização prévia e auditoria; registrar exceção. Não trocar todas as consultas por service role para facilitar a migração.

**Critério obrigatório:** a proteção do deploy, seja Vercel Authentication ou Cloudflare Access, não basta se o mesmo privilégio continuar disponível diretamente na API Supabase. Antes de declarar obrigatório o gateway, migrar consumidores e retirar caminhos/grants administrativos diretos de anon/authenticated, preservando fluxos clínicos legítimos. Encapsular operações privilegiadas em schema/papel restritos ao gateway. Um caminho direto remanescente impede concluir essa fase. Até a migração, as verificações atuais de associação/AAL2 no Supabase continuam necessárias.

### 5.3 Sessão administrativa independente

Separar sessão administrativa da clínica. Cookie com token opaco aleatório, prefixo `__Host-`, Secure, HttpOnly, Path=/, sem Domain. SameSite Lax ou Strict conforme callback validado. Tokens Supabase e refresh ficam no servidor, protegidos em repouso e fora de logs.

Política inicial proposta:

- Inatividade máxima de 15 minutos, calculada no servidor; duração absoluta de 8 horas.
- Autenticação/MFA recente de até 5 minutos para concessões, recuperação, exportação sensível e ações destrutivas.
- Rotacionar sessão no login, elevação e recuperação; invalidar identificadores antigos.
- Revogação na próxima chamada administrativa, sem aguardar expiração do JWT. Evitar cache positivo que mantenha associação revogada.
- Tratar streams, jobs e downloads pendentes na revogação; listar sessões e permitir encerramento individual/global.
- Callbacks com allowlist por ambiente, state/PKCE conforme protocolo e proteção contra fixação de sessão/open redirect.
- CSRF token vinculado à sessão para mutações, validação de Origin e Fetch Metadata quando aplicável; CORS restrito; nenhuma mutação por GET.

HttpOnly reduz extração de token por JS, mas XSS ainda pode agir dentro da sessão. CORS não é autorização. Expiração do JWT não representa duração absoluta da sessão. [Sessões Supabase](https://supabase.com/docs/guides/auth/sessions).

## 6. Matriz de privilégios proposta

| Papel | Permitido | Vedado por padrão |
|---|---|---|
| Observador | Métricas agregadas e saúde operacional | Conteúdo clínico, exportações e mutações |
| Suporte | Metadados e casos atribuídos | Segredos, concessões, alterações clínicas/financeiras |
| Operações | Revisões operacionais cadastradas | Gerenciar operadores, SQL livre, credenciais |
| Segurança | Sessões, bloqueios preventivos e auditoria | Leitura clínica indiscriminada, autoelevação |
| Owner | Governança de acesso e políticas com reautenticação | Poder implícito sobre qualquer prontuário |

Permissões sugeridas: `admin.metrics.read`, `admin.users.read_metadata`, `admin.support.case_read`, `admin.accounts.suspend`, `admin.sessions.revoke`, `admin.audit.read`, `admin.exports.request`, `admin.operators.manage`. Cada endpoint declara permissão e valida o objeto; ausência de declaração nega.

Concessão/elevação, reset MFA e exportação clínica em massa exigem dupla aprovação quando houver equipe suficiente. Solicitante não aprova a própria ação. Em operação individual, usar procedimento excepcional fora do painel, autenticação independente, validade curta, alerta e revisão posterior; duas contas da mesma pessoa não equivalem a duas pessoas.

Dados clínicos: acesso temporário por caso, justificativa e finalidade autorizada. Observabilidade não concede leitura irrestrita. Não implementar impersonação genérica de pacientes/nutricionistas. Ajustes financeiros preservam pagamentos e exigem conciliação manual conforme decisão de negócio já registrada.

## 7. Identidade, MFA e recuperação

1. Usar conta administrativa individual dedicada, separada do uso clínico cotidiano.
2. Revisar identidade, papel e responsável antes da concessão; registrar motivo e aprovação.
3. Tratar primeiro cadastro e reset MFA como operações de alta confiança: senha roubada não pode bastar para cadastrar o autenticador do invasor.
4. Revisar concessões mensalmente e revogar imediatamente no desligamento/suspeita.
5. Recuperar por canal independente; email sozinho, sobretudo compartilhado, não prova identidade suficiente.
6. Recuperação revoga sessões, registra aprovação e exige novo fator; nunca liberar AAL1 como atalho.
7. Se houver códigos de recuperação, gerar valores aleatórios de uso único, armazenar hashes, mostrar uma vez e bloquear replay. Confirmar suporte nativo antes de projetar integração.
8. Acesso emergencial sob custódia separada, uso excepcional, validade curta e alerta. Não criar senha universal ou conta mestra oculta.

`suporte@nellonutri.com.br` não deve ser owner nem recuperação compartilhada de provedores. `ana@nellonutri.com.br` exige recebimento comprovado e acesso restrito. Receber via Resend não equivale a caixa individual com senha: membros do painel/API podem acessar mensagens. Não compartilhar publicamente emails de recuperação.

Testar o incidente MFA: QR e fallback manual, F5, duplo clique, abas concorrentes, fator confirmado, falha de listagem/remoção, código expirado e desconexão durante verificação. Não gravar segredo em storage/logs nem capturar QR/código em replay. [MFA Supabase](https://supabase.com/docs/guides/auth/auth-mfa).

## 8. Banco, arquivos e execução

- Inventariar schemas expostos, tabelas, views, funções/overloads, proprietários, grants e default privileges, incluindo caminhos indiretos/jobs.
- Revisar views e definer: RLS da tabela não garante proteção de uma operação com privilégios superiores.
- Autorizar identidade, ação e alvo na fronteira confiável; mutação e auditoria de sucesso na mesma transação. Definir comportamento de corrida entre revogação e operação.
- Parametrizar queries; allowlist para identificadores/ordenação; limitar busca, página, intervalo e statement timeout.
- Storage privado para documentos/exportações. URLs assinadas curtas e específicas podem permanecer válidas até expirar; para revogação imediata, preferir download autenticado pelo gateway.
- Revalidar escopo no download. Validar tamanho, tipo real e extensão; isolar conteúdo ativo/anexos e prever quarentena/varredura quando necessário.
- Realtime deve respeitar escopo e revogação; assinatura aberta não autoriza para sempre.
- Revisar separadamente tokens de fluxos públicos de anamnese/documentos, sem convertê-los em acesso admin.

## 9. Abuso, disponibilidade e navegador

Limites iniciais a calibrar em staging: cinco falhas de autenticação/desafio por identidade em cinco minutos com atraso progressivo; limite adicional por IP contra pulverização; 120 leituras/minuto por sessão; 20 mutações/minuto por operador; uma exportação concorrente. Evitar bloqueio permanente explorável como DoS contra uma conta. Considerar limites nativos do Auth separadamente.

Limitador distribuído na fronteira real, não em memória local de função. IP somente de proxy confiável. Na falha do limitador, negar operações sensíveis; consultas agregadas podem ter modo degradado explicitamente limitado. Responder 429/Retry-After; retries não duplicam mutações.

WAF com regras graduais e sinais de abuso. CAPTCHA é complemento, não prova de autorização. WAF do domínio Nello não protege automaticamente o domínio direto Supabase.

CSP restrita, frame-ancestors, HSTS, nosniff, Referrer-Policy e Permissions-Policy. Minimizar scripts terceiros no admin e desativar replay/captura automática de formulários por padrão. CSP não bloqueia toda extensão maliciosa; recomendar navegador/perfil dedicado e dispositivo atualizado.

Dados e sessão com `Cache-Control: no-store`; sem cache administrativo em CDN/service worker. Limpar memória e cache de aplicação no logout/troca de operador. Não prometer apagar dados já vistos ou copiados.

Honeypot é opcional e P2: rota isca sem coleta de senhas e com eventos limitados. Não banir automaticamente por visitar `/admin`; links antigos e scanners legítimos geram falsos positivos. Gateway, revogação e recuperação têm prioridade.

## 10. Auditoria e resposta a incidentes

Registrar: autenticação/negação por categoria; concessão/revogação; leitura sensível; exportação; mutação operacional; reset MFA; alteração de email; uso emergencial; mudança de política e falha de validação do perímetro.

Campos: event_id, request_id, horário do servidor, ator estável, sessão pseudonimizada, ação, alvo mínimo, resultado, motivo e versão da política. Excluir JWT, cookies, senhas, TOTP, QR, URLs assinadas, payload clínico e corpo de email. IP somente com finalidade e retenção limitadas.

Clientes não escrevem eventos arbitrários na trilha confiável. Mutação e evento de sucesso são atômicos. **Negação seguida de rollback precisa de canal independente:** INSERT e exceção na mesma transação apagam o próprio evento. Distinguir tentativa de sucesso confirmado.

Retenção proposta, sujeita a aprovação da política/custo antes de ativar: 90 dias operacionais e 365 de arquivo restrito. Arquivo externo append-only com retenção protegida é o alvo contra adulteração; tabela sem UPDATE/DELETE para clientes não é imutável perante DBA.

Alertas: uso emergencial, concessão, mudança de fator/email, pico de negações, falhas recorrentes do perímetro escolhido, exportação anômala, auditoria indisponível e sessão revogada aceita. Sentry recebe eventos sanitizados; PostHog não substitui trilha de segurança.

Runbook: identificar sessão/operador → suspender associação e revogar sessões → conter entrada → preservar evidências → rotacionar segredos afetados → corrigir/testar → restaurar por canal seguro → registrar impacto e revisão. Metas propostas: alerta crítico em até cinco minutos e contenção em até 15 minutos após reconhecimento; validar capacidade de atendimento.

## 11. Provedores, planos e cadeia de entrega

MFA resistente a phishing quando disponível em GitHub, Cloudflare, Vercel, Supabase, Resend e registrador/DNS. Contas individuais, tokens mínimos, revisão de membros e recuperação independente.

Proteger branch de produção e revisar mudanças em autorização/workflows; lockfile, secret scanning, dependências e actions confiáveis, CI com privilégios restritos. Previews sem banco ou segredos produtivos. Source maps privados não podem conter segredos; esconder código não substitui autorização.

Restringir Postgres/pooler após validar egress e recuperação. Não bloquear automações legítimas com allowlists fictícias. Recursos pagos exigem decisão explícita. A proteção de senha vazada do Supabase, já excluída pelo responsável por depender de plano pago, permanece fora desta atualização; documentar risco residual sem reabrir contratação.

## 12. Implementação em quatro fases

### Fase 1 — comprovação e contenção (P0)

**Responsáveis:** engenharia/backend e responsável pela operação.

- Inventariar rotas, APIs, funções, grants, buckets, operadores, provedores e hosts.
- Confrontar registros anteriores com código/produção e testar anon, usuário comum, operador AAL1/AAL2 e revogado.
- Corrigir primeiro bypass, segredo exposto ou autorização ausente; preservar recuperação legítima.
- Confirmar MFA/email/canais de recuperação e dependências/custos.
- Entregar matriz de evidências e testes negativos automatizados.

**Gate:** usuário comum não acessa operações administrativas; revogação comprovada; nenhum segredo no cliente; MFA real validado pelo operador. Achado crítico impede avanço. Deploy das correções, smoke e observação mínima proposta de 30 minutos.

### Fase 2 — gateway, sessão e decisão de isolamento (P0/P1)

**Dependência:** fase 1 concluída e capacidades dos planos confirmadas.

- Implementar gateway e decidir entre projeto atual com autorização forte ou deploy administrativo separado; se separar, configurar proteção de todos os deploys e validar cada host.
- Se Cloudflare Access for escolhido, configurar vínculo de identidades e validação de origem; se Vercel Authentication for escolhido, testar o controle nativo sem supor proteção do Supabase.
- Implementar BFF, papel restrito, sessão opaca, CSRF, limites e revogação.
- Migrar consumidores e retirar caminhos administrativos diretos/legados.
- Cobrir arquivos, aliases, previews e callbacks; validar com operador piloto.

**Gate:** JWT legítimo sozinho não contorna gateway via Supabase, origem Vercel ou deploy antigo. Sessão adulterada e, se houver identidade adicional no perímetro, identidade divergente/token inválido são negados. Deploy gradual, recuperação ensaiada e observação antes da próxima fase.

### Fase 3 — privilégios, privacidade e auditoria (P1)

**Dependência:** gateway sem bypass direto.

- Aplicar papéis e escopos; revisar owners individualmente.
- Implementar acesso temporário por caso, autenticação recente, aprovações e idempotência.
- Cobrir sucesso/negação com auditoria confiável; proteger exportações e telemetria.
- Implementar alertas e procedimentos de concessão, desligamento e recuperação.

**Gate:** testes horizontais/verticais e de concorrência passam; ações críticas auditadas sem segredos; sem autoelevação ou acesso a caso alheio. Deploy com ensaio de revogação e alertas.

### Fase 4 — exercícios adversariais e estabilização (P1/P2)

- Executar matriz de testes em staging e smokes seguros em produção.
- Ensaiar falhas do perímetro escolhido (incluindo JWKS se Cloudflare Access), Auth, banco, limitador e auditoria.
- Revisar cadeia de entrega, contas dos provedores, performance/custo e emergência.
- Adicionar isca somente se houver benefício e capacidade de tratar alertas.
- Publicar evidências, exceções e responsáveis; observar 24 horas e revisar após sete dias.

**Gate:** nenhum P0/P1 aberto sem contenção formal; operação/revogação/recuperação demonstradas; rollback testado e documentos coerentes com versão implantada. Não declarar segurança absoluta.

## 13. Testes mínimos de aceitação

| ID | Ensaio | Resultado obrigatório |
|---|---|---|
| ADM-01 | Anon/usuário clínico chama cada operação | Negação sem dados ou efeitos colaterais |
| ADM-02 | AAL1 contorna React | Negação no servidor |
| ADM-03 | Perfil/metadado/header forjado | Nenhum privilégio |
| ADM-04 | Assinatura/issuer/audience/expiração inválidos | Negação do gateway |
| ADM-05 | Identidade do perímetro de A e Supabase de B, quando houver dupla identidade | Negação e evento sanitizado |
| ADM-06 | AAL2 chama RPC antiga diretamente | Sem operação administrativa fora do gateway |
| ADM-07 | Origem Vercel/preview/alias | Mesma exigência de identidade |
| ADM-08 | Revogação com sessão ativa | Próxima chamada negada; streams/jobs tratados |
| ADM-09 | Reuso de sessão anterior ao login/reset | Identificador antigo inválido |
| ADM-10 | CSRF/callback/open redirect | Rejeição da ação/redirect indevido |
| ADM-11 | XSS armazenado nas entradas exibidas | Conteúdo inerte e sem exfiltração |
| ADM-12 | SQL injection/filtro/ordenação | Valores tratados como dados ou rejeitados |
| ADM-13 | Troca de UUID/caso/tenant | Escopo negado sem revelação indevida |
| ADM-14 | F5/abas/falhas MFA | Fluxo recuperável, fator confirmado preservado |
| ADM-15 | Reset com senha comprometida | Processo independente; nunca liberar AAL1 |
| ADM-16 | Rajada de login/leitura/exportação | Limites distribuídos; portais preservados |
| ADM-17 | Retry/corrida em ação crítica | Uma execução lógica e estado consistente |
| ADM-18 | Negação que aborta transação | Evento persistido fora do rollback |
| ADM-19 | Logs/replay/cache/storage do navegador | Ausência de segredos/conteúdo sensível |
| ADM-20 | Auditoria indisponível | Mutação crítica negada ou trilha durável garantida |
| ADM-21 | Dispositivo perdido/queda do provedor | Recuperação sem bypass permanente |
| ADM-22 | Download após revogação | Política cumprida; limite de URL assinada explícito |

Usar testes unitários, integração real de grants/políticas e E2E. Mocks de RPC não comprovam RLS; testes com service role não comprovam isolamento do usuário. Dados sintéticos e limpeza controlada.

## 14. Deploy, rollback e evidências

Cada fase futura terá release separado: validação local (`npm run verify:release`, conforme scripts existentes), staging, revisão de banco/configurações, produção, smoke autorizado/negado e observação. **Não fazer deploy para publicar apenas este plano.**

Ordem de migração: criar backend restrito → validar piloto → migrar consumidores → revogar caminhos antigos → comprovar ausência de bypass. Na coexistência, manter controles anteriores e prazo de retirada; o novo perímetro ainda não pode ser declarado obrigatório nesse intervalo.

Rollback não restaura MFA opcional, grants inseguros ou chaves no cliente. Se acesso falhar, colocar admin em manutenção e usar recuperação controlada, preservando portais clínicos quando possível. Alterações aditivas antes de remoções; backup e restauração verificados antes de migração destrutiva.

Evidências por fase: commit/tag, migrations, versão de configurações, inventário, resultados positivos/negativos, deploy Ready, domínio/origem, eventos sanitizados, riscos residuais e responsável. Evidências sensíveis permanecem em repositório restrito, não no Git público.

## 15. Backlog e melhoria contínua

| Ordem | Entrega | Prioridade |
|---|---|---|
| 1 | Inventário e matriz comprovada de autorização | P0 |
| 2 | Contenção de bypass e MFA/recuperação real | P0 |
| 3 | Escolha do perímetro gratuito e eventual deploy separado | P1 |
| 4 | BFF/sessão e retirada de caminhos diretos | P0/P1 |
| 5 | Permissões, escopo de suporte e autenticação recente | P1 |
| 6 | Auditoria, alertas e sessões | P1 |
| 7 | Exportações, limites e revisão de provedores | P1 |
| 8 | Exercícios adversariais e recuperação | P1 |
| 9 | Honeypot e conveniência | P2 |

Concluir somente quando URL conhecida não permite acesso; todas as ações são autorizadas no servidor; não há bypass de origem/API; revogação e recuperação funcionam; privilégios são mínimos; auditoria/alertas são reais; e o operador trabalha sem atalhos inseguros.

Cadência: semanal para alertas/dependências críticas; mensal para acessos e permissões; trimestral para recuperação/restauração/bypass; revisão a cada endpoint, papel ou integração nova. Ciclo: achado → responsável → prazo → correção → regressão → evidência de deploy → revisão de eficácia.

## 16. Referências externas

Consultar novamente capacidades/planos na implementação:

- https://supabase.com/docs/guides/auth/auth-mfa
- https://supabase.com/docs/guides/auth/sessions
- https://supabase.com/docs/guides/platform/network-restrictions
- https://supabase.com/docs/guides/security/platform-security
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/
- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/limits
- https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan
- https://vercel.com/docs/limits/fair-use-guidelines
- https://supabase.com/docs/guides/platform/billing-faq
- https://www.cloudflare.com/plans/
