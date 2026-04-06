// Script completo - Setup + Git + Deploy
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { createInterface } from 'readline';
import { dirname, join } from 'path';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fullSetup() {
  console.log('🚀 AlmoxPro - Setup Completo');
  console.log('=============================\n');
  
  try {
    // 1. Setup do sistema
    console.log('📋 Passo 1: Setup do Sistema');
    console.log('==========================');
    
    const setupChoice = await question('Escolha o tipo de instalação (1-Local, 2-Vercel): ');
    
    if (setupChoice === '1') {
      console.log('🏢 Configurando versão Local...');
      await setupLocal();
    } else if (setupChoice === '2') {
      console.log('🌐 Configurando versão Vercel...');
      await setupVercel();
    } else {
      console.log('❌ Escolha inválida');
      process.exit(1);
    }
    
    console.log('✅ Setup do sistema concluído!\n');
    
    // 2. Setup do Git
    console.log('📋 Passo 2: Setup do Git');
    console.log('=======================');
    
    const gitChoice = await question('Configurar repositório Git? (s/N): ');
    
    if (gitChoice.toLowerCase() === 's') {
      await setupGit();
    } else {
      console.log('⏭️ Pulando configuração Git');
    }
    
    // 3. Deploy
    console.log('\n📋 Passo 3: Deploy');
    console.log('=================');
    
    if (setupChoice === '2') {
      const deployChoice = await question('Fazer deploy no Vercel agora? (s/N): ');
      if (deployChoice.toLowerCase() === 's') {
        await deployToVercel();
      }
    }
    
    console.log('\n🎉 Setup completo concluído!');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Erro no setup:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

async function setupLocal() {
  // Executar setup local
  const setupLocal = await import('./setup-local-server.js');
  await setupLocal.setupLocalServer();
}

async function setupVercel() {
  // Executar setup Vercel
  const setupVercel = await import('./setup-vercel-server.js');
  await setupVercel.setupVercelServer();
}

async function setupGit() {
  try {
    // Verificar se já é repositório
    try {
      execSync('git status', { stdio: 'pipe' });
      console.log('✅ Repositório Git já existe');
    } catch (error) {
      // Criar repositório
      console.log('📋 Criando repositório Git...');
      execSync('git init', { stdio: 'inherit' });
      console.log('✅ Repositório criado');
    }
    
    // Configurar usuário se necessário
    try {
      execSync('git config user.name', { stdio: 'pipe' });
    } catch (error) {
      const userName = await question('Seu nome no Git: ');
      const userEmail = await question('Seu email no Git: ');
      
      execSync(`git config user.name "${userName}"`, { stdio: 'inherit' });
      execSync(`git config user.email "${userEmail}"`, { stdio: 'inherit' });
      console.log('✅ Configuração do usuário Git concluída');
    }
    
    // Criar .gitignore se não existir
    if (!existsSync('.gitignore')) {
      const gitignore = `node_modules/
.env
.env.local
.env.production
dist/
.DS_Store
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`;
      writeFileSync('.gitignore', gitignore);
      console.log('✅ .gitignore criado');
    }
    
    // Fazer commit inicial
    console.log('📋 Fazendo commit inicial...');
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Initial commit - AlmoxPro"', { stdio: 'inherit' });
    console.log('✅ Commit inicial criado');
    
    // Configurar remoto
    try {
      execSync('git remote get-url origin', { stdio: 'pipe' });
      console.log('✅ Remoto já configurado');
    } catch (error) {
      const setupRemote = await question('Configurar repositório remoto? (s/N): ');
      if (setupRemote.toLowerCase() === 's') {
        const repoUrl = await question('URL do repositório GitHub: ');
        execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });
        execSync('git push -u origin main', { stdio: 'inherit' });
        console.log('✅ Repositório remoto configurado e push enviado');
      }
    }
    
  } catch (error) {
    throw new Error(`Erro no setup Git: ${error.message}`);
  }
}

async function deployToVercel() {
  try {
    console.log('📋 Enviando para Vercel...');
    
    // Verificar se tem remoto configurado
    try {
      execSync('git remote get-url origin', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Repositório remoto não configurado');
    }
    
    // Push para GitHub
    console.log('📤 Enviando para GitHub...');
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('✅ Push enviado!');
    console.log('🌐 Aguarde alguns minutos para o deploy no Vercel...');
    console.log('📋 Acesse: https://almoxpro.vercel.app');
    
  } catch (error) {
    throw new Error(`Erro no deploy: ${error.message}`);
  }
}

// Executar setup completo
fullSetup().catch(console.error);
