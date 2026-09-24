# Reauditoria da migração para nellonutri.com.br — 24/09/2026

## Resultado verificado

| Superfície | Estado em produção | Ação |
| --- | --- | --- |
| Frontend, callbacks, convites e CORS de Edge Functions | Código rastreado sem referência operacional ao host anterior; URLs canônicas em Nello | Testes de redirect seguro mantidos e executados no release |
| Supabase Auth | Site URL `https://nellonutri.com.br`; allowlist inclui raiz, www, localhost e preview Vercel; não inclui o host anterior | Conferido no painel |
| Emails de Auth | Seis templates principais sem a marca antiga; SMTP Resend habilitado com remetente `naoresponda@nellonutri.com.br` | Conferido no painel; falta teste de entrega real deste release |
| Dados exibidos | Conquista de 500 refeições usava o nome antigo | Alterada para “Lenda do Nello” por migração SQL; leitura posterior confirmou |
| Storage público | Cinco objetos em `IDV` tinham nomes antigos; nenhum campo de tabela consultado os referenciava | Renomeados, copiados para `brand-archive` privado com tamanhos conferidos e retirados de `IDV`; ali resta apenas `nello.png` |
| Conta Auth ativa | Um login administrativo `ana@hipozero.com`, com entrada recente, identidade e perfil correspondentes | **Pendente:** criar/comprovar a caixa de destino e concluir mudança verificada; não retirar acesso antes disso |
| Relatórios e auditoria históricos | 18 bug reports e eventos de Auth preservam o email e contexto registrados na época | Preservar como trilha histórica; não reescrever ocorrências |
| Domínios HTTP | `nellonutri.com.br` responde 200; `www` redireciona 308; antigos `hipozero.com.br` e `www` retornam 404 na Vercel | Publicar apenas URLs Nello; links antigos exigem reenvio |
| Vercel | Projeto associa apenas raiz e `www` Nello; nomes das seis variáveis de projeto não citam a marca anterior | Deploy `a9b6eb87` Ready em Production; o bundle público contém a nova tela administrativa e o formulário de email |

## Cobertura da varredura

- Pesquisa no Git rastreado, `src`, `public`, funções Edge, migrações e documentação operacional. O material em `Docs/Backlog_Historico`, `Docs/Resolvidos` e `Docs/Historico_de_Ondas` é histórico e pode citar a marca antiga como evidência temporal.
- Busca de valores em 143 tabelas dos schemas `public`, `private`, `auth` e `storage`; inspeção adicional das funções, views e políticas de `public`/`private` não encontrou definição operacional com o host antigo.
- Conferência visual da URL Configuration, SMTP e templates de Auth no projeto Supabase `afyoidxrshkmplxhcyeh`. O painel mascara alguns valores de entrada na árvore automatizada; o remetente foi confirmado pela visualização, sem salvar alterações.
- Conferência no painel Vercel de deployment, domínios e nomes das variáveis de projeto. Os valores sensíveis das variáveis não foram revelados; os artefatos públicos foram examinados para confirmar ausência da marca antiga no frontend.
- A nova seção “Migração da marca” em Segurança administrativa consulta diretamente o banco, exige operador ativo e JWT AAL2 e mostra contagens atuais. `anon` não tem permissão de execução.

## Pendência de identidade e recuperação

A resposta recebida permite `ana@nellonutri.com.br` **somente se a caixa já existir**. A consulta DNS de 24/09 retornou SOA e nenhum registro MX para `nellonutri.com.br`; o Resend configurado para saída não comprova nem cria caixa de entrada. Portanto, não alterar diretamente `auth.users`/`auth.identities`, não desvincular o operador e não enviar código a um endereço presumido. Fluxo seguro:

1. Configurar recepção de email no domínio Nello, criar ou encaminhar `ana@nellonutri.com.br`, e confirmar posse e recebimento por canal da titular.
2. A titular, autenticada, solicita alteração de email via Supabase Auth e conclui as confirmações exigidas nos endereços antigo e novo. Se a caixa antiga já não recebe, usar procedimento administrativo de recuperação de identidade, com registro de motivo e confirmação independente.
3. Conferir que `auth.users`, `auth.identities` e `public.user_profiles` apontam ao endereço novo, que login e recuperação chegam à caixa nova, e que a associação `private.admin_operators` segue válida com MFA.
4. Reexecutar a consulta de migração do painel até `legacy_auth_accounts=0`. Os 18 relatórios históricos e o audit log continuarão registrados com o email usado na época.

## Limites

Não foi feita entrega real de email nem login da conta Ana nesta reauditoria. O domínio antigo não redireciona mais; o retorno 404 é estado externo real. Os cinco arquivos antigos foram preservados em bucket privado e em backup local ignorado pelo Git; seu conteúdo visual não foi refeito nem republicado como marca Nello. A tentativa de acessar uma cópia pública retirada retornou HTTP 400 do Storage.
