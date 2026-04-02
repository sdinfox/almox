-- Migration: Criar função para resetar sequências
-- Data: 2026-04-02
-- Objetivo: Função auxiliar para resetar IDs das tabelas após reset completo

-- Criar função para resetar sequências das tabelas principais
CREATE OR REPLACE FUNCTION reset_sequences()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Resetar sequência de materiais
    PERFORM setval(pg_get_serial_sequence('materiais', 'id'), 1, false);
    
    -- Resetar sequência de movimentações  
    PERFORM setval(pg_get_serial_sequence('movimentacoes', 'id'), 1, false);
    
    -- Resetar sequência de profiles (se for serial)
    -- Nota: profiles usa UUID, então não tem sequência
    
    RAISE NOTICE 'Sequências resetadas com sucesso';
END;
$$;

-- Comentário sobre a finalidade da função
COMMENT ON FUNCTION reset_sequences IS 'Reseta as sequências de IDs das tabelas principais para começar do 1 novamente. Usada após reset completo do banco.';
