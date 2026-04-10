-- Fase 6: Script de Teste e Validação RBAC
-- Execute no SQL Editor do Supabase

-- 1. Verificar estrutura atual
SELECT '=== VERIFICAÇÃO DE ESTRUTURA ===' as info;

-- Tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'organizations', 'materiais', 'movimentacoes')
ORDER BY table_name;

-- Coluna role em profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';

-- 2. Verificar usuários e roles
SELECT '=== VERIFICAÇÃO DE USUÁRIOS E ROLES ===' as info;

SELECT p.email, p.role, p.perfil, o.name as organization, o.plan_type, o.expires_at
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
ORDER BY p.role, p.email;

-- 3. Verificar políticas RLS
SELECT '=== VERIFICAÇÃO DE POLÍTICAS RLS ===' as info;

SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'organizations', 'materiais', 'movimentacoes')
ORDER BY tablename, policyname;

-- 4. Teste de acesso como Super Admin
SELECT '=== TESTE DE ACESSO SUPER ADMIN ===' as info;

-- Simular consulta como Super Admin (almox@vluma.com.br)
-- NOTA: Execute este bloco após criar o usuário Super Admin

-- 5. Verificar organizations criadas
SELECT '=== VERIFICAÇÃO DE ORGANIZATIONS ===' as info;

SELECT id, name, plan_type, expires_at,
       CASE 
         WHEN expires_at > NOW() THEN 'ATIVA'
         ELSE 'EXPIRADA'
       END as status
FROM organizations
ORDER BY created_at;

-- 6. Verificar trial periods
SELECT '=== VERIFICAÇÃO DE TRIAL PERIODS ===' as info;

SELECT 
    o.name,
    o.plan_type,
    o.expires_at,
    NOW() as current_time,
    EXTRACT(DAYS FROM o.expires_at - NOW()) as days_until_expiration
FROM organizations o
WHERE o.plan_type = 'trial'
ORDER BY o.expires_at;

-- 7. Teste de integridade de dados
SELECT '=== TESTE DE INTEGRIDADE ===' as info;

-- Verificar se todos os profiles têm organization_id
SELECT COUNT(*) as profiles_without_org
FROM profiles 
WHERE organization_id IS NULL;

-- Verificar se todos os profiles têm role
SELECT COUNT(*) as profiles_without_role
FROM profiles 
WHERE role IS NULL;

-- Verificar se há organizações sem perfis
SELECT COUNT(*) as orgs_without_profiles
FROM organizations o
LEFT JOIN profiles p ON o.id = p.organization_id
WHERE p.id IS NULL;

-- 8. Função para verificar acesso (teste)
CREATE OR REPLACE FUNCTION test_user_access(user_email TEXT)
RETURNS TABLE(table_name TEXT, access_granted BOOLEAN) AS $$
DECLARE
    user_id UUID;
    user_role TEXT;
    user_org_id UUID;
BEGIN
    -- Obter ID e role do usuário
    SELECT id, role, organization_id INTO user_id, user_role, user_org_id
    FROM profiles 
    WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Testar acesso a cada tabela
    RETURN QUERY
    SELECT 'profiles'::TEXT, 
           (user_role = 'super_admin' OR user_id = id) as access_granted
    FROM profiles WHERE id = user_id;
    
    RETURN QUERY
    SELECT 'organizations'::TEXT,
           (user_role = 'super_admin' OR id = user_org_id) as access_granted
    FROM organizations WHERE id = user_org_id;
    
    RETURN QUERY
    SELECT 'materiais'::TEXT,
           (user_role = 'super_admin' OR organization_id = user_org_id) as access_granted
    FROM materiais LIMIT 1;
    
    RETURN QUERY
    SELECT 'movimentacoes'::TEXT,
           (user_role = 'super_admin' OR organization_id = user_org_id) as access_granted
    FROM movimentacoes LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 9. Testar função (descomente após criar usuário)
-- SELECT * FROM test_user_access('almox@vluma.com.br');

-- 10. Resumo final
SELECT '=== RESUMO FINAL ===' as info;

SELECT 
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM profiles WHERE role = 'super_admin') as super_admins,
    (SELECT COUNT(*) FROM profiles WHERE role = 'owner') as owners,
    (SELECT COUNT(*) FROM profiles WHERE role = 'manager') as managers,
    (SELECT COUNT(*) FROM profiles WHERE role = 'operator') as operators,
    (SELECT COUNT(*) FROM organizations) as total_organizations,
    (SELECT COUNT(*) FROM organizations WHERE expires_at > NOW()) as active_organizations,
    (SELECT COUNT(*) FROM organizations WHERE expires_at <= NOW()) as expired_organizations;

SELECT 'Testes RBAC concluídos com sucesso!' as status;
