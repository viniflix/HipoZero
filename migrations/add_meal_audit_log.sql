-- =====================================================
-- MEAL AUDIT LOG
-- Sistema de auditoria para ações CRUD em refeições
-- =====================================================

-- Criar tabela de auditoria
CREATE TABLE IF NOT EXISTS meal_audit_log (
    id BIGSERIAL PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_id BIGINT REFERENCES meals(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    meal_type TEXT,
    meal_date DATE,
    meal_time TIME,
    details JSONB, -- Detalhes adicionais (alimentos, alterações, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX idx_meal_audit_patient ON meal_audit_log(patient_id);
CREATE INDEX idx_meal_audit_meal ON meal_audit_log(meal_id);
CREATE INDEX idx_meal_audit_created ON meal_audit_log(created_at DESC);
CREATE INDEX idx_meal_audit_action ON meal_audit_log(action);

-- RLS (Row Level Security)
ALTER TABLE meal_audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Nutricionistas podem ver auditoria de seus pacientes
CREATE POLICY "Nutritionists can view their patients audit logs"
ON meal_audit_log
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = meal_audit_log.patient_id
        AND nutritionist_id = auth.uid()
    )
);

-- Pacientes podem ver seu próprio log
CREATE POLICY "Patients can view their own audit logs"
ON meal_audit_log
FOR SELECT
USING (patient_id = auth.uid());

-- Sistema pode inserir
CREATE POLICY "System can insert audit logs"
ON meal_audit_log
FOR INSERT
WITH CHECK (true);

-- Comentários
COMMENT ON TABLE meal_audit_log IS 'Log de auditoria de ações CRUD em refeições dos pacientes';
COMMENT ON COLUMN meal_audit_log.action IS 'Tipo de ação: create, update, delete';
COMMENT ON COLUMN meal_audit_log.details IS 'JSON com detalhes da ação (alimentos, mudanças, etc.)';
COMMENT ON COLUMN meal_audit_log.meal_id IS 'ID da refeição (NULL se foi deletada)';

-- =====================================================
-- FUNÇÃO HELPER PARA REGISTRAR AÇÕES
-- =====================================================

CREATE OR REPLACE FUNCTION log_meal_action(
    p_patient_id UUID,
    p_meal_id BIGINT,
    p_action TEXT,
    p_meal_type TEXT DEFAULT NULL,
    p_meal_date DATE DEFAULT NULL,
    p_meal_time TIME DEFAULT NULL,
    p_details JSONB DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
    v_log_id BIGINT;
BEGIN
    INSERT INTO meal_audit_log (
        patient_id,
        meal_id,
        action,
        meal_type,
        meal_date,
        meal_time,
        details
    ) VALUES (
        p_patient_id,
        p_meal_id,
        p_action,
        p_meal_type,
        p_meal_date,
        p_meal_time,
        p_details
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_meal_action IS 'Função helper para registrar ações de auditoria em refeições';
