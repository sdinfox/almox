-- Fase 3: Criação do Usuário Mestre (Super Admin)
-- Execute no SQL Editor do Supabase

-- 1. Criar organização para o Super Admin (se não existir)
INSERT INTO organizations (name, plan_type, expires_at)
VALUES ('VLuma Corporation', 'enterprise', '2099-12-31')
ON CONFLICT (name) DO UPDATE SET
  plan_type = EXCLUDED.plan_type,
  expires_at = EXCLUDED.expires_at
RETURNING id as org_id;

-- 2. Criar usuário Super Admin via Admin API
-- NOTA: Esta parte precisa ser executada via API ou manualmente no painel
-- Email: almox@vluma.com.br
-- Senha: Definir senha segura

-- 3. Após criar o usuário, obter o ID e atualizar o perfil
-- (Execute este passo após criar o usuário no painel)

-- 4. Atualizar perfil para Super Admin
UPDATE profiles 
SET 
    role = 'super_admin',
    perfil = 'admin',
    organization_id = (SELECT id FROM organizations WHERE name = 'VLuma Corporation')
WHERE email = 'almox@vluma.com.br';

-- 5. Se o usuário não existir ainda, criar perfil manual
INSERT INTO profiles (id, email, nome, role, perfil, organization_id)
SELECT 
    u.id,
    u.email,
    'Super Admin',
    'super_admin',
    'admin',
    o.id
FROM auth.users u
CROSS JOIN organizations o
WHERE u.email = 'almox@vluma.com.br'
AND o.name = 'VLuma Corporation'
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    perfil = EXCLUDED.perfil,
    organization_id = EXCLUDED.organization_id;

-- 6. Verificar criação
SELECT p.email, p.role, p.perfil, o.name as organization, o.plan_type
FROM profiles p
JOIN organizations o ON p.organization_id = o.id
WHERE p.email = 'almox@vluma.com.br';

-- 7. Criar usuário de teste (se necessário para testes)
-- INSERT INTO auth.users (email, password_hash, email_confirmed_at)
-- VALUES ('test@vluma.com.br', 'hash_temporario', NOW());

-- 8. Atualizar perfil de teste para owner
UPDATE profiles 
SET role = 'owner', organization_id = (SELECT id FROM organizations WHERE name = 'VLuma Corporation')
WHERE email = 'test@vluma.com.br';

SELECT 'Super Admin criado com sucesso!' as status;
