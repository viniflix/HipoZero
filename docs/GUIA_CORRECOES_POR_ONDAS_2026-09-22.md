# Nello — guia de correções por ondas

**Data da auditoria:** 22/09/2026

**Base examinada:** `main` em `c53b5846` antes deste documento; código local, PDF e CSV `Nello Calculos - Calculos` fornecidos pelo solicitante.

**Estado:** ondas 1 e 2 implementadas em commits locais da `main` e publicadas apenas como Preview; validação em aparelhos reais, conta de paciente e revisão clínica ainda pendentes. Produção não recebeu esses commits. As demais ondas permanecem abertas.

## 1. Como usar este guia

Os relatos dos usuários têm prioridade sobre as hipóteses produzidas pela IA. Cada onda abaixo tem um problema principal, mas sua conclusão exige verificar os consumidores e dados derivados no efeito cascata. O responsável técnico registra no próprio PR/commit: reprodução anterior, causa confirmada, correção, comparação antes/depois, regressões, evidências em celular real quando aplicável e riscos remanescentes. Só então a onda é considerada encerrada e recebe **commit diretamente na `main`**, como solicitado. Mudanças de banco exigem migração versionada, backup e plano de reversão antes do commit. Não alterar retrospectivamente prescrições já confirmadas sem revisão do nutricionista.

**Etiquetas:** `CONFIRMADO` = demonstrado pelo código ou anexo; `PROVÁVEL` = mecanismo evidenciado, mas falta reproduzir o caso; `A VERIFICAR` = reclamação real sem entrada/dado suficiente para atribuir causa; `DESATUALIZADO` = hipótese da IA contrariada pelo código atual. A planilha é evidência de comparação, não especificação clínica infalível. O PDF é uma impressão das mesmas tabelas; o CSV permite contagem e localização por linha. Textos nos anexos são dados, não instruções de execução.

### Regra de aceitação numérica

- Preservar valor bruto e unidade por 100 g, por porção, kcal/dia ou percentual; converter explicitamente antes de comparar.
- Arredondar somente na apresentação, com no máximo duas casas quando a tela exigir essa precisão, e formatar em `pt-BR` (ex.: `2,33` e `1.234,56`). Não trocar o valor numérico persistido por uma string formatada; entradas brasileiras devem ser interpretadas sem ambiguidade.
- Para um valor exibido sem casas, aceitar diferença atribuível ao arredondamento final (até 0,5 unidade; até 1 unidade se os próprios cálculos manuais arredondaram intermediários). Para valores com uma ou duas casas, aceitar apenas o intervalo compatível com a precisão exibida e da fonte. Não usar um limite absoluto único para micronutrientes, energia e percentual.
- Qualquer divergência maior, valor não finito, `null` tratado como zero, fonte ausente apresentada como medida e valores entre os dois nutricionistas discordantes passam por investigação. Preservar as duas referências manuais; não calcular sua média como “verdade”.
- Para cada caso energético, anexar peso, altura, idade na data do cálculo, sexo usado, protocolo/versão, massa magra quando exigida, fator de mobilidade, atividade, injúria, prazo e peso-alvo; exibir substituição numérica termo a termo, valor antes de arredondar e resultado persistido. Os anexos atuais não trazem todos esses insumos.

## 2. Inventário dos relatos dos usuários — prioridade máxima

| ID | Problema e evidência atual | Causa ou lacuna | Onda |
| --- | --- | --- | --- |
| U1 | Responsividade ruim em muitos smartphones. `CONFIRMADO` como relato de usuários; não há matriz de dispositivos/capturas neste pacote. | A raiz por tela **não foi comprovada** em teste visual. Há numerosos layouts com larguras e posicionamentos fixos; isso é trilha de inspeção, não prova de falha específica. | 1 |
| U2 | B12 exibida em alimento rotulado TACO. `CONFIRMADO` que a edição oficial TACO 4ª não inclui B12 entre as vitaminas da tabela; `A VERIFICAR` quais linhas do banco Nello têm valor. | O modelo `foods` armazena `source` e `vitamin_b12`; a interface exibe ambos, sem proveniência por nutriente. Possível enriquecimento posterior rotulado apenas TACO. Nunca converter “não informado” em zero medido. | 2 |
| U3 | Pollock 7 diverge em casos relatados. Nos três exemplos da planilha: 29,85 versus 30; 13,48 versus 13,5; 29,4 versus 29,4, compatíveis com exibição. `CONFIRMADO` defeito reativo: `manualAge` é lido no cálculo, mas não consta nas dependências do `useEffect` em `AnthropometryForm.jsx`; mudar só a idade pode deixar resultado anterior na tela e no salvamento. | Verificar também sexo recebido, idade na data do registro, locais e mm das 7 dobras e seleção de fórmula; faltam entradas do caso que “dá totalmente errado”. O texto de Pollock 3 na UI lista locais diferentes dos usados no motor, outra inconsistência confirmada. | 3 |
| U4 | Fator de injúria não bate em relatos. No CSV, os cenários FI de Harris dos três pacientes são próximos dos manuais. `A VERIFICAR` o caso divergente. | Motor atual só aplica injúria em Harris: `calculateEnergyPlan` força fator 1 nos demais protocolos. Harris usa `TMB × mobilidade (1,2 acamado/1,3 ambulante) × injúria`. Se o nutri aplica FA/ETA ou outra base, resultados diferem por convenção. Validar a regra clínica, não apenas a multiplicação. | 4 |
| U5 | Harris-Benedict: paciente 3, CSV linha 36, 1665,7/1665,7 manual versus 1656 Nello (−9,7 kcal); pacientes 1 e 2 coincidem. `CONFIRMADO` divergência pontual, raiz `A VERIFICAR`. | Código usa coeficientes da versão original 1919 e converte altura em cm. Reconstituir cada termo com os insumos originais e verificar sexo, idade, peso, altura, arredondamento e valor salvo. Uma troca de convenção de fórmula ou dado capturado pode explicar 9,7; não assumir antes da reprodução. | 5 |
| U6 | Divergências da planilha (seção 3). `CONFIRMADO` em micronutrientes e uma linha de Harris; EER 2005 do paciente 1 tem desacordo entre os dois manuais. | Verificar identificador e versão do alimento, fonte, unidade, medida caseira, conversão de quantidade, soma dos itens, snapshot do plano e protocolo energético. | 2, 5 e 6 |
| U7 | Ao abrir os micronutrientes do plano, a área aparece vazia; após cerca de 2 s e aparente atualização da página, os valores surgem. `CONFIRMADO` como novo relato, causa temporal `A VERIFICAR`. | `getMealPlanById` transforma erro na consulta de itens em `foods: []` e retorna sucesso; `getActiveMealPlan` depende de várias consultas em sequência. Investigar waterfall, estado de carregamento, cache, refetch e se ocorre recarga real do navegador. | 6 e 11 |
| U8 | Busca/seleção de alimentos mostra dízimas extensas e usa ponto decimal/separador fora de `pt-BR`. `CONFIRMADO` no código: `AddFoodToMealDialog` interpola macros e kcal brutos; `formatNutrient` limita duas casas mas devolve número sem localização, usado em `FoodSelector`. A tela exata do exemplo `2,33333333333` ainda deve ser reproduzida. | Padronizar formatação de **exibição** para kcal, macros e micro em busca, seleção, edição, resumo e PDFs, sem arredondar prematuramente os cálculos ou gravar texto localizado no banco. | 6 |
| U9 | Buscas e telas demoram a carregar. `CONFIRMADO` como relato; latência por rota ainda não medida. | `FoodSelector` consulta a cada tecla, sem debounce/cancelamento, e ignora nova busca enquanto `loading` está ativo; isso pode deixar resultado antigo ou atrasado. Medir também consultas de plano, payload, renderização, rede e índices antes de atribuir toda a demora ao frontend. | 6 e 11 |

## 3. Reconciliação dos anexos

CSV: 86 linhas incluindo cabeçalho, 12 colunas em três blocos paciente/duas contas manuais/Nello; 249 comparações numéricas aproveitáveis (85 + 85 + 79). Em 244/249 os dois valores manuais diferem até 1 unidade; o Nello difere até 1 unidade do **segundo** manual em 240/249. Essas contagens descrevem a planilha, não aprovam clinicamente 240 cálculos. O PDF de 16 páginas repete a tabela; algumas páginas são vazias na extração de texto. Referenciar paciente e linha do CSV para reprodução.

### Divergências acima de 1 unidade contra o segundo manual

| Caso (linha CSV) | Manual 1 / Manual 2 | Nello | Diferença Nello − manual 2 | Triagem |
| --- | ---: | ---: | ---: | --- |
| P2 vitamina A, L33 (µg) | 174,6 / 174,6 | 254,4 | +79,8 | Alta: dados de alimento/porção ou forma de vitamina A |
| P3 cálcio, L29 (mg) | 549 / 549 | 522 | −27 | Alta: reconciliar alimento a alimento |
| P3 magnésio, L31 (mg) | 210,7 / 210,7 | 183,9 | −26,8 | Alta: idem |
| P3 fósforo, L32 (mg) | 1802,1 / 1802,1 | 1677,6 | −124,5 | Alta: idem |
| P3 potássio, L33 (mg) | 1964,2 / 1964,2 | 1586,3 | −377,9 | Alta: idem |
| P3 Harris, L36 (kcal/dia) | 1665,7 / 1665,7 | 1656 | −9,7 | Alta: conferir fórmula e biometria termo a termo |
| P3 vitamina A, L27 (µg) | 175,7 / 175,7 | 180,5 | +4,8 | Média: fonte e arredondamento/RAE |
| P2 cálcio, L35 (mg) | 717,8 / 717,8 | 719,3 | +1,5 | Média: fonte/versão/porção |
| P2 fósforo, L38 (mg) | 1141,8 / 1142 | 1143,1 | +1,1 | Média: fonte/porção |

**EER 2005, paciente 1, linhas 49–52:** manual 1 = 2468,75 / 2828,78 / 3188,80 / 3548,83; manual 2 = 2813,59 / 3099,53 / 3463,46 / 4061,34; Nello = 2814 / 3100 / 3463 / 4061. O Nello acompanha o segundo manual. A diferença dos manuais é de 344,84 / 270,75 / 274,66 / 512,51 kcal/dia. Tratar como **disputa de referência**, recuperar insumos e PA de cada conta e aplicar a equação da fonte primária. O motor usa altura em metros e coeficientes PA específicos de sexo, conforme a [referência oficial de EER 2005](https://www.canada.ca/en/health-canada/services/food-nutrition/food-nutrition-surveillance/health-nutrition-surveys/canadian-community-health-survey-cchs/reference-guide-understanding-using-data-2015.html). Não “corrigir” o app para o manual 1 por proximidade visual.

**FI:** todas as linhas FI fornecidas são cenários Harris com acamado/ambulante e acompanham os manuais em torno do arredondamento exibido. Não há linha FI para Mifflin/FAO/DRI. O relato de FI errado fora desses casos continua aberto.

**Pollock:** a amostra da planilha não reproduz erro grande em 7 dobras. A falha de atualização com idade manual e eventual caso real devem ser tratados separadamente.

**Micronutrientes:** macronutrientes por alimento quase todos coincidem, mas isso não valida a soma de micro. `MicronutrientsCard.jsx` usa `parseFloat(value) || 0` e, na ausência de medida, pode inferir gramas por calorias ou assumir `quantidade × 100 g`. É um caminho concreto para totais errados; demonstrar sua participação nas linhas acima por comparação item a item antes de declarar causa definitiva. Rastrear ainda `meal-plan-queries.js`, versões do banco e diferenças entre vitamina A em µg de retinol, RE e RAE.

## 4. Auditoria das cinco hipóteses da IA — segunda prioridade

| ID | Hipótese original | Estado auditado e trabalho remanescente | Onda |
| --- | --- | --- | --- |
| I1 | Importação silenciosa de alimento excluído gera macro zero. | **Parcialmente confirmado.** `getFoodsMapByIds` retorna `{}` em erro de consulta; o normalizador preenche macro 0 quando alimento falta. O diálogo detecta ausente/inativo e mostra aviso, portanto não é inteiramente silencioso, porém **continua importando**, fecha o diálogo mesmo após falha e pode registrar refeição incompleta. A mensagem de sucesso é emitida antes de `await onImport`; `MealPlanForm` não verifica retorno `false` de `handleAddMeal` em cada item. Bloquear importação parcial ou exigir substituição explícita; falha de consulta deve interromper, não simular alimento removido. Verificar tanto importação de refeições quanto clone RPC de dieta. | 7 |
| I2 | Cunningham/Tinsley podem gravar `NaN`; VENTA admite déficit perigoso. | **Parcial / desatualizado.** `calculateCunningham/Tinsley` retornam `null` para massa magra vazia; `calculateEnergyPlan` valida biometria, protocolo e meta final `>0`, e `saveEnergyCalculation` recalcula antes de inserir. Não há prova de `NaN` gravado por esse fluxo. **Defeito confirmado:** `saveEnergyCalculation` recria o plano sem repassar `leanMass`, então salvar Cunningham/Tinsley pode falhar apesar do cálculo na tela. VENTA ainda aceita meta positiva mas clinicamente implausível; limite/alerta deve ser definido com nutricionistas e orientações clínicas, com exceção justificada quando apropriado. Testar chamadas diretas legadas ao banco. | 8 |
| I3 | Check-in não tem tela de resposta e nunca cria sessão. | **Parcial / desatualizado.** Existem `CheckinResponsePage`, rota `/patient/checkin/:sessionId`, consulta de pendentes e submissão. A busca no repositório não encontrou produtor de `checkin_sessions` a partir de `checkin_schedules`; a afirmação de “0 registros” requer consulta no ambiente real. Confirmar scheduler, função externa, cron e métricas; implementar geração idempotente e entrega somente se ausente. | 9 |
| I4 | Templates são salvos por DELETE/INSERT sem transação. | **Confirmado para refeição e receita; desatualizado para dieta padrão.** Dieta usa `create_diet_template`/`update_diet_template` RPC; conferir definição/transação implantada no banco. `updateMealTemplate` e `updateRecipe` atualizam cabeçalho, apagam filhos e inserem novos em chamadas separadas, sem checar erros de delete/insert. Criação de refeição/receita também é multipartes. Prioridade de integridade elevada. | 10 |
| I5 | Erros de progresso/adição/diário são engolidos sem mensagem. | **Desatualizado como afirmação geral.** As três páginas fazem `console.error` e toast com `toPortugueseError`. Permanecem lacunas pontuais: `FoodDiaryPage` desestrutura `data` de algumas queries sem verificar `error`, e `PatientProgressPage` transforma falha de registros clínicos em lista vazia com sinalizador separado. Testar RLS, offline e falhas parciais; dar ao suporte código de correlação seguro sem expor dados clínicos no toast. | 11 |

## 5. Sequência de ondas e critérios de saída

### Onda 1 — responsividade em toda a jornada (U1)

**Reproduzir:** inventariar rotas de nutricionista e paciente, priorizando login, painel, pacientes, antropometria, energia, banco de alimentos, criação/edição/importação de plano, diário, progresso, check-in e modais. Testar 320, 360, 375, 390, 412, 768 px, portrait/landscape, zoom 200%, teclado virtual e barras do navegador em Android e iOS reais ou emuladores. Registrar URL, viewport, captura, botão inacessível e passos.

**Corrigir:** identificar largura mínima, grid não responsiva, overflow, stacking, portal/modal, área segura, menus e barra fixa por componente. Usar layout fluido e overflow intencional em tabelas.

**Cascata:** validar navegação por toque/teclado, campos numéricos, dialogs, skeletons, estados de erro e impressão; páginas semelhantes que reutilizam cada componente.

**Saída:** nenhuma ação primária cortada/invisível, nenhum overflow horizontal da página sem propósito, entrada e salvamento completos em cada rota crítica e evidências antes/depois no checklist. Commit `fix(responsive): ...` na main.

### Onda 2 — proveniência TACO/B12 (U2)

**Reproduzir:** exportar em leitura os registros `foods` com `source='TACO'` e `vitamin_b12 IS NOT NULL`, IDs, nomes, valores, criação/atualização e origem de importação; confrontar amostra e total com a [TACO 4ª edição da UNICAMP](https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf), que lista B1, B2, B6, C, niacina e retinol, sem B12. Esta auditoria não teve dump do banco; **não inventar quantidade de alimentos afetados**.

**Corrigir:** preservar alimento TACO, mas remover B12 atribuída falsamente ou registrar proveniência separada por nutriente quando houver fonte secundária legítima; distinguir desconhecido de zero. Corrigir ETL, formulário/edição, detalhes, busca, agregados e exportações.

**Cascata:** recalcular totais de planos impactados em ambiente controlado, verificar outras colunas ausentes na TACO (como D/E/folato), interface de adequação e documentos; comunicar necessidade de revisão clínica de planos publicados.

**Saída:** consulta de auditoria retorna zero B12 sem fonte rastreável em itens TACO; casos de null/zero e origem mista testados; migração reversível e amostragem clínica aprovada. Commit na main.

**Auditoria da onda 2 (22/09/2026):** consulta direta ao banco vinculado encontrou 581 itens `reference_foods` TACO e zero valores não nulos em B12, D, E ou folato; a view `foods` confirma o mesmo. Foram encontrados 37 snapshots TACO em 5 planos, também sem B12/D. Portanto, o relato não foi reproduzido como valor de B12 atribuído a um alimento TACO no banco atual. A falha confirmada está na apresentação: o resumo de micronutrientes converte `NULL` em zero e exibe adequação calculada sobre cobertura incompleta. A [TACO 4ª edição da UNICAMP](https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf), quadro de vitaminas (p. 19), não inclui B12, D, E nem folato. Uma restrição no banco impede inserir esses valores em itens TACO sem alterar os 581 registros; a interface passa a identificar dado ausente e total parcial. Como os snapshots não continham esses valores e o plano não persiste totais de B12, não há recálculo numérico retroativo a aplicar. Revisão clínica de planos mistos continua recomendada antes de interpretar adequação.

### Onda 3 — Pollock 7 e composição corporal (U3)

**Reproduzir:** caso real com sete dobras em mm, sexo, idade na data, peso, densidade e Siri manual; mudar somente idade manual e observar recálculo.

**Corrigir:** dependência `manualAge`; unificar validação de dobras/sexo/idade, fórmula por sexo e faixa aplicável; corrigir instrução de Pollock 3 que diverge do motor; evitar `parseFloat` parcial e clamp 2–70% que pode esconder input incorreto.

**Cascata:** massa gorda/magra, Cunningham/Tinsley, gráficos, snapshots, histórico, PDFs e valores usados por metas.

**Saída:** casos de referência independentes para ambos os sexos, valores limite e edição reativa; valores existentes divergentes identificados para revisão, sem sobrescrita automática. Commit na main.

**Auditoria e implementação da onda 3 (22/09/2026):** as equações Pollock 7 existentes já tinham os coeficientes corretos, mas o formulário usava a idade na data atual, não recalculava ao alterar somente a idade manual e presumia a equação feminina quando o sexo faltava. O texto de Pollock 3 exigia dobras que não correspondiam às equações. Valores parcialmente numéricos eram aceitos e o percentual Siri era limitado silenciosamente entre 2% e 70%. Agora são exigidos sexo conhecido, idade inteira e dentro da faixa estudada (18–61 anos para homens; 18–55 para mulheres), todas as dobras aplicáveis positivas e peso válido. Idade e composição são derivados imediatamente da data/entradas atuais; Pollock 3 mostra os locais por sexo. Densidade, percentual, massas e proveniência da equação ficam juntos no resultado salvo. A leitura para Cunningham/Tinsley passa a usar a chave correta `body_fat_percent` e ignora valores Pollock antigos sem proveniência. Resultados anteriores continuam no histórico, mas a tela avisa que precisam de revisão profissional.

Consulta somente leitura ao banco vinculado: 4 registros Pollock 7 ativos, 1 com sexo feminino no perfil e 3 sem sexo. Nenhum continha idade/sexo da equação no snapshot. O registro feminino era comparável e diferiu 0,00 ponto percentual da recomputação pela data do registro; os outros 3 permanecem pendentes de confirmação clínica do sexo e das medidas. Nenhum registro foi sobrescrito. Referências das populações das equações: [Jackson & Pollock, homens (1978)](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/EAB21B1CF3A8360E5F5D43FDB8D4DD17/S0007114578000689a.pdf/div-class-title-generalized-equations-for-predicting-body-density-of-men-div.pdf) e [Jackson, Pollock & Ward, mulheres (1980)](https://pubmed.ncbi.nlm.nih.gov/7402053/). A planilha anexada não fornece as sete medidas do caso de divergência grande; reproduzi-lo continua pendente de dados completos.

### Onda 4 — fator de injúria e mobilidade (U4)

**Reproduzir:** matriz Harris acamado/ambulante × todos os fatores de `injury-factors.js`, FI=1, e protocolos não Harris. Comparar manualmente TMB, mobilidade, FI e GET; registrar convenção adotada pelo nutri.

**Corrigir:** regra de aplicabilidade aprovada por responsável clínico; valores/tabelas com fonte e versão; rótulos que tornem claro quando FI não participa.

**Cascata:** comparação de protocolos, persistência, recuperação de cálculo, meta VENTA, resumo do paciente e plano prescrito.

**Saída:** matriz reproduz os casos do CSV e o caso reclamado, ou diferença de convenção é explicitada; nenhum fator é aplicado em duplicidade/ignorado sem indicação. Commit na main.

### Onda 5 — Harris-Benedict e trilha do cálculo (U5)

**Reproduzir:** três pacientes da planilha, principalmente P3 L36, com valores brutos e fórmula termo a termo. Conferir `restoreEnergyBiometry`, `calculateHarrisBenedict`, `calculateEnergyPlan`, `saveEnergyCalculation` e snapshot salvo; comparar 1919 original com qualquer variante usada pelos nutricionistas.

**Corrigir:** campo/normalização, idade de referência ou coeficiente se prova apontar para isso; versionar mudança de equação.

**Cascata:** FI da onda 4, GET, VENTA, tela do paciente, meta do plano e cálculos antigos marcados para revisão.

**Saída:** P3 explicado e corrigido/justificado, P1/P2 sem regressão, decomposição exibida = resultado salvo. Commit na main.

### Onda 6 — micronutrientes e EER discrepantes (U6)

**Reproduzir:** P2/P3 micro linha a linha com `food_id`, fonte, valor/100 g, unidade, gramas convertidos e contribuição; reconciliar P1 EER 2005 com os dois nutricionistas e fonte oficial. Abrir plano com cache frio/quente e alternar para micronutrientes antes/depois do carregamento; registrar rede, tempo, falhas, estado exibido e se houve `document` reload ou apenas refetch React Query. Reproduzir `2,33333333333` em cada superfície de busca/seleção, inclusive valores grandes e entrada `pt-BR`.

**Corrigir:** conversão de medida sem heurística calórica, unidade e identidade do alimento, origem/forma de vitamina A, dados incorretos no banco; separar “não calculável” de zero. Corrigir EER apenas se reconstrução demonstrar erro do Nello. Carregar os alimentos antes de declarar o painel de micro pronto; falha parcial deve mostrar erro/tentar novamente, jamais painel vazio anunciado como resultado. Criar formatação numérica `pt-BR` compartilhada, no máximo duas casas nas superfícies pedidas, preservando precisão interna e distinção `NULL`/zero.

**Cascata:** totais diário/refeição, gráficos, adequação DRI, PDFs, clones de protocolo e planos existentes para revisão; busca, escolha e troca de alimento, medidas caseiras, rascunho salvo, consulta com cache, navegação e tela do paciente.

**Saída:** nove divergências >1 do quadro explicadas e validadas por nutris, EER 2005 documentado com insumos verificáveis; tolerâncias de arredondamento aprovadas. Em cache frio, lento e falha de rede, o painel de micro nunca informa falso vazio; valores aparecem sem F5 manual, com estado de carregamento/erro correto. `2,33333333333` aparece como `2,33` e milhar usa ponto em todas as superfícies de exibição auditadas; o valor bruto permanece íntegro no cálculo/salvamento. Commit na main.

### Onda 7 — importação íntegra de protocolos (I1)

**Corrigir:** `getFoodsMapByIds` propaga erro, pré-validação mostra IDs/nomes ausentes e impede confirmação até substituir/remover conscientemente; revalidar no momento de salvar. Não emitir sucesso antes do resultado; conferir cada retorno de `handleAddMeal`, rollback/compensação de importação múltipla e comportamento da clone RPC.

**Cascata:** totais, rascunho, plano confirmado, PDFs e alerta de revisão de planos afetados.

**Saída:** alimento excluído/inativo, falha de rede, RLS e falha no segundo item nunca deixam plano anunciado como importado integralmente com macros zerados. Commit na main.

### Onda 8 — entradas finitas e VENTA viável (I2)

**Corrigir:** repassar massa magra em `saveEnergyCalculation`; validar em toda fronteira de cálculo/persistência, inclusive entradas diretas e valores não finitos; criar classificação clínica de metas VENTA e confirmação explícita para faixas de risco, definida por nutricionistas, sem inventar um corte universal.

**Cascata:** resultados da antropometria, recomendação, estado de salvamento, snapshots e planos vinculados.

**Saída:** testes de vazio, string, vírgula decimal, `NaN`, `Infinity`, massa magra maior que peso e meta extrema; nenhuma persistência inválida. Commit na main.

### Onda 9 — geração e resposta dos check-ins (I3)

**Corrigir se não houver produtor implantado:** criar agendamento idempotente para `checkin_schedules` com fuso horário, recorrência, expiração e chave única; checar RLS, notificação em app e página de resposta já existente.

**Cascata:** histórico, adesão, streak, cancelamento, edição do template, duplicações e isolamento por paciente/episódio.

**Saída:** vincular agenda gera uma sessão na data certa, paciente responde uma vez, nutri vê resultado; retries não duplicam. Confirmar contagens no ambiente autorizado. Commit na main.

### Onda 10 — atomicidade de templates/refeições/receitas (I4)

**Corrigir:** RPCs transacionais para create/update de refeição e receita, autorização e validação no banco, erro completo propagado; auditar definição real das RPCs de dieta.

**Cascata:** ordenação, referências por `food_id`, rascunhos, importação, concorrência entre abas e recuperação após queda de rede.

**Saída:** injeção de falha entre delete/insert mantém estado anterior intacto; concorrência não mistura versões; testes de RLS. Commit de migração + cliente na main após gate.

### Onda 11 — erros observáveis e recuperáveis (I5)

**Corrigir:** revisar todos os `catch` e `{data,error}` do hub e do plano alimentar; estado de falha por seção, ação de tentar novamente, logging estruturado com código de correlação e mensagem compreensível. Instrumentar tempos de busca/plano por etapa; aplicar debounce, cancelamento/identificador da consulta mais recente e paginação no seletor de alimentos, corrigindo consultas/índices comprovadamente lentos.

**Cascata:** rede offline, sessão expirada, RLS, serviço indisponível, upload e falhas parciais, sem dados de saúde no log; digitação rápida, troca de filtro/fonte, mudança de paciente, múltiplas abas, cache e rede móvel lenta.

**Saída:** nenhum erro de query vira lista vazia ou sucesso; usuário sabe o que fazer e suporte identifica a causa técnica. Busca exibe apenas resultados do termo/filtro mais recente e as latências P50/P95 de busca e abertura do plano são medidas antes/depois sob as mesmas condições, com metas de desempenho registradas. Commit na main.

## 6. Gates de entrega contínua

1. Abrir registro da onda com caso reproduzível, IDs anonimizados, ambiente e evidência. Para dados clínicos, acesso mínimo; não copiar dados de paciente para fixtures públicas.
2. Escrever teste de regressão **que falha no comportamento anterior** para causa confirmada; para responsividade, evidência visual/manual de rotas e viewports. Testar unidade, integração e fluxo conforme o risco, não apenas snapshots de implementação.
3. Executar `npm run verify` e gates específicos de migração/segurança quando afetados. Comparar números independentes com insumos congelados, nunca apenas com o mesmo módulo usado para calcular no app.
4. Revisão de nutricionista para qualquer alteração de fórmula, fator, alimento, unidade, limite VENTA ou interpretação de micronutriente. Medir impacto em cálculos persistidos; sinalizar registros antigos para revisão em vez de alteração silenciosa.
5. Publicar com monitoramento de erro e capacidade de reversão. Marcar a onda concluída **somente após** validação dos efeitos cascata e então fazer o commit direto na main. Registrar SHA e data ao lado da onda; ondas ainda sem SHA estão abertas.

## 7. Referências e limites desta auditoria

- Evidência de usuário: `C:\Users\vinic\Downloads\Nello Calculos - Calculos.csv` e `.pdf`, além do relato posterior de carregamento, dízimas e lentidão; dados fornecidos pelo solicitante. Os anexos não contêm todos os insumos biométricos, IDs de alimentos, versão das fontes ou capturas/traços de rede do defeito de carregamento. A auditoria da onda 2 obteve consulta ao banco vinculado; as demais reproduções clínicas continuam pendentes.
- Fonte primária de composição: [NEPA/UNICAMP, TACO 4ª edição](https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf), seção de vitaminas e tabela centesimal. Ausência de B12 na TACO não prova que o alimento contenha zero B12.
- Referência institucional de EER 2005: [Health Canada, equações e PA por sexo](https://www.canada.ca/en/health-canada/services/food-nutrition/food-nutrition-surveillance/health-nutrition-surveys/canadian-community-health-survey-cchs/reference-guide-understanding-using-data-2015.html). Outras equações e faixas de aplicabilidade devem ser validadas por nutricionista antes de alterar a implementação.
- Principais arquivos rastreados: `src/components/anthropometry/AnthropometryForm.jsx`, `src/lib/utils/anthropometry-calculations.js`, `src/lib/utils/energy-calculations.js`, `src/lib/utils/energy-planning.js`, `src/lib/supabase/energy-queries.js`, `src/lib/constants/injury-factors.js`, `src/components/meal-plan/MicronutrientsCard.jsx`, `src/lib/supabase/meal-plan-queries.js`, `src/lib/supabase/template-queries.js`, `src/components/meal-plan/ImportMealFromProtocolDialog.jsx`, `src/components/meal-plan/MealPlanForm.jsx`, `src/hooks/useTemplateBuilder.js`, `src/hooks/useCheckins.js`, `src/pages/patient/CheckinResponsePage.jsx`, `src/pages/patient/PatientProgressPage.jsx`, `src/pages/patient/AddMealPage.jsx`, `src/pages/nutritionist/patients/FoodDiaryPage.jsx`.

**Pendências de evidência externa:** coletar 1–2 reproduções reais de smartphone por fluxo crítico; consulta somente leitura do banco para B12/TACO e sessões check-in; insumos completos de P3 Harris e dos quatro EER P1; caso de Pollock 7 e FI que divergiu fora da planilha. Essas pendências não impedem iniciar as ondas com defeitos de código já demonstrados.
