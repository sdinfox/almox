// Script de build para produção com ofuscação
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Iniciando build do AlmoxPro...');

// 1. Ler configuração
console.log('📋 Lendo configuração...');
let config = {};
try {
  if (existsSync('./config.json')) {
    config = JSON.parse(readFileSync('./config.json', 'utf8'));
    console.log(`✅ Configuração encontrada: ${config.server?.mode || 'local'}`);
  } else {
    console.log('⚠️ Configuração não encontrada, usando padrão');
    config = {
      server: { mode: 'local' },
      database: { type: 'postgresql' }
    };
  }
} catch (error) {
  console.log('⚠️ Erro ao ler configuração, usando padrão');
  config = { server: { mode: 'local' }, database: { type: 'postgresql' } };
}

// 2. Build normal do Vite
console.log('📦 Build do Vite...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: join(__dirname, '..') });
  console.log('✅ Build Vite concluído');
} catch (error) {
  console.error('❌ Erro no build Vite:', error.message);
  process.exit(1);
}

// 3. Copiar arquivos essenciais
console.log('📋 Copiando arquivos essenciais...');
const essentialFiles = [
  'package.json',
  'README.md',
  'LICENSE',
  'config.json'
];

const distDir = join(__dirname, '../dist');
for (const file of essentialFiles) {
  const srcPath = join(__dirname, '..', file);
  const destPath = join(distDir, file);
  
  if (existsSync(srcPath)) {
    const content = readFileSync(srcPath);
    writeFileSync(destPath, content);
    console.log(`✅ Copiado: ${file}`);
  }
}

// 4. Criar scripts de instalação específicos
console.log('🔧 Criando scripts de instalação...');
createInstallationScripts(config);

// 5. Criar arquivos específicos do modo
console.log('⚙️ Criando arquivos de configuração...');
createModeSpecificFiles(config);

// 6. Compactar para distribuição
console.log('📦 Compactando para distribuição...');
createDistributionPackage(config);

console.log('✅ Build concluído com sucesso!');
console.log('📁 Arquivos em: ./dist/');
console.log(`🎯 Modo: ${config.server?.mode || 'local'}`);
console.log('🚀 AlmoxPro pronto para distribuição!');

function createInstallationScripts(config) {
  const scriptsDir = join(distDir, 'scripts');
  if (!existsSync(scriptsDir)) {
    mkdirSync(scriptsDir, { recursive: true });
  }

  // Script Windows
  const windowsScript = `@echo off
echo ========================================
echo    AlmoxPro - Instalador
echo ========================================
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js nao encontrado. Por favor, instale o Node.js em https://nodejs.org
    pause
    exit /b 1
)

echo Node.js encontrado!
echo.

echo Modo atual: ${config.server?.mode || 'local'}
echo.

if "${config.server?.mode}"=="vercel" goto vercel
if "${config.server?.mode}"=="local" goto local

echo Modo invalido!
pause
exit /b 1

:local
echo Configurando Servidor Local...
node scripts/setup-local-server.js
goto end

:vercel
echo Configurando Servidor Vercel...
node scripts/setup-vercel-server.js
goto end

:end
echo.
echo Instalacao concluida!
echo.
echo Para iniciar o sistema:
npm start
echo.
pause
`;

  writeFileSync(join(scriptsDir, 'install.bat'), windowsScript);

  // Script Linux/Mac
  const unixScript = `#!/bin/bash

echo "========================================"
echo "   AlmoxPro - Instalador"
echo "========================================"
echo

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js não encontrado. Por favor, instale o Node.js em https://nodejs.org"
    exit 1
fi

echo "Node.js encontrado!"
echo "Modo atual: ${config.server?.mode || 'local'}"
echo

# Verificar modo
if [ "${config.server?.mode}" = "vercel" ]; then
    echo "Configurando Servidor Vercel..."
    node scripts/setup-vercel-server.js
elif [ "${config.server?.mode}" = "local" ]; then
    echo "Configurando Servidor Local..."
    node scripts/setup-local-server.js
else
    echo "Modo inválido!"
    exit 1
fi

echo
echo "Instalação concluída!"
echo
echo "Para iniciar o sistema:"
echo "npm start"
echo
`;

  writeFileSync(join(scriptsDir, 'install.sh'), unixScript);

  console.log('✅ Scripts de instalação criados');
}

function createModeSpecificFiles(config) {
  if (config.server?.mode === 'local') {
    // Arquivos para modo local
    const localReadme = `# AlmoxPro - Servidor Local

## Inicialização

### Windows
\`\`\`bash
./scripts/install.bat
\`\`\`

### Linux/Mac
\`\`\`bash
chmod +x scripts/install.sh
./scripts/install.sh
\`\`\`

## Configuração

O sistema está configurado para modo local com PostgreSQL.

### Acesso
- URL: http://${config.server?.host || 'localhost'}:${config.server?.port || '3000'}
- Banco: PostgreSQL local
- Modo: Servidor Local

## Administração

- Iniciar: \`npm start\`
- Parar: \`Ctrl + C\`
- Serviço: \`npm run service:install\`

---

© 2024 AlmoxPro - Todos os direitos reservados
`;

    writeFileSync(join(distDir, 'README-LOCAL.md'), localReadme);
    console.log('✅ README-LOCAL.md criado');

  } else if (config.server?.mode === 'vercel') {
    // Arquivos para modo Vercel
    const vercelReadme = `# AlmoxPro - Servidor Vercel

## Deploy Automático

### Como fazer deploy

1. Commit das mudanças:
\`\`\`bash
git add .
git commit -m "Update"
\`\`\`

2. Push para o GitHub:
\`\`\`bash
git push origin main
\`\`\`

3. Deploy automático no Vercel

### URLs

- **Produção:** https://${config.server?.project || 'almoxpro'}.vercel.app
- **API Validação:** https://${config.server?.project || 'almoxpro'}.vercel.app/api/validate-license
- **API Ativação:** https://${config.server?.project || 'almoxpro'}.vercel.app/api/activate-license

### Configuração

- **Projeto Vercel:** ${config.server?.project || 'almoxpro'}
- **Banco Supabase:** Configurado
- **Modo:** Servidor Nuvem

---

© 2024 AlmoxPro - Todos os direitos reservados
`;

    writeFileSync(join(distDir, 'README-VERCEL.md'), vercelReadme);
    console.log('✅ README-VERCEL.md criado');
  }
}

function createDistributionPackage(config) {
  // Criar README principal
  const mainReadme = `# AlmoxPro - Sistema de Almoxarifado

## Modo de Instalação: ${config.server?.mode === 'vercel' ? 'Servidor Nuvem (Vercel)' : 'Servidor Local (PostgreSQL)'}

${config.server?.mode === 'vercel' ? `
## Deploy na Nuvem

Este sistema está configurado para deploy automático no Vercel.

### Passos:
1. Faça commit das mudanças
2. Push para o GitHub
3. Acesse: https://${config.server?.project || 'almoxpro'}.vercel.app

### Documentação
- Veja README-VERCEL.md para detalhes
` : `
## Servidor Local

Este sistema está configurado para servidor local com PostgreSQL.

### Passos:
1. Execute: ./scripts/install.bat (Windows) ou ./scripts/install.sh (Linux/Mac)
2. Siga as instruções
3. Acesse: http://${config.server?.host || 'localhost'}:${config.server?.port || '3000'}

### Documentação
- Veja README-LOCAL.md para detalhes
`}

## Licenciamento

O sistema requer licença para funcionar.
- Trial: 15 dias grátis
- Planos: Basic, Professional, Enterprise
- Ativação: Digite a chave no sistema

## Suporte

- Email: suporte@almoxpro.com
- Documentação: https://docs.almoxpro.com

---

© 2024 AlmoxPro - Todos os direitos reservados
`;

  writeFileSync(join(distDir, 'README.md'), mainReadme);

  console.log('✅ README.md principal criado');
}
