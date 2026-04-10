-- Fase 1: Correção de Schema (Urgente)
-- Execute no SQL Editor do Supabase

-- 1. Reload schema cache para corrigir erro 404
NOTIFY pgrst, 'reload schema';

-- 2. Verificar se tabelas existem
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'movimentacoes', 'materiais', 'organizations', 'empresas')
ORDER BY table_name;

-- 3. Verificar grants existentes para authenticated
SELECT table_name, privilege_type, grantee
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee = 'authenticated'
AND table_name IN ('profiles', 'movimentacoes', 'materiais', 'organizations', 'empresas')
ORDER BY table_name, privilege_type;

-- 4. Garantir grants para authenticated (se necessário)
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('profiles', 'movimentacoes', 'materiais', 'organizations', 'empresas')
    LOOP
        EXECUTE 'GRANT ALL ON ' || table_name || ' TO authenticated;';
        EXECUTE 'GRANT ALL ON ' || table_name || ' TO anon;';
        RAISE NOTICE 'Grants concedidos para tabela: %', table_name;
    END LOOP;
END $$;

-- 5. Verificar resultado final
SELECT 'Schema reload e grants aplicados com sucesso!' as status;
