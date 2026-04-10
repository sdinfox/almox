-- Fase 2: Implementação de RBAC
-- Execute no SQL Editor do Supabase

-- 1. Adicionar coluna role na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner';

-- 2. Criar constraint para valores permitidos
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'owner', 'manager', 'operator'));

-- 3. Atualizar usuários existentes para 'owner'
UPDATE profiles 
SET role = 'owner' 
WHERE role IS NULL OR role NOT IN ('super_admin', 'owner', 'manager', 'operator');

-- 4. Atualizar trigger handle_new_user para incluir role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    company_name TEXT;
    user_role TEXT;
BEGIN
    -- Extrai o nome da empresa do metadata do Auth
    company_name := NEW.raw_user_meta_data ->> 'company_name';
    
    -- Define role padrão como 'owner' para auto-cadastro
    user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'owner');
    
    IF company_name IS NOT NULL THEN
        -- Fluxo de Auto-Cadastro: Cria nova organização
        INSERT INTO public.organizations (name, plan_type, expires_at)
        VALUES (company_name, 'trial', NOW() + INTERVAL '15 days')
        RETURNING id INTO new_org_id;
    ELSE
        -- Fluxo de Convite: Tenta usar o organization_id passado no metadata ou a padrão
        BEGIN
            new_org_id := (NEW.raw_user_meta_data ->> 'organization_id')::UUID;
        EXCEPTION WHEN OTHERS THEN
            SELECT id INTO new_org_id FROM public.organizations WHERE name = 'Empresa Padrão' LIMIT 1;
        END;
    END IF;

    -- Se ainda não tiver org_id (falha de segurança/lógica), usa a padrão
    IF new_org_id IS NULL THEN
        SELECT id INTO new_org_id FROM public.organizations WHERE name = 'Empresa Padrão' LIMIT 1;
    END IF;

    -- Cria o perfil vinculado à organização com role
    INSERT INTO public.profiles (id, email, nome, organization_id, role, perfil)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'nome', 'Usuário Novo'),
        new_org_id,
        user_role,
        COALESCE(NEW.raw_user_meta_data ->> 'perfil', 'admin')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Verificar resultado
SELECT COUNT(*) as total_profiles,
       COUNT(CASE WHEN role = 'owner' THEN 1 END) as owners,
       COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admins,
       COUNT(CASE WHEN role = 'manager' THEN 1 END) as managers,
       COUNT(CASE WHEN role = 'operator' THEN 1 END) as operators
FROM profiles;

SELECT 'RBAC implementado com sucesso!' as status;
