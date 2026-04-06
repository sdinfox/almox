// Script de setup para servidor local completo
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupLocalServer() {
  console.log('🏢 Configurando AlmoxPro - Servidor Local');
  console.log('=====================================\n');
  
  try {
    // 1. Verificar Node.js
    console.log('📋 Verificando Node.js...');
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' });
      console.log(`✅ Node.js encontrado: ${nodeVersion.trim()}`);
    } catch (error) {
      throw new Error('Node.js não encontrado. Instale em https://nodejs.org');
    }

    // 2. Verificar PostgreSQL
    console.log('\n📋 Verificando PostgreSQL...');
    try {
      execSync('psql --version', { encoding: 'utf8' });
      console.log('✅ PostgreSQL encontrado');
    } catch (error) {
      console.log('⚠️ PostgreSQL não encontrado');
      console.log('📥 Instale PostgreSQL: https://www.postgresql.org/download/');
      const continueAnyway = await question('Continuar mesmo assim? (s/N): ');
      if (continueAnyway.toLowerCase() !== 's') {
        process.exit(0);
      }
    }

    // 3. Obter configuração do banco
    console.log('\n⚙️ Configuração do Banco de Dados:');
    const dbHost = await question('Host do PostgreSQL (localhost): ') || 'localhost';
    const dbPort = await question('Porta (5432): ') || '5432';
    const dbName = await question('Nome do banco (almoxpro): ') || 'almoxpro';
    const dbUser = await question('Usuário (postgres): ') || 'postgres';
    const dbPassword = await question('Senha: ');

    // 4. Obter configuração do servidor
    console.log('\n⚙️ Configuração do Servidor:');
    const serverPort = await question('Porta do servidor (3000): ') || '3000';
    const serverHost = await question('Host do servidor (localhost): ') || 'localhost';

    // 5. Criar banco se não existir
    console.log('\n🗄️ Configurando banco de dados...');
    await setupDatabase({
      host: dbHost,
      port: parseInt(dbPort),
      database: 'postgres', // Banco padrão para criar
      username: dbUser,
      password: dbPassword
    }, dbName);

    // 6. Criar arquivo de configuração
    const config = {
      server: {
        port: parseInt(serverPort),
        host: serverHost,
        mode: 'local'
      },
      database: {
        type: 'postgresql',
        host: dbHost,
        port: parseInt(dbPort),
        database: dbName,
        username: dbUser,
        password: dbPassword,
        ssl: false
      },
      license: {
        mode: 'online',
        server: 'https://almoxpro.vercel.app/api',
        validationInterval: 3600000 // 1 hora
      },
      app: {
        name: 'AlmoxPro',
        version: '1.0.0'
      }
    };

    writeFileSync('./config.json', JSON.stringify(config, null, 2));
    console.log('✅ Configuração salva em config.json');

    // 7. Instalar dependências
    console.log('\n📦 Instalando dependências...');
    execSync('npm install --production', { stdio: 'inherit' });

    // 8. Criar scripts de serviço
    await createServiceScripts(config);

    // 9. Criar atalhos
    await createShortcuts(config);

    console.log('\n🎉 Setup concluído com sucesso!');
    console.log('=====================================');
    console.log('🚀 Para iniciar o servidor:');
    console.log('   npm start');
    console.log('');
    console.log('🌐 Acesse o sistema:');
    console.log(`   http://${serverHost}:${serverPort}`);
    console.log('');
    console.log('📋 Para parar o servidor:');
    console.log('   Ctrl + C');
    console.log('');
    console.log('🔧 Para configurar como serviço:');
    console.log('   npm run service:install');
    console.log('');

  } catch (error) {
    console.error('❌ Erro no setup:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

async function setupDatabase(config, dbName) {
  try {
    const { Client } = await import('pg');
    const client = new Client(config);
    
    await client.connect();
    
    // Verificar se banco existe
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    
    if (result.rows.length === 0) {
      console.log(`📋 Criando banco '${dbName}'...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log('✅ Banco criado com sucesso');
    } else {
      console.log(`✅ Banco '${dbName}' já existe`);
    }
    
    await client.end();

    // Conectar ao banco específico e executar migrações
    const dbConfig = { ...config, database: dbName };
    const dbClient = new Client(dbConfig);
    await dbClient.connect();
    
    // Executar migrações
    await runMigrations(dbClient);
    
    await dbClient.end();
    
  } catch (error) {
    throw new Error(`Erro ao configurar banco: ${error.message}`);
  }
}

async function runMigrations(client) {
  try {
    console.log('🔄 Executando migrações...');
    
    // Ler arquivo de migração
    const migrationFile = join(__dirname, '../database/migrations/001_initial.sql');
    if (existsSync(migrationFile)) {
      const migrationSQL = readFileSync(migrationFile, 'utf8');
      await client.query(migrationSQL);
      console.log('✅ Migrações executadas com sucesso');
    } else {
      console.log('⚠️ Arquivo de migração não encontrado');
    }
    
  } catch (error) {
    throw new Error(`Erro nas migrações: ${error.message}`);
  }
}

async function createServiceScripts(config) {
  const scriptsDir = './scripts';
  if (!existsSync(scriptsDir)) {
    mkdirSync(scriptsDir, { recursive: true });
  }

  // Script para Windows
  const windowsService = `@echo off
echo Instalando AlmoxPro como serviço do Windows...
sc create AlmoxPro binPath= "node %~dp0\\server.js"
sc description AlmoxPro "Sistema de Almoxarifado AlmoxPro"
sc start AlmoxPro
echo Serviço AlmoxPro instalado e iniciado!
pause`;

  writeFileSync(join(scriptsDir, 'install-service.bat'), windowsService);

  // Script para Linux/Mac
  const unixService = `#!/bin/bash
echo "Instalando AlmoxPro como serviço..."
sudo cp almoxpro.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable almoxpro
sudo systemctl start almoxpro
echo "Serviço AlmoxPro instalado e iniciado!"`;

  writeFileSync(join(scriptsDir, 'install-service.sh'), unixService);

  // Criar arquivo de serviço systemd
  const serviceFile = `[Unit]
Description=AlmoxPro Server
After=network.target

[Service]
Type=simple
User=${process.env.USER || 'node'}
WorkingDirectory=${process.cwd()}
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target`;

  writeFileSync('almoxpro.service', serviceFile);

  console.log('✅ Scripts de serviço criados');
}

async function createShortcuts(config) {
  console.log('🔧 Criando atalhos...');
  
  // Criar script de inicialização
  const startScript = `@echo off
echo Iniciando AlmoxPro Server...
cd /d "%~dp0"
node server.js
pause`;

  writeFileSync('start-server.bat', startScript);

  console.log('✅ Atalhos criados');
  console.log('   - start-server.bat: Iniciar servidor');
}

// Executar setup
setupLocalServer().catch(console.error);
