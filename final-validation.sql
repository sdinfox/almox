-- VALIDAÇÃO FINAL: Soft Delete Implementation
-- Execute após testar no frontend

-- 1. Verificar usuários excluídos
SELECT 
    COUNT(*) FILTER (WHERE deleted_at IS NULL) as usuarios_ativos,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as usuarios_excluidos
FROM profiles;

-- 2. Verificar movimentações de usuários excluídos
SELECT 
    p.nome || ' (excluído)' as usuario,
    COUNT(m.id) as movimentacoes_preservadas,
    MAX(m.created_at) as ultima_movimentacao
FROM profiles p
JOIN movimentacoes m ON p.id = m.user_id
WHERE p.deleted_at IS NOT NULL
GROUP BY p.id, p.nome
ORDER BY p.nome;

-- 3. Verificar display_name funcionando
SELECT 
    CASE 
        WHEN p.deleted_at IS NOT NULL 
        THEN p.nome || ' (excluído)'
        ELSE p.nome
    END as display_name,
    COUNT(m.id) as total_movimentacoes
FROM profiles p
LEFT JOIN movimentacoes m ON p.id = m.user_id
GROUP BY p.id, p.nome, p.deleted_at
ORDER BY p.deleted_at NULLS LAST, p.nome;
