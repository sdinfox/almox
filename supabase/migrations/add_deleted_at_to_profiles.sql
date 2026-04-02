-- Migration: Adicionar campo deleted_at na tabela profiles
-- Data: 2026-04-02
-- Objetivo: Implementar Soft Delete para preservação de movimentações

-- Adicionar campo deleted_at na tabela profiles
ALTER TABLE profiles 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL;

-- Criar índice para performance das queries
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at);

-- Atualizar RLS policies para considerar usuários excluídos
-- Policy para leitura: apenas usuários não excluídos podem ser vistos em listagens normais
DROP POLICY IF EXISTS profiles_select_all ON profiles;
CREATE POLICY profiles_select_all ON profiles
  FOR SELECT USING (
    deleted_at IS NULL OR 
    auth.uid() = id OR 
    (SELECT perfil FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Policy para update: impedir atualização de usuários excluídos
DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (
    auth.uid() = id AND 
    deleted_at IS NULL
  );

-- Policy para delete: apenas admin pode marcar como excluído
DROP POLICY IF EXISTS profiles_delete_admin ON profiles;
CREATE POLICY profiles_delete_admin ON profiles
  FOR UPDATE USING (
    (SELECT perfil FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Comentário sobre a finalidade do campo
COMMENT ON COLUMN profiles.deleted_at IS 'Data de exclusão lógica (soft delete). Usuários com este campo preenchido estão excluídos mas mantidos para histórico.';
