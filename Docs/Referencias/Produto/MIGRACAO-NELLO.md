# Migração Nello — registro histórico de 22/09/2026

Este documento preserva o estado observado em 22/09/2026; não representa a configuração atual. A reauditoria de 24/09/2026 está em `Docs/Atual/MIGRACAO_DOMINIO_REAUDITORIA_2026-09-24.md`. Não contém credenciais.

## Concluído
- [x] Vercel: projeto renomeado de hipozero para nello; ID preservado prj_zbE0dJoJrygKzMBq6nG9o7NdVV3H.
- [x] nellonutri.com.br associado à produção; www.nellonutri.com.br redireciona 308 para a raiz.
- [x] Em 22/09, hipozero.com.br e www.hipozero.com.br redirecionavam 308 para nellonutri.com.br. Em 24/09, os hosts antigos retornam 404 na Vercel após desvinculação; essa linha não é um teste vigente.
- [x] Cloudflare Free ativo; nameservers jessica.ns.cloudflare.com e newt.ns.cloudflare.com salvos na Hostinger.
- [x] DNS: raiz A 216.198.79.1 e www CNAME 79d7599cc9e2aebc.vercel-dns-017.com, ambos com proxy.
- [x] TLS Full (strict), certificado universal ativo, TLS mínimo 1.2, TLS 1.3, Always Use HTTPS e Automatic HTTPS Rewrites ativados.
- [x] DDoS de rede, SSL/TLS e HTTP ativos. Regra de bloqueio de sondagens .env/.git/WordPress/PHPUnit ativa.
- [x] Rate limiting ativo: 60 requisições em 10 segundos por IP às páginas /login, /register, /forgot-password, /update-password, /auth/verify e /auth/v1/verify; bloqueio de 10 segundos.
- [x] Resend: nellonutri.com.br verificado, região São Paulo; DKIM e CNAMEs rsend/send em DNS only. DMARC p=none.
- [x] Supabase: mesmo projeto afyoidxrshkmplxhcyeh, renomeado Nello; Site URL https://nellonutri.com.br; raiz/www novos adicionados aos redirects. Os redirects legados foram removidos posteriormente.
- [x] SMTP Resend mantido com credencial existente; remetente Nello <naoresponda@nellonutri.com.br>.
- [x] Templates de confirmação, convite, recuperação, magic link, alteração de e-mail e reautenticação atualizados para Nello. Convite usa ConfirmationURL.
- [x] sentry-proxy versão 9 publicada com novas origens, mantendo JWT e autorização existentes. Cópia local sincronizada; infraestrutura permanece ignorada pelo Git conforme política do repositório.
- [x] Código de redirecionamento de autenticação compatível com URLs antigas e bloqueando destinos externos. Commit c53b5846 enviado à main.
- [x] npm run verify: 258 arquivos / 1541 testes passaram, build e orçamento de bundle passaram. Lint sem erros (um aviso de string javascript no teste de rejeição de URL maliciosa).
- [x] Teste real autorizado para viniciusvyctor@gmail.com: Resend marcou Delivered em 22/09 às 13:28 (Fortaleza), remetente novo e link de recuperação para nellonutri.com.br/update-password?mode=recovery.
- [x] Testes públicos: login/cadastro HTTP 200 via Cloudflare; login renderizado no navegador; /.git/config HTTP 403; logo dos e-mails HTTP 200; CORS sentry-proxy aceita Nello (200) e rejeita origem externa (403).

## Conferência final
- [x] Deployment c53b5846 Ready em produção na Vercel (A6R786Gg2eiDwzqMtE2Vr8y8kRFQ). Login recarregado sem erros de console.
- [ ] Usuário pode conferir o e-mail recebido e concluir o fluxo de senha pessoalmente. A senha não foi alterada pelo agente.

## Continuidade e limites
- Os links antigos pararam de redirecionar após a desvinculação. Solicitar novos emails e compartilhar URLs Nello quando necessário.
- Sessões/localStorage não migram entre domínios: usuários precisam entrar novamente no Nello.
- Na reauditoria de 24/09, uma conquista e cinco nomes de arquivos públicos ainda continham a marca anterior e foram corrigidos. Uma conta Auth administrativa ativa continua exigindo troca de email verificada.
- Cloudflare protege somente tráfego que passa pelo seu proxy. APIs diretas supabase.co continuam sob autenticação, RLS e limites próprios do Supabase; a regra de páginas não limita tentativas diretas na API.
- Resend configurado para envio; isso não cria uma caixa postal para receber e-mails.
- DNSSEC não foi ativado; nenhuma contratação paga foi feita.
- Alguns resolvedores ainda podem manter o DNS anterior em cache temporariamente.
- O repositório GitHub agora é `viniflix/nello`. O nome da pasta local de checkout não é uma URL da aplicação.
