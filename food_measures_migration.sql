-- =====================================================
-- Criação da Tabela food_measures
-- Medidas caseiras específicas para cada alimento
-- =====================================================

-- Criar a tabela
CREATE TABLE IF NOT EXISTS "public"."food_measures" (
    "id" bigint NOT NULL,
    "food_id" bigint NOT NULL,
    "measure_label" text NOT NULL,
    "quantity_grams" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Definir owner
ALTER TABLE "public"."food_measures" OWNER TO "postgres";

-- Comentário da tabela
COMMENT ON TABLE "public"."food_measures" IS 'Medidas caseiras específicas para cada alimento (ex: "1 Colher de Sopa de Arroz = 15g")';

-- Criar sequência para ID
CREATE SEQUENCE IF NOT EXISTS "public"."food_measures_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."food_measures_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."food_measures_id_seq" OWNED BY "public"."food_measures"."id";

-- Configurar ID como IDENTITY
ALTER TABLE ONLY "public"."food_measures" 
    ALTER COLUMN "id" SET DEFAULT nextval('"public"."food_measures_id_seq"'::regclass);

-- Primary Key
ALTER TABLE ONLY "public"."food_measures"
    ADD CONSTRAINT "food_measures_pkey" PRIMARY KEY ("id");

-- Foreign Key para foods (com ON DELETE CASCADE)
ALTER TABLE ONLY "public"."food_measures"
    ADD CONSTRAINT "food_measures_food_id_fkey" 
    FOREIGN KEY ("food_id") 
    REFERENCES "public"."foods"("id") 
    ON DELETE CASCADE;

-- Índice para busca rápida por food_id
CREATE INDEX IF NOT EXISTS "idx_food_measures_food_id" 
    ON "public"."food_measures" 
    USING btree ("food_id");

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE "public"."food_measures" ENABLE ROW LEVEL SECURITY;

-- Política de Leitura (SELECT): Todos os usuários autenticados podem ler
CREATE POLICY "Authenticated users can view food measures"
    ON "public"."food_measures"
    FOR SELECT
    TO authenticated
    USING (true);

-- Política de Escrita (INSERT): Apenas nutricionistas podem inserir
CREATE POLICY "Nutritionists can insert food measures"
    ON "public"."food_measures"
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM "public"."user_profiles"
            WHERE (
                "user_profiles"."id" = auth.uid()
                AND "user_profiles"."user_type" = 'nutritionist'
            )
        )
    );

-- Política de Atualização (UPDATE): Apenas nutricionistas podem atualizar
CREATE POLICY "Nutritionists can update food measures"
    ON "public"."food_measures"
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM "public"."user_profiles"
            WHERE (
                "user_profiles"."id" = auth.uid()
                AND "user_profiles"."user_type" = 'nutritionist'
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM "public"."user_profiles"
            WHERE (
                "user_profiles"."id" = auth.uid()
                AND "user_profiles"."user_type" = 'nutritionist'
            )
        )
    );

-- Política de Exclusão (DELETE): Apenas nutricionistas podem deletar
CREATE POLICY "Nutritionists can delete food measures"
    ON "public"."food_measures"
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM "public"."user_profiles"
            WHERE (
                "user_profiles"."id" = auth.uid()
                AND "user_profiles"."user_type" = 'nutritionist'
            )
        )
    );

-- =====================================================
-- Grants
-- =====================================================

GRANT ALL ON TABLE "public"."food_measures" TO "anon";
GRANT ALL ON TABLE "public"."food_measures" TO "authenticated";
GRANT ALL ON TABLE "public"."food_measures" TO "service_role";

GRANT ALL ON SEQUENCE "public"."food_measures_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."food_measures_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."food_measures_id_seq" TO "service_role";


