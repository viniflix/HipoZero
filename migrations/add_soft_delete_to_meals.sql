-- =====================================================
-- SOFT DELETE PARA MEALS
-- Adiciona suporte a soft delete para auditoria completa
-- =====================================================

-- Adicionar coluna deleted_at
ALTER TABLE meals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Índice para performance em queries que filtram deleted
CREATE INDEX IF NOT EXISTS idx_meals_deleted_at ON meals(deleted_at) WHERE deleted_at IS NULL;

-- Comentário
COMMENT ON COLUMN meals.deleted_at IS 'Timestamp de quando a refeição foi deletada (soft delete). NULL = ativa, NOT NULL = deletada';

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS EXISTENTES
-- =====================================================

-- Drop das políticas antigas para recriar com filtro de soft delete
DROP POLICY IF EXISTS "Users can view their own meals" ON meals;
DROP POLICY IF EXISTS "Users can insert their own meals" ON meals;
DROP POLICY IF EXISTS "Users can update their own meals" ON meals;
DROP POLICY IF EXISTS "Users can delete their own meals" ON meals;
DROP POLICY IF EXISTS "Nutritionists can view their patients meals" ON meals;

-- Recriar políticas com filtro de soft delete

-- Pacientes veem apenas suas refeições não deletadas
CREATE POLICY "Users can view their own meals"
ON meals
FOR SELECT
USING (
    patient_id = auth.uid()
    AND deleted_at IS NULL
);

-- Nutricionistas veem refeições não deletadas de seus pacientes
CREATE POLICY "Nutritionists can view their patients meals"
ON meals
FOR SELECT
USING (
    deleted_at IS NULL
    AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = meals.patient_id
        AND nutritionist_id = auth.uid()
    )
);

-- Pacientes podem inserir suas próprias refeições
CREATE POLICY "Users can insert their own meals"
ON meals
FOR INSERT
WITH CHECK (patient_id = auth.uid());

-- Pacientes podem atualizar suas próprias refeições não deletadas
CREATE POLICY "Users can update their own meals"
ON meals
FOR UPDATE
USING (
    patient_id = auth.uid()
    AND deleted_at IS NULL
);

-- Pacientes podem "deletar" (soft delete) suas próprias refeições
CREATE POLICY "Users can delete their own meals"
ON meals
FOR UPDATE
USING (patient_id = auth.uid());

-- =====================================================
-- FUNÇÃO PARA SOFT DELETE
-- =====================================================

CREATE OR REPLACE FUNCTION soft_delete_meal(p_meal_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE meals
    SET deleted_at = NOW()
    WHERE id = p_meal_id
    AND deleted_at IS NULL;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION soft_delete_meal IS 'Marca uma refeição como deletada (soft delete) ao invés de remover do banco';
