-- Script para verificar tabela organizations
-- Execute no SQL Editor do painel Supabase

-- Verificar estrutura da tabela organizations
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'organizations'
ORDER BY ordinal_position;

-- Verificar dados na tabela organizations
SELECT COUNT(*) as total_organizations,
       COUNT(CASE WHEN plan_type IS NOT NULL THEN 1 END) as with_plan_type
FROM organizations;

-- Verificar se há empresas padrão
SELECT * FROM organizations 
WHERE name = 'Empresa Padrão' OR name LIKE '%Padrão%';

-- Verificar relação com profiles
SELECT COUNT(*) as profiles_with_org,
       COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as with_org_id
FROM profiles;

-- Testar inserção manual
INSERT INTO organizations (name, plan_type, expires_at)
VALUES ('Teste Trigger', 'trial', NOW() + INTERVAL '15 days')
RETURNING id;
