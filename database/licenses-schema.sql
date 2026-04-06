-- Schema do Banco de Licenças - Supabase
-- Execute este SQL no painel SQL Editor do seu projeto Supabase

-- Criar tabela de licenças
CREATE TABLE IF NOT EXISTS licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_key VARCHAR(50) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL, -- 'trial', 'basic', 'professional', 'enterprise'
    customer_email TEXT,
    activation_email TEXT,
    stripe_session_id TEXT,
    stripe_subscription_id TEXT,
    pagar_me_subscription_id TEXT,
    
    -- Controle de ativação
    is_active BOOLEAN DEFAULT false,
    activated_at TIMESTAMP WITH TIME ZONE,
    activated_machine_id TEXT,
    last_validated TIMESTAMP WITH TIME ZONE,
    validation_count INTEGER DEFAULT 0,
    
    -- Controle de expiração
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_renewed TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Configurações
    machine_limit INTEGER DEFAULT 1,
    features JSONB DEFAULT '[]',
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de máquinas licenciadas
CREATE TABLE IF NOT EXISTS license_machines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
    machine_id TEXT NOT NULL,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version VARCHAR(20) DEFAULT '1.0.0',
    ip_address INET,
    user_agent TEXT,
    
    -- Restrições
    UNIQUE(license_id, machine_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de logs de validação
CREATE TABLE IF NOT EXISTS license_validation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
    machine_id TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    validation_result VARCHAR(20) NOT NULL, -- 'success', 'failed', 'expired', 'invalid'
    error_message TEXT,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de transações
CREATE TABLE IF NOT EXISTS license_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- 'creation', 'renewal', 'upgrade', 'cancellation'
    payment_provider VARCHAR(20), -- 'stripe', 'pagar_me'
    transaction_id TEXT,
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'BRL',
    plan_from VARCHAR(50),
    plan_to VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de planos
CREATE TABLE IF NOT EXISTS license_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_quarterly DECIMAL(10,2),
    price_semiannual DECIMAL(10,2),
    price_annual DECIMAL(10,2),
    trial_days INTEGER DEFAULT 15,
    machine_limit INTEGER DEFAULT 1,
    features JSONB DEFAULT '[]',
    stripe_price_id TEXT,
    pagar_me_plan_id TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS license_system_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(customer_email);
CREATE INDEX IF NOT EXISTS idx_licenses_active ON licenses(is_active);
CREATE INDEX IF NOT EXISTS idx_licenses_expires ON licenses(expires_at);
CREATE INDEX IF NOT EXISTS idx_licenses_subscription ON licenses(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_machines_license ON license_machines(license_id);
CREATE INDEX IF NOT EXISTS idx_machines_machine ON license_machines(machine_id);
CREATE INDEX IF NOT EXISTS idx_machines_last_seen ON license_machines(last_seen);

CREATE INDEX IF NOT EXISTS idx_logs_license ON license_validation_logs(license_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON license_validation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_result ON license_validation_logs(validation_result);

CREATE INDEX IF NOT EXISTS idx_transactions_license ON license_transactions(license_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON license_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON license_transactions(created_at);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_license_machines_updated_at BEFORE UPDATE ON license_machines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_license_system_config_updated_at BEFORE UPDATE ON license_system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir planos padrão
INSERT INTO license_plans (name, display_name, description, price_monthly, price_quarterly, price_semiannual, price_annual, trial_days, machine_limit, features, sort_order) VALUES
('trial', 'Trial', 'Período gratuito de testes', 0, 0, 0, 0, 15, 1, '["users_5", "materials_100", "basic_reports"]', 0),
('basic', 'Basic', 'Plano básico para pequenas empresas', 157, 423, 798, 1416, 15, 1, '["users_5", "materials_1000", "basic_reports", "email_support"]', 1),
('professional', 'Professional', 'Plano profissional para empresas em crescimento', 319, 861, 1626, 2862, 15, 2, '["users_20", "materials_5000", "advanced_reports", "api_access", "priority_support"]', 2),
('enterprise', 'Enterprise', 'Plano enterprise para grandes empresas', 535, 1445, 2723, 4785, 15, 5, '["users_unlimited", "materials_unlimited", "multi_branch", "custom_api", "dedicated_support", "sla"]', 3)
ON CONFLICT (name) DO NOTHING;

-- Inserir configurações do sistema
INSERT INTO license_system_config (key, value, description) VALUES
('max_machines_per_license', '5', 'Número máximo de máquinas por licença'),
('validation_interval_hours', '24', 'Intervalo em horas para validação online'),
('grace_period_days', '7', 'Período de carência após expiração'),
('enable_offline_validation', 'true', 'Permitir validação offline quando online falhar'),
('max_validation_attempts', '3', 'Número máximo de tentativas de validação falhas antes de bloquear'),
('license_key_prefix', 'ALMX', 'Prefixo para chaves de licença')
ON CONFLICT (key) DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_system_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (para acesso via API)
CREATE POLICY "Allow all operations via API" ON licenses
    FOR ALL USING (true);

CREATE POLICY "Allow all operations via API" ON license_machines
    FOR ALL USING (true);

CREATE POLICY "Allow all operations via API" ON license_validation_logs
    FOR ALL USING (true);

CREATE POLICY "Allow all operations via API" ON license_transactions
    FOR ALL USING (true);

CREATE POLICY "Allow read operations via API" ON license_plans
    FOR SELECT USING (true);

CREATE POLICY "Allow read operations via API" ON license_system_config
    FOR SELECT USING (true);
