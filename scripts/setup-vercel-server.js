// Script de setup para servidor Vercel (nuvem)
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

async function setupVercelServer() {
  console.log('🌐 Configurando AlmoxPro - Servidor Vercel');
  console.log('========================================\n');
  
  try {
    // 1. Obter configuração do Supabase
    console.log('📋 Configuração do Supabase:');
    const supabaseUrl = await question('URL do Supabase: ');
    const supabaseAnonKey = await question('Chave Anônima (anon key): ');
    const supabaseServiceKey = await question('Chave de Serviço (service key): ');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('URL e chave anônima são obrigatórias');
    }

    // 2. Obter configuração do projeto Vercel
    console.log('\n📋 Configuração do Projeto Vercel:');
    const projectName = await question('Nome do projeto Vercel (almoxpro): ') || 'almoxpro';
    const domainName = await question('Domínio personalizado (opcional): ');

    // 3. Criar arquivo de configuração
    const config = {
      server: {
        mode: 'vercel',
        project: projectName,
        domain: domainName || null
      },
      database: {
        type: 'supabase',
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
        serviceKey: supabaseServiceKey
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

    // 4. Criar vercel.json para deploy
    await createVercelConfig(projectName);

    // 5. Criar package.json para Vercel
    await createVercelPackage();

    // 6. Instalar dependências
    console.log('\n📦 Instalando dependências...');
    execSync('npm install --production', { stdio: 'inherit' });

    // 7. Preparar para deploy
    await prepareForDeploy();

    console.log('\n🎉 Setup concluído com sucesso!');
    console.log('========================================');
    console.log('🚀 Para fazer deploy:');
    console.log('   git add .');
    console.log('   git commit -m "Setup Vercel server"');
    console.log('   git push origin main');
    console.log('');
    console.log('🌐 Após o deploy, acesse:');
    if (domainName) {
      console.log(`   https://${domainName}`);
    } else {
      console.log(`   https://${projectName}.vercel.app`);
    }
    console.log('');
    console.log('📋 Para atualizar o projeto:');
    console.log('   npm run build');
    console.log('   git add . && git commit -m "Update" && git push');
    console.log('');

  } catch (error) {
    console.error('❌ Erro no setup:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

async function createVercelConfig(projectName) {
  const vercelConfig = {
    version: 2,
    name: projectName,
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    functions: {
      'api/validate-license.js': {
        maxDuration: 10
      },
      'api/activate-license.js': {
        maxDuration: 10
      },
      'api/webhooks.js': {
        maxDuration: 30
      }
    },
    rewrites: [
      {
        source: '/api/(.*)',
        destination: '/api/$1.js'
      },
      {
        source: '/(.*)',
        destination: '/index.html'
      }
    ],
    env: {
      NODE_ENV: 'production'
    }
  };

  writeFileSync('./vercel.json', JSON.stringify(vercelConfig, null, 2));
  console.log('✅ vercel.json criado');
}

async function createVercelPackage() {
  // Ler package.json atual
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
  
  // Adicionar scripts para Vercel
  packageJson.scripts = {
    ...packageJson.scripts,
    'vercel-build': 'vite build',
    'deploy': 'vercel --prod'
  };

  // Adicionar dependências para Vercel
  packageJson.dependencies = {
    ...packageJson.dependencies,
    '@supabase/supabase-js': '^2.89.0'
  };

  writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ package.json atualizado para Vercel');
}

async function prepareForDeploy() {
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

  // Criar README para Vercel
  const readme = `# AlmoxPro - Servidor Vercel

## Deploy Automático

Este projeto está configurado para deploy automático no Vercel.

### Como fazer deploy:

1. Faça commit das mudanças:
   \`\`\`bash
   git add .
   git commit -m "Update"
   \`\`\`

2. Push para o GitHub:
   \`\`\`bash
   git push origin main
   \`\`\`

3. O Vercel fará o deploy automaticamente

### Configuração

- **Projeto Vercel:** Configurado em vercel.json
- **Banco Supabase:** Configurado em config.json
- **Variáveis de Ambiente:** Configuradas no painel Vercel

### URLs

- **Produção:** https://almoxpro.vercel.app
- **API de Validação:** https://almoxpro.vercel.app/api/validate-license
- **API de Ativação:** https://almoxpro.vercel.app/api/activate-license

---

© 2024 AlmoxPro - Todos os direitos reservados
`;

  writeFileSync('README-VERCEL.md', readme);
  console.log('✅ README-VERCEL.md criado');
}

// Executar setup
setupVercelServer().catch(console.error);
