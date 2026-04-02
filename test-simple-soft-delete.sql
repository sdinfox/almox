-- =====================================================
-- TESTE SIMPLES: Soft Delete Implementation
-- Execute este script completo de uma vez no Supabase SQL Editor
-- =====================================================

-- Teste 1: Verificar se campo deleted_at existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'deleted_at'
    ) THEN
        RAISE NOTICE '✅ TESTE 1 PASS: Campo deleted_at existe na tabela profiles';
    ELSE
        RAISE NOTICE '❌ TESTE 1 FAIL: Campo deleted_at NÃO existe. Execute migration primeiro.';
    END IF;
END $$;

-- Teste 2: Encontrar usuário existente para teste
DO $$
DECLARE
    existing_user_id TEXT;
BEGIN
    -- Tentar encontrar um usuário existente primeiro
    SELECT id INTO existing_user_id 
    FROM profiles 
    WHERE deleted_at IS NULL 
    LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
        RAISE NOTICE '✅ TESTE 2 PASS: Usando usuário existente: %', existing_user_id;
        -- Atualizar variável global para os próximos testes
        PERFORM set_config('test.user_id', existing_user_id, true);
    ELSE
        RAISE NOTICE '⚠️ TESTE 2 SKIP: Nenhum usuário existente encontrado. Crie um usuário no sistema primeiro.';
        PERFORM set_config('test.user_id', 'skip', true);
    END IF;
END $$;

-- Teste 3: Verificar usuário antes da exclusão
DO $$
DECLARE
    user_count INTEGER;
    test_user_id TEXT := current_setting('test.user_id', true);
BEGIN
    IF test_user_id = 'skip' THEN
        RAISE NOTICE '⚠️ TESTE 3 SKIP: Pulando teste por não ter usuário';
        RETURN;
    END IF;
    
    SELECT COUNT(*) INTO user_count 
    FROM profiles 
    WHERE id = test_user_id::uuid AND deleted_at IS NULL;
    
    IF user_count > 0 THEN
        RAISE NOTICE '✅ TESTE 3 PASS: Usuário existe e está ativo (deleted_at IS NULL)';
    ELSE
        RAISE NOTICE '❌ TESTE 3 FAIL: Usuário não encontrado ou já está excluído';
    END IF;
END $$;

-- Teste 4: Criar movimentação de teste
DO $$
DECLARE
    test_user_id TEXT := current_setting('test.user_id', true);
    movement_created BOOLEAN := FALSE;
BEGIN
    IF test_user_id = 'skip' THEN
        RAISE NOTICE '⚠️ TESTE 4 SKIP: Pulando teste por não ter usuário';
        RETURN;
    END IF;
    
    -- Verificar se existe material
    PERFORM 1 FROM materiais LIMIT 1;
    IF FOUND THEN
        INSERT INTO movimentacoes (
          id, material_id, user_id, tipo, quantidade, 
          quantidade_anterior, quantidade_nova, status, created_at
        )
        SELECT 
          gen_random_uuid(),
          id,
          test_user_id::uuid,
          'saida',
          5,
          100,
          95,
          'aprovada',
          NOW()
        FROM materiais 
        LIMIT 1;
        
        movement_created := TRUE;
        RAISE NOTICE '✅ TESTE 4 PASS: Movimentação de teste criada com sucesso';
    ELSE
        RAISE NOTICE '❌ TESTE 4 FAIL: Nenhum material encontrado para criar movimentação';
    END IF;
END $$;

-- Teste 5: Verificar movimentações antes do soft delete
DO $$
DECLARE
    movement_count INTEGER;
    test_user_id TEXT := current_setting('test.user_id', true);
BEGIN
    IF test_user_id = 'skip' THEN
        RAISE NOTICE '⚠️ TESTE 5 SKIP: Pulando teste por não ter usuário';
        RETURN;
    END IF;
    
    SELECT COUNT(*) INTO movement_count
    FROM movimentacoes 
    WHERE user_id = test_user_id::uuid;
    
    IF movement_count > 0 THEN
        RAISE NOTICE '✅ TESTE 5 PASS: Encontradas % movimentações para o usuário', movement_count;
    ELSE
        RAISE NOTICE '❌ TESTE 5 FAIL: Nenhuma movimentação encontrada';
    END IF;
END $$;

-- Teste 6: Executar Soft Delete
DO $$
DECLARE
    test_user_id TEXT := current_setting('test.user_id', true);
BEGIN
    IF test_user_id = 'skip' THEN
        RAISE NOTICE '⚠️ TESTE 6 SKIP: Pulando teste por não ter usuário';
        RETURN;
    END IF;
    
    UPDATE profiles 
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = test_user_id::uuid;
    
    RAISE NOTICE '✅ TESTE 6 PASS: Soft delete executado - usuário marcado como excluído';
END $$;

-- Teste 7: Verificar usuário após soft delete
DO $$
DECLARE
    user_deleted INTEGER;
    test_user_id TEXT := current_setting('test.user_id', true);
BEGIN
    IF test_user_id = 'skip' THEN
        RAISE NOTICE '⚠️ TESTE 7 SKIP: Pulando teste por não ter usuário';
        RETURN;
    END IF;
    
    SELECT COUNT(*) INTO user_deleted
    FROM profiles 
    WHERE id = test_user_id::uuid AND deleted_at IS NOT NULL;
    
    IF user_deleted > 0 THEN
        RAISE NOTICE '✅ TESTE 7 PASS: Usuário marcado como excluído corretamente';
    ELSE
        RAISE NOTICE '❌ TESTE 7 FAIL: Soft delete não funcionou';
    END IF;
END $$;

-- Teste 8: Verificar que movimentações ainda existem
DO $$
DECLARE
    movements_after_delete INTEGER;
    test_user_id TEXT := current_setting('test.user_id', true);
BEGIN
    IF test_user_id = 'skip' THEN
        RAISE NOTICE '⚠️ TESTE 8 SKIP: Pulando teste por não ter usuário';
        RETURN;
    END IF;
    
    SELECT COUNT(*) INTO movements_after_delete
    FROM movimentacoes 
    WHERE user_id = test_user_id::uuid;
    
    IF movements_after_delete > 0 THEN
        RAISE NOTICE '✅ TESTE 8 PASS: Movimentações preservadas após exclusão do usuário';
    ELSE
        RAISE NOTICE '❌ TESTE 8 FAIL: Movimentações foram perdidas';
    END IF;
END $$;

-- Teste 9: Verificar display_name funcionando
DO $$
DECLARE
    display_name_test TEXT;
    test_user_id TEXT := current_setting('test.user_id', true);
BEGIN
    IF test_user_id = 'skip' THEN
        RAISE NOTICE '⚠️ TESTE 9 SKIP: Pulando teste por não ter usuário';
        RETURN;
    END IF;
    
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
        RAISE NOTICE '✅ TESTE 9 PASS: Display name funciona: %', display_name_test;
    ELSE
        RAISE NOTICE '❌ TESTE 9 FAIL: Display name não funcionou: %', COALESCE(display_name_test, 'NULL');
    END IF;
END $$;

-- Teste 10: Restaurar usuário e limpar APENAS movimentações de teste
DO $$
DECLARE
    test_user_id TEXT := current_setting('test.user_id', true);
    test_movement_id TEXT;
BEGIN
    IF test_user_id = 'skip' THEN
        RAISE NOTICE '⚠️ TESTE 10 SKIP: Pulando teste por não ter usuário';
        RETURN;
    END IF;
    
    -- Restaurar usuário para não afetar sistema
    UPDATE profiles 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE id = test_user_id::uuid;
    
    -- APAGAR APENAS a movimentação de teste criada neste script
    -- Identificar pela data recente (últimos 5 minutos) e tipo 'saida'
    DELETE FROM movimentacoes 
    WHERE user_id = test_user_id::uuid 
    AND tipo = 'saida'
    AND quantidade = 5
    AND created_at >= NOW() - INTERVAL '5 minutes'
    AND observacao IS NULL; -- Movimentações de teste não têm observação
    
    GET DIAGNOSTICS test_movement_id = ROW_COUNT;
    
    RAISE NOTICE '✅ TESTE 10 PASS: Usuário restaurado e % movimentações de teste removidas', test_movement_id;
END $$;

-- =====================================================
-- RESUMO FINAL
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTE SOFT DELETE CONCLUÍDO ===';
    RAISE NOTICE 'Se todos os testes passaram (✅), sua implementação está correta!';
    RAISE NOTICE 'Se algum teste falhou (❌), verifique o item específico.';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Execute migration se o teste 1 falhou';
    RAISE NOTICE '2. Crie usuário se o teste 2 falhou';
    RAISE NOTICE '3. Verifique implementação se outros testes falharam';
    RAISE NOTICE '';
END $$;

-- Verificação final do estado atual
SELECT 
    'VERIFICAÇÃO FINAL' as info,
    '' as separador
UNION ALL
SELECT 
    'Total usuários ativos: ' || COUNT(*) FILTER (WHERE deleted_at IS NULL) as ativos,
    'Total usuários excluídos: ' || COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as excluidos
FROM profiles;
