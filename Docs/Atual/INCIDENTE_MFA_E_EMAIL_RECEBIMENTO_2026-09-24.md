# MFA administrativo e recebimento de email — 24/09/2026

## Incidente e correção

- QR inválido: o SDK instalado (`@supabase/gotrue-js`) já prefixa o SVG com uma data URL. O componente prefixava e codificava a URL inteira outra vez. Agora normaliza o SVG bruto (inclusive caracteres reservados) e aceita SVG já codificado.
- Após F5: logs do Auth confirmaram `422 mfa_factor_name_conflict` para `Nello Admin`. O segredo fica apenas na memória da página; o fator incompleto permanece no Auth.
- Ao clicar em configurar, o cliente consulta os fatores novamente, reutiliza fator confirmado quando existir e remove apenas TOTP não confirmado com o nome `Nello Admin` antes de gerar um novo. Erros de consulta/remoção impedem nova inscrição. Nenhum fator confirmado é removido.
- Cadastro inicial aguarda a consulta dos fatores. Erros assíncronos são tratados.
- Chaves e códigos não são gravados no armazenamento do navegador nem nos logs. O usuário deve descartar a chave do print e escanear a nova configuração. A confirmação dos seis dígitos continua sendo feita pelo próprio usuário.
- A autorização do servidor e a exigência de AAL2 permanecem ativas.

## Verificação

- `npm run verify:release`: 112 arquivos, 662 testes aprovados; lint, build, orçamento de bundle e auditoria de dependências aprovados (0 vulnerabilidades).
- Nove testes do gate cobrem autorização do servidor, QR em ambos os formatos, recuperação do fator incompleto, preservação de fator confirmado e falha de limpeza.
- Após ajuste adicional de escape do SVG: testes do gate e lint executados novamente.
- Commits da correção: `3095cf51`, `efda66df`.

## Recebimento no Resend

- Recebimento ativado para `nellonutri.com.br` na conta Resend existente; envio já estava configurado.
- DNS autoritativo é Cloudflare, embora o Resend apresente Hostinger como provedor.
- Adicionado MX na raiz: `inbound-smtp.sa-east-1.amazonaws.com`, prioridade 10, TTL automático (300 segundos). Consulta ao resolvedor público 1.1.1.1 confirmou o registro.
- Resend recebe qualquer endereço do domínio habilitado, incluindo `ana@nellonutri.com.br` e `suporte@nellonutri.com.br`; consulta em https://resend.com/emails/receiving. Não são caixas IMAP com senhas individuais.
- Plano gratuito publicado: 3.000 emails/mês, limite diário 100, recebimento incluído e retenção de 30 dias. Conferir uso no painel antes de depender do limite para operação diária.
- Não foi contratado plano pago, criado encaminhamento nem configurado armazenamento permanente de mensagens.
- A identidade Auth de Ana ainda não foi alterada: concluir verificação de recebimento e confirmação de alteração de email antes da migração. O fluxo existente exige confirmação nos endereços antigo e novo.

## Pendências de validação operacional

- Confirmar que o MX aparece como Verified no Resend e testar entrega real aos dois endereços; DNS publicado isoladamente não comprova entrega.
- Usuário concluir MFA com QR novo e código do próprio aplicativo.
- Caso se deseje encaminhamento para uma caixa permanente, definir explicitamente o destinatário; não inferir destino para mensagens de recuperação de conta.

Fontes: https://resend.com/docs/dashboard/receiving/introduction e https://resend.com/pricing.md.
