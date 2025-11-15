-- Verificar se a tabela anamnese_field_options existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'anamnese_field_options';

-- Ver estrutura da tabela se existir
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'anamnese_field_options';
