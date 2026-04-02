-- EMERGENCY RECOVERY: Verificar movimentações existentes
-- Execute este script para verificar o estado atual

-- Verificar todas as movimentações por usuário
SELECT 
    p.nome as usuario,
    p.email,
    COUNT(m.id) as total_movimentacoes,
    MAX(m.created_at) as ultima_movimentacao
FROM profiles p
LEFT JOIN movimentacoes m ON p.id = m.user_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.nome, p.email
ORDER BY p.nome;

-- Verificar movimentações recentes (últimas 24h)
SELECT 
    m.id,
    m.tipo,
    m.quantidade,
    m.created_at,
    p.nome as usuario,
    mat.nome as material
FROM movimentacoes m
JOIN profiles p ON m.user_id = p.id
JOIN materiais mat ON m.material_id = mat.id
WHERE m.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY m.created_at DESC;
