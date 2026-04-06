// Instalador principal - Escolha entre Local e Vercel
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

async function mainInstaller() {
  console.log('🏢 AlmoxPro - Instalador Principal');
  console.log('=====================================\n');
  
  console.log('🎯 Bem-vindo ao AlmoxPro!');
  console.log('Sistema profissional de gerenciamento de almoxarifado\n');
  
  console.log('📋 Escolha o tipo de instalação:');
  console.log('');
  console.log('1️⃣  Servidor Local (PostgreSQL)');
  console.log('   - Servidor próprio');
  console.log('   - Dados locais');
  console.log('   - Performance máxima');
  console.log('   - Requer PostgreSQL instalado');
  console.log('');
  console.log('2️⃣  Servidor Nuvem (Vercel + Supabase)');
  console.log('   - Deploy automático');
  console.log('   - Acesso remoto');
  console.log('   - Backup automático');
  console.log('   - Requer conta Supabase');
  console.log('');
  
  const choice = await question('Digite sua escolha (1 ou 2): ');
  
  switch (choice) {
    case '1':
      await setupLocalServer();
      break;
    case '2':
      await setupVercelServer();
      break;
    default:
      console.log('❌ Escolha inválida. Execute novamente.');
      process.exit(1);
  }
}

async function setupLocalServer() {
  console.log('\n🏢 Iniciando setup para Servidor Local...');
  console.log('=====================================\n');
  
  try {
    // Importar e executar setup local
    const setupLocal = await import('./setup-local-server.js');
    await setupLocal.setupLocalServer();
    
  } catch (error) {
    console.error('❌ Erro no setup local:', error.message);
    process.exit(1);
  }
}

async function setupVercelServer() {
  console.log('\n🌐 Iniciando setup para Servidor Vercel...');
  console.log('========================================\n');
  
  try {
    // Importar e executar setup Vercel
    const setupVercel = await import('./setup-vercel-server.js');
    await setupVercel.setupVercelServer();
    
  } catch (error) {
    console.error('❌ Erro no setup Vercel:', error.message);
    process.exit(1);
  }
}

// Criar atalho para o instalador
function createInstallerShortcut() {
  const installerScript = `@echo off
title AlmoxPro Installer
echo.
echo =====================================
echo    AlmoxPro - Instalador
echo =====================================
echo.
node scripts/installer.js
pause`;

  writeFileSync('install.bat', installerScript);
  console.log('✅ install.bat criado');
}

// Verificar pré-requisitos
async function checkPrerequisites() {
  console.log('📋 Verificando pré-requisitos...\n');
  
  // Verificar Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' });
    console.log(`✅ Node.js: ${nodeVersion.trim()}`);
  } catch (error) {
    console.log('❌ Node.js não encontrado');
    console.log('📥 Baixe e instale: https://nodejs.org');
    console.log('📋 Após instalar, execute este instalador novamente.');
    process.exit(1);
  }
  
  // Verificar npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' });
    console.log(`✅ npm: ${npmVersion.trim()}`);
  } catch (error) {
    console.log('❌ npm não encontrado');
    process.exit(1);
  }
  
  // Verificar Git
  try {
    const gitVersion = execSync('git --version', { encoding: 'utf8' });
    console.log(`✅ Git: ${gitVersion.trim()}`);
  } catch (error) {
    console.log('⚠️ Git não encontrado (opcional para Vercel)');
  }
  
  console.log('✅ Pré-requisitos verificados\n');
}

// Criar estrutura de diretórios
function createDirectoryStructure() {
  const dirs = [
    './scripts',
    './database/migrations',
    './api',
    './admin'
  ];
  
  dirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`📁 Diretório criado: ${dir}`);
    }
  });
}

// Função principal
async function run() {
  try {
    // Criar atalho
    createInstallerShortcut();
    
    // Verificar pré-requisitos
    await checkPrerequisites();
    
    // Criar estrutura
    createDirectoryStructure();
    
    // Executar instalador principal
    await mainInstaller();
    
  } catch (error) {
    console.error('❌ Erro no instalador:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Mensagem final
function showCompletionMessage() {
  console.log('\n🎉 Instalação concluída com sucesso!');
  console.log('=====================================');
  console.log('');
  console.log('📋 Próximos passos:');
  console.log('1. Configure sua licença');
  console.log('2. Acesse o sistema');
  console.log('3. Comece a usar o AlmoxPro');
  console.log('');
  console.log('📞 Suporte:');
  console.log('   Email: suporte@almoxpro.com');
  console.log('   Docs: https://docs.almoxpro.com');
  console.log('');
  console.log('🚀 AlmoxPro - O almoxarifado do futuro!');
}

// Executar
run().catch(console.error);
