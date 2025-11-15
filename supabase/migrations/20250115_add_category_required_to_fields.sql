-- Adicionar coluna de categoria e obrigatório aos campos
ALTER TABLE anamnese_fields
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'geral',
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT false;

-- Comentários para documentação
COMMENT ON COLUMN anamnese_fields.category IS 'Categoria da pergunta: identificacao, historico_clinico, historico_familiar, habitos_vida, objetivos, habitos_alimentares, geral';
COMMENT ON COLUMN anamnese_fields.is_required IS 'Indica se o campo é obrigatório no preenchimento';

-- Índice para melhorar busca por categoria
CREATE INDEX IF NOT EXISTS idx_anamnese_fields_category ON anamnese_fields(category);
