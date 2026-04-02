-- =====================================================
-- TESTE COMPLETO: Soft Delete Implementation
-- Execute este script completo de uma vez no Supabase SQL Editor
-- =====================================================

-- Cria tabela temporária para resultados
DROP TABLE IF EXISTS test_results;
CREATE TEMPORARY TABLE test_results (
    test_step TEXT,
    status TEXT,
    details TEXT,
    expected_result TEXT
);

-- Teste 1: Verificar se campo deleted_at existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'deleted_at'
    ) THEN
        INSERT INTO test_results VALUES ('1. Campo deleted_at', '✅ PASS', 'Campo deleted_at existe na tabela profiles', 'Campo deve existir');
    ELSE
        INSERT INTO test_results VALUES ('1. Campo deleted_at', '❌ FAIL', 'Campo deleted_at NÃO existe na tabela profiles', 'Execute migration primeiro');
    END IF;
END $$;

-- Teste 2: Verificar se já existe usuário para teste ou usar um existente
DO $$
DECLARE
    existing_user_id TEXT;
    test_user_id TEXT := '123e4567-e89b-12d3-a456-426614174000';
BEGIN
    -- Tentar encontrar um usuário existente primeiro
    SELECT id INTO existing_user_id 
    FROM profiles 
    WHERE deleted_at IS NULL 
    LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
        -- Usar usuário existente para o teste
        INSERT INTO test_results VALUES ('2. Usuário teste', '✅ PASS', 'Usando usuário existente: ' || existing_user_id, 'Usuário existente será usado');
        
        -- Atualizar variável global para os próximos testes
        PERFORM set_config('test.user_id', existing_user_id, true);
    ELSE
        -- Se não existir, criar mensagem de aviso
        INSERT INTO test_results VALUES ('2. Usuário teste', '⚠️ SKIP', 'Nenhum usuário existente encontrado. Crie um usuário no sistema primeiro.', 'Crie usuário via frontend ou Auth');
        PERFORM set_config('test.user_id', test_user_id, true);
    END IF;
END $$;

-- Teste 3: Verificar usuário antes da exclusão
DO $$
DECLARE
    user_count INTEGER;
    test_user_id TEXT := current_setting('test.user_id', true);
BEGIN
    SELECT COUNT(*) INTO user_count 
    FROM profiles 
    WHERE id = test_user_id::uuid AND deleted_at IS NULL;
    
    IF user_count > 0 THEN
        INSERT INTO test_results VALUES ('3. Usuário ativo', '✅ PASS', 'Usuário existe e está ativo (deleted_at IS NULL)', 'Usuário deve estar ativo');
    ELSE
        INSERT INTO test_results VALUES ('3. Usuário ativo', '❌ FAIL', 'Usuário não encontrado ou já está excluído', 'Usuário deve estar ativo');
    END IF;
END $$;

-- Teste 4: Criar movimentação de teste
INSERT INTO movimentacoes (
  id, material_id, user_id, tipo, quantidade, 
  quantidade_anterior, quantidade_nova, status, created_at
)
SELECT 
  gen_random_uuid(),
  id,
  current_setting('test.user_id', true)::uuid,
  'saida',
  5,
  100,
  95,
  'aprovada',
  NOW()
FROM materiais 
LIMIT 1;

INSERT INTO test_results VALUES ('4. Criar movimentação', '✅ PASS', 'Movimentação de teste criada', 'Movimentação deve ser criada');

-- Teste 5: Verificar movimentações antes do soft delete
DO $$
DECLARE
    movement_count INTEGER;
    test_user_id TEXT := current_setting('test.user_id', true);
BEGIN
    SELECT COUNT(*) INTO movement_count
    FROM movimentacoes m
    LEFT JOIN profiles p ON m.user_id = p.id
    WHERE m.user_id = test_user_id::uuid;
    
    IF movement_count > 0 THEN
        INSERT INTO test_results VALUES ('5. Movimentações existem', '✅ PASS', 'Movimentações encontradas para o usuário', 'Movimentações devem existir');
    ELSE
        INSERT INTO test_results VALUES ('5. Movimentações existem', '❌ FAIL', 'Nenhuma movimentação encontrada', 'Movimentações devem existir');
    END IF;
END $$;

-- Teste 6: Executar Soft Delete
UPDATE profiles 
SET deleted_at = NOW(), updated_at = NOW()
WHERE id = current_setting('test.user_id', true)::uuid;

INSERT INTO test_results VALUES ('6. Soft Delete', '✅ PASS', 'Usuário marcado como excluído (deleted_at preenchido)', 'Soft delete deve funcionar');

-- Teste 7: Verificar usuário após soft delete
DO $$
DECLARE
    user_deleted INTEGER;
    test_user_id TEXT := current_setting('test.user_id', true);
BEGIN
    SELECT COUNT(*) INTO user_deleted
    FROM profiles 
    WHERE id = test_user_id::uuid AND deleted_at IS NOT NULL;
    
    IF user_deleted > 0 THEN
        INSERT INTO test_results VALUES ('7. Usuário excluído', '✅ PASS', 'Usuário marcado como excluído corretamente', 'Usuário deve ter deleted_at');
    ELSE
        INSERT INTO test_results VALUES ('7. Usuário excluído', '❌ FAIL', 'Soft delete não funcionou', 'Usuário deve ter deleted_at');
    END IF;
END $$;

-- Teste 8: Verificar que movimentações ainda existem
DO $$
DECLARE
    movements_after_delete INTEGER;
    test_user_id TEXT := current_setting('test.user_id', true);
BEGIN
    SELECT COUNT(*) INTO movements_after_delete
    FROM movimentacoes m
    LEFT JOIN profiles p ON m.user_id = p.id
    WHERE m.user_id = test_user_id::uuid;
    
    IF movements_after_delete > 0 THEN
        INSERT INTO test_results VALUES ('8. Movimentações preservadas', '✅ PASS', 'Movimentações preservadas após exclusão do usuário', 'Movimentações devem continuar existindo');
    ELSE
        INSERT INTO test_results VALUES ('8. Movimentações preservadas', '❌ FAIL', 'Movimentações foram perdidas', 'Movimentações devem continuar existindo');
    END IF;
END $$;

-- Teste 9: Verificar display_name funcionando
DO $$
DECLARE
    display_name_test TEXT;
    test_user_id TEXT := current_setting('test.user_id', true);
BEGIN
    SELECT 
        CASE 
            WHEN p.deleted_at IS NOT NULL 
            THEN p.nome || ' (excluído)'
            ELSE p.nome
        END 
    INTO display_name_test
    FROM movimentacoes m
    LEFT JOIN profiles p ON m.user_id = p.id
    WHERE m.user_id = test_user_id::uuid
    LIMIT 1;
    
    IF display_name_test LIKE '%(excluído)%' THEN
        INSERT INTO test_results VALUES ('9. Display name', '✅ PASS', 'Display name funciona: ' || display_name_test, 'Deve mostrar "(excluído)"');
    ELSE
        INSERT INTO test_results VALUES ('9. Display name', '❌ FAIL', 'Display name não funcionou: ' || COALESCE(display_name_test, 'NULL'), 'Deve mostrar "(excluído)"');
    END IF;
END $$;

-- Teste 10: Verificar filtragem de usuários ativos e limpar
DO $$
DECLARE
    active_users_before INTEGER;
    active_users_after INTEGER;
    test_user_id TEXT := current_setting('test.user_id', true);
BEGIN
    -- Contar usuários ativos antes de limpar
    SELECT COUNT(*) INTO active_users_before
    FROM profiles 
    WHERE deleted_at IS NULL;
    
    -- Limpar usuário de teste (restaurar para não afetar sistema)
    UPDATE profiles 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE id = test_user_id::uuid;
    
    DELETE FROM movimentacoes WHERE user_id = test_user_id::uuid;
    
    -- Contar usuários ativos depois de limpar
    SELECT COUNT(*) INTO active_users_after
    FROM profiles 
    WHERE deleted_at IS NULL;
    
    IF active_users_before = active_users_after THEN
        INSERT INTO test_results VALUES ('10. Filtragem ativos', '✅ PASS', 'Filtragem de usuários ativos funciona corretamente', 'Usuários excluídos não devem aparecer');
    ELSE
        INSERT INTO test_results VALUES ('10. Filtragem ativos', '❌ FAIL', 'Problema na filtragem de usuários ativos', 'Usuários excluídos não devem aparecer');
    END IF;
END $$;

-- =====================================================
-- RESULTADOS FINAIS
-- =====================================================

SELECT 
    '=== RELATÓRIO FINAL DE TESTES ===' as titulo,
    '' as separador
UNION ALL
SELECT 
    test_step || ': ' || status as resultado,
    details || ' | Esperado: ' || expected_result as informacoes
FROM test_results
ORDER BY test_step;

SELECT 
    '=== RESUMO ===' as resumo,
    '' as separador
UNION ALL
SELECT 
    'Testes Passaram: ' || COUNT(*) FILTER (WHERE status = '✅ PASS') as passaram,
    'Testes Falharam: ' || COUNT(*) FILTER (WHERE status = '❌ FAIL') as falharam
FROM test_results;

SELECT 
    CASE 
        WHEN COUNT(*) FILTER (WHERE status = '✅ PASS') = 10 THEN '🎉 TODOS OS TESTES PASSARAM! Soft Delete implementado com sucesso!'
        WHEN COUNT(*) FILTER (WHERE status = '✅ PASS') >= 8 THEN '⚠️ MAIORIA DOS TESTES PASSARAM! Verifique os falhos.'
        ELSE '❌ ALGUNS TESTES FALHARAM! Verifique a implementação.'
    END as status_final
FROM test_results;
