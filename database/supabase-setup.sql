-- Script de setup para Supabase
-- Execute este SQL no painel SQL Editor do seu projeto Supabase

-- Criar tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de perfis
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    empresa_id UUID REFERENCES empresas(id),
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de materiais
CREATE TABLE IF NOT EXISTS materiais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    codigo VARCHAR(100),
    unidade VARCHAR(20),
    estoque_minimo DECIMAL(10,2) DEFAULT 0,
    estoque_atual DECIMAL(10,2) DEFAULT 0,
    preco_unitario DECIMAL(10,2),
    categoria VARCHAR(100),
    empresa_id UUID REFERENCES empresas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de movimentacoes
CREATE TABLE IF NOT EXISTS movimentacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id UUID REFERENCES materiais(id),
    tipo VARCHAR(20) NOT NULL, -- 'entrada', 'saida', 'ajuste'
    quantidade DECIMAL(10,2) NOT NULL,
    motivo TEXT,
    responsavel_id UUID REFERENCES profiles(id),
    empresa_id UUID REFERENCES empresas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de solicitacoes
CREATE TABLE IF NOT EXISTS solicitacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id UUID REFERENCES materiais(id),
    solicitante_id UUID REFERENCES profiles(id),
    quantidade DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'aprovada', 'rejeitada'
    motivo TEXT,
    aprovador_id UUID REFERENCES profiles(id),
    empresa_id UUID REFERENCES empresas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de configuracoes
CREATE TABLE IF NOT EXISTS configuracoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chave VARCHAR(100) NOT NULL,
    valor TEXT,
    empresa_id UUID REFERENCES empresas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chave, empresa_id)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Criar políticas RLS para empresas
CREATE POLICY "Users can view own company" ON empresas
    FOR SELECT USING (id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

-- Criar políticas RLS para materiais
CREATE POLICY "Users can view company materials" ON materiais
    FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can modify company materials" ON materiais
    FOR ALL USING (empresa_id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

-- Criar políticas RLS para movimentacoes
CREATE POLICY "Users can view company movements" ON movimentacoes
    FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can modify company movements" ON movimentacoes
    FOR ALL USING (empresa_id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

-- Criar políticas RLS para solicitacoes
CREATE POLICY "Users can view company requests" ON solicitacoes
    FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can modify company requests" ON solicitacoes
    FOR ALL USING (empresa_id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

-- Criar políticas RLS para configuracoes
CREATE POLICY "Users can view company config" ON configuracoes
    FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can modify company config" ON configuracoes
    FOR ALL USING (empresa_id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

-- Criar triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materiais_updated_at BEFORE UPDATE ON materiais
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movimentacoes_updated_at BEFORE UPDATE ON movimentacoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solicitacoes_updated_at BEFORE UPDATE ON solicitacoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir empresa padrão
INSERT INTO empresas (id, nome, cnpj) 
VALUES (
    gen_random_uuid(),
    'Empresa Padrão',
    '00.000.000/0000-00'
) ON CONFLICT DO NOTHING;

-- Inserir configurações padrão
INSERT INTO configuracoes (chave, valor, empresa_id)
SELECT 
    'logo_url',
    NULL,
    id
FROM empresas 
WHERE nome = 'Empresa Padrão'
ON CONFLICT (chave, empresa_id) DO NOTHING;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_materiais_empresa_id ON materiais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_empresa_id ON movimentacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_empresa_id ON solicitacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_profiles_empresa_id ON profiles(empresa_id);
