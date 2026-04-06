// Script de setup para Supabase
import { createInterface } from 'readline';
import { writeFileSync } from 'fs';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupSupabase() {
  console.log('🌐 Configurando Supabase...');
  
  try {
    // Obter configuração do usuário
    const url = await question('URL do Supabase: ');
    const anonKey = await question('Chave Anônima (anon key): ');
    const serviceKey = await question('Chave de Serviço (service key): ');
    
    if (!url || !anonKey) {
      throw new Error('URL e chave anônima são obrigatórias');
    }
    
    // Criar arquivo de configuração
    const config = {
      database: {
        type: 'supabase',
        url: url,
        anonKey: anonKey,
        serviceKey: serviceKey
      },
      server: {
        port: 3000,
        host: 'localhost'
      },
      license: {
        mode: 'online'
      }
    };
    
    writeFileSync('./config.json', JSON.stringify(config, null, 2));
    console.log('✅ Configuração salva em config.json');
    
    // Testar conexão
    console.log('🔍 Testando conexão com Supabase...');
    await testConnection(config);
    
    // Verificar/criar tabelas
    await setupTables(config);
    
    console.log('✅ Supabase configurado com sucesso!');
    console.log('🌐 Seu sistema está pronto para usar na nuvem!');
    
  } catch (error) {
    console.error('❌ Erro na configuração:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

async function testConnection(config) {
  try {
    // Testar conexão HTTP com Supabase
    const response = await fetch(`${config.database.url}/rest/v1/`, {
      headers: {
        'apikey': config.database.anonKey,
        'Authorization': `Bearer ${config.database.anonKey}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Conexão testada com sucesso');
    } else {
      throw new Error(`Falha na conexão: ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Falha na conexão: ${error.message}`);
  }
}

async function setupTables(config) {
  try {
    // SQL para criar tabelas básicas
    const createTablesSQL = `
-- Criar tabela de empresas (se não existir)
CREATE TABLE IF NOT EXISTS empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de perfis (se não existir)
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

-- Criar tabela de materiais (se não existir)
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

-- Criar tabela de movimentacoes (se não existir)
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

-- Criar tabela de solicitacoes (se não existir)
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

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS básicas
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view company data" ON materiais
    FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can modify company data" ON materiais
    FOR ALL USING (empresa_id IN (SELECT empresa_id FROM profiles WHERE id = auth.uid()));
`;

    // Executar SQL via API REST do Supabase
    const response = await fetch(`${config.database.url}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'apikey': config.database.serviceKey || config.database.anonKey,
        'Authorization': `Bearer ${config.database.serviceKey || config.database.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: createTablesSQL })
    });
    
    if (response.ok) {
      console.log('✅ Tabelas criadas/verificadas com sucesso');
    } else {
      // Se a RPC não existir, tentar método alternativo
      console.log('⚠️ RPC não disponível, você precisará executar o SQL manualmente no painel Supabase');
      console.log('📋 Copie o SQL do arquivo database/supabase-setup.sql');
    }
    
  } catch (error) {
    console.log('⚠️ Não foi possível criar tabelas automaticamente');
    console.log('📋 Execute manualmente o SQL no painel do Supabase');
  }
}

// Executar setup
setupSupabase().catch(console.error);
