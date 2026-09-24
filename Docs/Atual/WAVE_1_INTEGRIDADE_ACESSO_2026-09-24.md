# Wave 1 — integridade documental e acesso crítico

**Data:** 24/09/2026. **Release de código:** `59996f07`. **Status:** correção documental publicada; gates operacionais de identidade/email/MFA e teste autenticado ainda abertos.

## Correção implantada

- A RPC anterior `confirm_document_asset_upload` aceitava o SHA-256 vindo do navegador e confirmava a versão documental sem ler os bytes armazenados. O bucket privado já exigia reserva de upload, proprietário, tamanho e MIME declarados, mas isso não autenticava o digest.
- `confirm-document-asset` v1 recebe apenas o ID da reserva, exige JWT válido, confere o proprietário da reserva, baixa o objeto do Storage com credencial de serviço, confere o tamanho real e a assinatura básica PNG/JPEG/WebP, calcula SHA-256 dos bytes baixados e chama `confirm_document_asset_upload_verified` com acesso restrito a `service_role`.
- O frontend chama a Edge Function e não envia SHA-256. Após o deploy Vercel Ready em produção do commit `59996f07`, a migração `document_asset_revoke_client_confirmation` retirou `EXECUTE` de `anon`/`authenticated` e neutralizou a função antiga. A confirmação nova também nega esses papéis.
- O hash agora representa o objeto lido pelo serviço no momento da confirmação. A assinatura de arquivo é uma verificação básica de tipo, **não** decodificação integral nem varredura antimalware. O bucket continua privado, sem políticas de UPDATE/DELETE para usuário comum e com limite de 5 MB.

## Evidências

- `npm run verify:release`: 114 arquivos, 676 testes, lint, build, orçamento de bundle e audit de dependências sem vulnerabilidade alta no corte. Testes adicionais verificaram hash dos bytes, tipo/tamanho divergentes e chamada do cliente à Edge em vez da RPC antiga.
- Vercel mostrou `59996f07` como **Ready / Production / Current** no domínio `nellonutri.com.br`. `/login` respondeu 200. A Edge nova v1 apareceu `ACTIVE` com `verify_jwt=true`.
- POST sem Authorization à Edge: 401 `UNAUTHORIZED_NO_AUTH_HEADER`. POST com chave pública e sem usuário: 401 `invalid_session`. POST anônimo à RPC antiga: 401 `permission denied for function confirm_document_asset_upload`.
- Preflight `OPTIONS` do domínio Nello à Edge: 200 com `Access-Control-Allow-Origin: https://nellonutri.com.br` e método POST permitido.
- Catálogo após as duas migrações: função antiga `authenticated_exec=false`, `anon_exec=false`, `prosecdef=false`; função nova `authenticated_exec=false`, `anon_exec=false`, `service_exec=true`. Nenhum upload documental confirmado existia no momento da inspeção, portanto não havia legado de hash a reconciliar.

## Acesso administrativo e recuperação

- Nove funções públicas relacionadas ao admin foram listadas no catálogo; todas negam `anon` e incluem guarda `private.is_admin()`. A guarda exige associação não revogada em `private.admin_operators` e JWT AAL2. `sentry-proxy` e `create-patient` consultam `admin_access_status` no caminho administrativo. Isto é uma inspeção de contrato e grants, **não** a matriz adversarial completa nem implementação do gateway planejado.
- O banco mostra dois operadores ativos; um já tem fator MFA verificado. O inventário anterior, que registrava zero, ficou desatualizado. Falta provar login real, F5/recuperação e segundo operador quando aplicável.
- Resend mostra `nellonutri.com.br` **verified** e pronto para enviar/receber; `Enable Receiving` e MX da raiz estão **verified**. A lista `Receiving` estava vazia nos últimos 15 dias. Não houve entrega real comprovada nem caixa IMAP individual.
- Auth continua com uma conta `@hipozero.com` e nenhuma `ana@nellonutri.com.br`. A troca da conta Ana não foi executada: requer mensagem recebida/acesso restrito à caixa de destino e confirmação ou recuperação da identidade por canal independente. O domínio antigo ainda aparece verificado no Resend; preservá-lo até encerrar a recuperação, depois revisar sua retirada.

## Gates restantes antes de declarar a wave concluída integralmente

1. Com conta sintética de nutricionista verificado, fazer upload real de PNG/JPEG/WebP, conferir hash do objeto baixado, preview e versão; tentar bytes divergentes e chamada direta à RPC antiga com JWT autenticado. Há testes automatizados e negativos anônimos, mas não houve sessão sintética autenticada disponível nesta execução.
2. Receber mensagem externa real em `ana@nellonutri.com.br` e `suporte@nellonutri.com.br`, definir acesso/retensão ou encaminhamento permanente e, só então, concluir alteração Auth de Ana com confirmações e login de recuperação.
3. Operadores concluírem/validarem TOTP no próprio dispositivo; testar código expirado, F5 e recuperação controlada. Segredos, QR e códigos não devem ser compartilhados em Docs.
4. A matriz completa de autorização, sessão revogável, gateway e auditoria confiável pertence à wave 3 do plano; não foi marcada como concluída por esta inspeção.

**Fontes de contexto:** `INVENTARIO_PENDENCIAS_E_VALIDACOES_2026-09-24.md`, `ADMIN_SEGURANCA_UPDATE_PLANO_2026-09-24.md`, `INCIDENTE_MFA_E_EMAIL_RECEBIMENTO_2026-09-24.md`, `MIGRACAO_DOMINIO_REAUDITORIA_2026-09-24.md` e `../AUDITORIA_NELLO.md`.
