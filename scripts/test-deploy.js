// Script para testar deploy no Vercel
import { readFileSync, writeFileSync, existsSync } from 'fs';
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

async function testDeploy() {
  console.log('🚀 Testando Deploy no Vercel');
  console.log('============================\n');
  
  try {
    // 1. Verificar se está no repositório Git
    console.log('📋 Verificando repositório Git...');
    try {
      execSync('git status', { stdio: 'pipe' });
      console.log('✅ Repositório Git encontrado');
    } catch (error) {
      console.log('❌ Não está em um repositório Git');
      console.log('📋 Execute: git init');
      process.exit(1);
    }
    
    // 2. Verificar arquivo de configuração
    console.log('\n📋 Verificando configuração...');
    let config = {};
    if (existsSync('./config.json')) {
      config = JSON.parse(readFileSync('./config.json', 'utf8'));
      console.log(`✅ Configuração encontrada: ${config.server?.mode || 'local'}`);
    } else {
      console.log('⚠️ Configuração não encontrada');
      console.log('📋 Execute: npm run setup');
      process.exit(1);
    }
    
    // 3. Criar configuração para teste
    console.log('\n🔧 Criando configuração de teste...');
    const testConfig = {
      ...config,
      server: {
        ...config.server,
        mode: 'vercel',
        test: true
      },
      app: {
        ...config.app,
        version: 'test-' + Date.now()
      }
    };
    
    writeFileSync('./config.json', JSON.stringify(testConfig, null, 2));
    console.log('✅ Configuração de teste criada');
    
    // 4. Fazer build de teste
    console.log('\n📦 Fazendo build de teste...');
    execSync('npm run build:prod', { stdio: 'inherit' });
    console.log('✅ Build concluído');
    
    // 5. Preparar para deploy
    console.log('\n📋 Preparando para deploy...');
    console.log('📝 Arquivos para commit:');
    execSync('git status --porcelain', { stdio: 'inherit' });
    
    const proceed = await question('\n🚀 Deseja fazer deploy de teste? (s/N): ');
    if (proceed.toLowerCase() !== 's') {
      console.log('❌ Deploy cancelado');
      process.exit(0);
    }
    
    // 6. Fazer commit e push
    console.log('\n📤 Fazendo commit...');
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Test deploy - AlmoxPro"', { stdio: 'inherit' });
    
    console.log('\n📤 Enviando para GitHub...');
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('\n✅ Deploy enviado para o Vercel!');
    console.log('📋 Aguarde alguns minutos para o deploy completar...');
    console.log('🌐 Acesse: https://almoxpro.vercel.app');
    
    // 7. Instruções de teste
    console.log('\n🧪 Como testar:');
    console.log('1. Aguarde o deploy completar');
    console.log('2. Acesse: https://almoxpro.vercel.app');
    console.log('3. Verifique se o sistema carrega');
    console.log('4. Teste validação de licença');
    console.log('5. Verifique APIs: /api/validate-license');
    
    // 8. Como verificar o modo
    console.log('\n🔍 Como verificar o modo:');
    console.log('1. No navegador: Abra DevTools (F12)');
    console.log('2. Console: Digite: localStorage.getItem("config")');
    console.log('3. Verifique: config.server.mode');
    console.log('4. Deve mostrar: "vercel"');
    
    // 9. Limpar configuração de teste
    const cleanup = await question('\n🧹 Limpar configuração de teste? (s/N): ');
    if (cleanup.toLowerCase() === 's') {
      // Restaurar configuração original
      const originalConfig = {
        ...config,
        server: {
          ...config.server,
          test: false
        }
      };
      writeFileSync('./config.json', JSON.stringify(originalConfig, null, 2));
      console.log('✅ Configuração restaurada');
    }
    
    console.log('\n🎉 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Executar teste
testDeploy().catch(console.error);
