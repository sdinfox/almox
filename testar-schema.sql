-- Script para testar schema do Supabase
-- Execute no SQL Editor do painel Supabase

-- Verificar se tabelas existem
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'empresas', 'materiais', 'movimentacoes')
ORDER BY table_name;

-- Verificar se triggers existem
SELECT trigger_name, event_manipulation_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%new_user%'
ORDER BY trigger_name;

-- Verificar se políticas RLS existem
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'empresas', 'materiais', 'movimentacoes')
ORDER BY tablename, policyname;

-- Verificar dados na tabela profiles
SELECT COUNT(*) as total_profiles, 
       COUNT(CASE WHEN perfil IS NOT NULL THEN 1 END) as with_perfil
FROM profiles;

-- Verificar usuários na auth.users
SELECT COUNT(*) as total_auth_users 
FROM auth.users;

-- Verificar trigger específico handle_new_user
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%new_user%';
