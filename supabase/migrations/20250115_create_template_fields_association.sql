-- Criar tabela de associação entre templates personalizados e campos
CREATE TABLE IF NOT EXISTS anamnesis_template_fields (
    id BIGSERIAL PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES anamnesis_templates(id) ON DELETE CASCADE,
    field_id BIGINT NOT NULL REFERENCES anamnese_fields(id) ON DELETE CASCADE,
    field_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id, field_id)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_template_fields_template_id ON anamnesis_template_fields(template_id);
CREATE INDEX IF NOT EXISTS idx_template_fields_field_id ON anamnesis_template_fields(field_id);

-- Adicionar políticas RLS
ALTER TABLE anamnesis_template_fields ENABLE ROW LEVEL SECURITY;

-- Política: Nutricionistas podem ver associações dos seus templates
CREATE POLICY "Nutricionistas podem ver associações dos seus templates"
ON anamnesis_template_fields FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM anamnesis_templates
        WHERE anamnesis_templates.id = anamnesis_template_fields.template_id
        AND anamnesis_templates.nutritionist_id = auth.uid()
    )
);

-- Política: Nutricionistas podem inserir associações nos seus templates
CREATE POLICY "Nutricionistas podem inserir associações nos seus templates"
ON anamnesis_template_fields FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM anamnesis_templates
        WHERE anamnesis_templates.id = anamnesis_template_fields.template_id
        AND anamnesis_templates.nutritionist_id = auth.uid()
    )
);

-- Política: Nutricionistas podem deletar associações dos seus templates
CREATE POLICY "Nutricionistas podem deletar associações dos seus templates"
ON anamnesis_template_fields FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM anamnesis_templates
        WHERE anamnesis_templates.id = anamnesis_template_fields.template_id
        AND anamnesis_templates.nutritionist_id = auth.uid()
    )
);
