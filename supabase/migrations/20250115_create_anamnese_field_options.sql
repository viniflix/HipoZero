-- Criar tabela para armazenar opções de campos de seleção
CREATE TABLE IF NOT EXISTS anamnese_field_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id UUID NOT NULL REFERENCES anamnese_fields(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_field_options_field_id ON anamnese_field_options(field_id);

-- Adicionar políticas RLS
ALTER TABLE anamnese_field_options ENABLE ROW LEVEL SECURITY;

-- Política: Nutricionistas podem ver opções dos seus próprios campos
CREATE POLICY "Nutricionistas podem ver opções dos seus campos"
ON anamnese_field_options FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM anamnese_fields
        WHERE anamnese_fields.id = anamnese_field_options.field_id
        AND anamnese_fields.nutritionist_id = auth.uid()
    )
);

-- Política: Nutricionistas podem inserir opções nos seus campos
CREATE POLICY "Nutricionistas podem inserir opções nos seus campos"
ON anamnese_field_options FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM anamnese_fields
        WHERE anamnese_fields.id = anamnese_field_options.field_id
        AND anamnese_fields.nutritionist_id = auth.uid()
    )
);

-- Política: Nutricionistas podem atualizar opções dos seus campos
CREATE POLICY "Nutricionistas podem atualizar opções dos seus campos"
ON anamnese_field_options FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM anamnese_fields
        WHERE anamnese_fields.id = anamnese_field_options.field_id
        AND anamnese_fields.nutritionist_id = auth.uid()
    )
);

-- Política: Nutricionistas podem deletar opções dos seus campos
CREATE POLICY "Nutricionistas podem deletar opções dos seus campos"
ON anamnese_field_options FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM anamnese_fields
        WHERE anamnese_fields.id = anamnese_field_options.field_id
        AND anamnese_fields.nutritionist_id = auth.uid()
    )
);
