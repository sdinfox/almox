-- Fase 4: Atualização das Políticas RLS
-- Execute no SQL Editor do Supabase

-- 1. Habilitar RLS em todas as tabelas (se não estiver)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view linked companies" ON organizations;
DROP POLICY IF EXISTS "Users can update linked companies" ON organizations;
DROP POLICY IF EXISTS "Enable insert for all" ON organizations;

-- 3. Políticas para Profiles
CREATE POLICY "Super Admin or Own Profile Access" ON profiles
FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
    OR 
    id = auth.uid()
);

-- 4. Políticas para Organizations
CREATE POLICY "Super Admin or Organization Access" ON organizations
FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
    OR 
    id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- 5. Políticas para Materiais
CREATE POLICY "Super Admin or Organization Materials Access" ON materiais
FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
    OR 
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- 6. Políticas para Movimentacoes
CREATE POLICY "Super Admin or Organization Movements Access" ON movimentacoes
FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
    OR 
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- 7. Política especial para Super Admin (bypass total)
CREATE POLICY "Super Admin Full Access" ON profiles
FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Super Admin Full Access Organizations" ON organizations
FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Super Admin Full Access Materiais" ON materiais
FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Super Admin Full Access Movimentacoes" ON movimentacoes
FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- 8. Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'organizations', 'materiais', 'movimentacoes')
ORDER BY tablename, policyname;

-- 9. Teste de acesso (executar como super admin)
-- SELECT * FROM profiles; -- Deve retornar todos os perfis
-- SELECT * FROM organizations; -- Deve retornar todas as organizações

SELECT 'Políticas RLS atualizadas com sucesso!' as status;
