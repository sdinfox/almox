-- Script para criar trigger de confirmação de email
-- Execute no SQL Editor do painel Supabase

-- Criar função para handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar perfil automaticamente quando usuário for criado
    INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
        'user', -- Perfil padrão
        NOW(),
        NOW()
    );
    
    -- Se houver metadata de empresa, criar empresa também
    IF NEW.raw_user_meta_data ? 'company_name' IS NOT NULL THEN
        INSERT INTO public.empresas (nome, created_at, updated_at)
        VALUES (
            NEW.raw_user_meta_data->>'company_name',
            NOW(),
            NOW()
        )
        RETURNING id INTO NEW.raw_user_meta_data->>'empresa_id';
        
        -- Atualizar perfil com ID da empresa
        UPDATE public.profiles 
        SET empresa_id = NEW.raw_user_meta_data->>'empresa_id'
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que chama a função quando usuário é criado
DROP TRIGGER IF EXISTS public.on_auth_user_created ON auth.users;
CREATE TRIGGER public.on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Habilitar Row Level Security na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar política para usuários poderem ver seus próprios perfis
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Criar política para usuários poderem atualizar seus próprios perfis
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Criar política para usuários poderem inserir seus próprios perfis
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Habilitar Row Level Security na tabela empresas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Criar política para usuários poderem ver empresas vinculadas
CREATE POLICY "Users can view linked companies" ON public.empresas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.empresa_id = empresas.id 
            AND profiles.id = auth.uid()
        )
    );

-- Criar política para usuários poderem atualizar empresas vinculadas
CREATE POLICY "Users can update linked companies" ON public.empresas
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.empresa_id = empresas.id 
            AND profiles.id = auth.uid()
        )
    );

-- Criar política para inserir empresas via trigger
CREATE POLICY "Enable insert for all" ON public.empresas
    FOR INSERT WITH CHECK (true);

-- Confirmar criação
SELECT 'Trigger e políticas criados com sucesso!' as status;
