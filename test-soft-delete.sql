-- Script de Teste: Soft Delete Implementation
-- Execute este script no Supabase SQL Editor para testar a implementação

-- 1. Verificar se a migration foi aplicada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'deleted_at';

-- 2. Criar usuário de teste com UUID válido
INSERT INTO profiles (id, email, nome, perfil, created_at, updated_at)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'test@excluded.com',
  'Usuário Teste Exclusão',
  'retirada',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Verificar usuário antes da exclusão
SELECT id, nome, email, deleted_at 
FROM profiles 
WHERE email = 'test@excluded.com';

-- 4. Criar movimentações de teste para este usuário
INSERT INTO movimentacoes (
  id, material_id, user_id, tipo, quantidade, 
  quantidade_anterior, quantidade_nova, status, created_at
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM materiais LIMIT 1), -- Pega primeiro material disponível
  '123e4567-e89b-12d3-a456-426614174000',
  'saida',
  5,
  100,
  95,
  'aprovada',
  NOW()
);

-- 5. Verificar movimentações criadas
SELECT 
  m.id,
  m.user_id,
  m.tipo,
  m.quantidade,
  p.nome as user_nome,
  p.email as user_email,
  p.deleted_at
FROM movimentacoes m
LEFT JOIN profiles p ON m.user_id = p.id
WHERE m.user_id = '123e4567-e89b-12d3-a456-426614174000';

-- 6. Simular Soft Delete (marcar usuário como excluído)
UPDATE profiles 
SET deleted_at = NOW(), updated_at = NOW()
WHERE id = '123e4567-e89b-12d3-a456-426614174000';

-- 7. Verificar usuário após soft delete
SELECT id, nome, email, deleted_at 
FROM profiles 
WHERE email = 'test@excluded.com';

-- 8. Verificar que movimentações ainda existem com dados do usuário
SELECT 
  m.id,
  m.user_id,
  m.tipo,
  m.quantidade,
  p.nome as user_nome,
  p.email as user_email,
  p.deleted_at,
  CASE 
    WHEN p.deleted_at IS NOT NULL 
    THEN p.nome || ' (excluído)'
    ELSE p.nome
  END as display_name
FROM movimentacoes m
LEFT JOIN profiles p ON m.user_id = p.id
WHERE m.user_id = '123e4567-e89b-12d3-a456-426614174000';

-- 9. Verificar que usuário não aparece em listagens normais
SELECT COUNT(*) as active_users
FROM profiles 
WHERE deleted_at IS NULL;

-- 10. Limpar dados de teste (opcional)
-- DELETE FROM movimentacoes WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';
-- DELETE FROM profiles WHERE id = '123e4567-e89b-12d3-a456-426614174000';

SELECT 'Teste concluído! Verifique os resultados acima.' as status;
