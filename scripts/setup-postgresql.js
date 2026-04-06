// Script de setup para PostgreSQL
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupPostgreSQL() {
  console.log('🐘 Configurando PostgreSQL...');
  
  try {
    // Obter configuração do usuário
    const host = await question('Host do PostgreSQL (localhost): ') || 'localhost';
    const port = await question('Porta (5432): ') || '5432';
    const database = await question('Nome do banco (almoxpro): ') || 'almoxpro';
    const username = await question('Usuário (postgres): ') || 'postgres';
    const password = await question('Senha: ');
    
    // Criar arquivo de configuração
    const config = {
      database: {
        type: 'postgresql',
        host: host,
        port: parseInt(port),
        database: database,
        username: username,
        password: password,
        ssl: false
      },
      server: {
        port: 3000,
        host: 'localhost'
      },
      license: {
        mode: 'offline'
      }
    };
    
    writeFileSync('./config.json', JSON.stringify(config, null, 2));
    console.log('✅ Configuração salva em config.json');
    
    // Testar conexão
    console.log('🔍 Testando conexão com o banco...');
    await testConnection(config);
    
    // Criar banco se não existir
    await createDatabase(config);
    
    // Executar migrações
    await runMigrations(config);
    
    console.log('✅ PostgreSQL configurado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na configuração:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

async function testConnection(config) {
  try {
    // Tentar conectar ao PostgreSQL
    const { Client } = await import('pg');
    const client = new Client({
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
      database: 'postgres' // Banco padrão para testar conexão
    });
    
    await client.connect();
    await client.end();
    console.log('✅ Conexão testada com sucesso');
  } catch (error) {
    throw new Error(`Falha na conexão: ${error.message}`);
  }
}

async function createDatabase(config) {
  try {
    const { Client } = await import('pg');
    const client = new Client({
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
      database: 'postgres'
    });
    
    await client.connect();
    
    // Verificar se banco existe
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.database.database]
    );
    
    if (result.rows.length === 0) {
      await client.query(`CREATE DATABASE ${config.database.database}`);
      console.log(`✅ Banco '${config.database.database}' criado`);
    } else {
      console.log(`✅ Banco '${config.database.database}' já existe`);
    }
    
    await client.end();
  } catch (error) {
    throw new Error(`Erro ao criar banco: ${error.message}`);
  }
}

async function runMigrations(config) {
  try {
    const { Client } = await import('pg');
    const client = new Client(config.database);
    
    await client.connect();
    
    // Ler arquivo de migração
    const migrationFile = './database/migrations/001_initial.sql';
    if (existsSync(migrationFile)) {
      const migrationSQL = readFileSync(migrationFile, 'utf8');
      
      // Executar migração
      await client.query(migrationSQL);
      console.log('✅ Migrações executadas com sucesso');
    } else {
      console.log('⚠️ Arquivo de migração não encontrado, pulando...');
    }
    
    await client.end();
  } catch (error) {
    throw new Error(`Erro nas migrações: ${error.message}`);
  }
}

// Executar setup
setupPostgreSQL().catch(console.error);
