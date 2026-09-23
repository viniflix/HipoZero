# Biblioteca de protocolos Nello — 23/09/2026

## Conteúdo entregue

- Quatro anamneses editáveis da plataforma: primeira consulta adulta, seguimento, avaliação pediátrica com responsável e pessoa idosa. Perguntas cobrem história clínica e alimentar, alergias, medicamentos, medidas, atividade, sintomas, contexto social e barreiras. O modelo adulto demonstra seleção múltipla, escala, flag clínica e pergunta condicional.
- Dois check-ins semanais editáveis, com escalas, respostas sim/não, número, texto e escolha múltipla. O peso de pontuação é zero porque as perguntas exploratórias não medem adesão clínica validada.
- Uma dieta modelo com quatro refeições e 14 alimentos ativos do catálogo TACO, uma refeição modelo e duas receitas com rendimento, preparo, ingredientes e macronutrientes calculados. Quantidades em gramas são ilustrativas; a dieta não estabelece meta energética universal nem é liberada automaticamente ao paciente.
- Exemplos pessoais de check-in, dieta, refeição e receitas foram preparados para todos os perfis de nutricionista existentes e para novos perfis. Anamneses da plataforma ficam disponíveis a todos e podem ser copiadas com novos identificadores de pergunta.

## Correções de fluxo

- A agenda agora consulta os modelos de anamnese pelo hook correto. O prontuário aceita criar registro a partir de modelo global ativo, com snapshot completo; modelos vazios são recusados.
- O salvamento de check-ins usa uma RPC atômica. Após existir uma sessão, perguntas não podem ser substituídas no mesmo modelo; o nutricionista deve criar outro para preservar respostas históricas.
- Só é possível vincular check-in no aplicativo a um paciente com conta de acesso. O despachante ignora contas removidas para não bloquear os demais envios.
- A interface identifica a cópia de dieta como rascunho e pede revisão/finalização antes da liberação. Uma refeição vazia é recusada no editor de dieta.

## Evidências de verificação

- Migrações ensaiadas em transações revertidas no banco remoto. Quatro modelos globais ativos, nenhum vazio; 20 dietas, 20 refeições, 40 receitas e 40 check-ins para 20 nutricionistas; nenhuma referência alimentar indisponível e nenhuma receita de exemplo com totais zerados.
- Fluxos exercitados com rollback: cópia de dieta para rascunho de paciente com 14 alimentos; criação de anamnese global e geração de link; criação/edição atômica de check-in; vínculo, disparo e resposta de check-in; rejeição de destinatário sem conta.
- `npm run verify`: 97 arquivos de teste, 598 testes aprovados, build e orçamento de bundle aprovados. Lint tem um aviso preexistente em teste de redirecionamento de autenticação, sem erro.

## Referências de conteúdo

- [Resolução CFN 594/2017](https://www.cfn.org.br/wp-content/uploads/resolucoes/DOU_594.pdf): registro de informações clínicas e nutricionais, inquérito alimentar, alergias, medidas e evolução.
- [Guia Alimentar para a População Brasileira](https://www.gov.br/saude/pt-br/composicao/saps/promocao-da-saude/guias-alimentares): base em alimentos in natura ou minimamente processados e atenção ao contexto social e cultural.
- [TACO, NEPA/Unicamp](https://nepa.unicamp.br/categoria/taco/): fonte dos alimentos selecionados no catálogo Nello; os valores foram lidos do banco e aplicados por 100 g.

Os modelos são material de apoio editável. Avaliação, prescrição e liberação ao paciente continuam sob responsabilidade do nutricionista.
