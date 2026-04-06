// Script de build para produção com ofuscação
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Iniciando build do AlmoxPro...');

// 1. Build normal do Vite
console.log('📦 Build do Vite...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: join(__dirname, '..') });
  console.log('✅ Build Vite concluído');
} catch (error) {
  console.error('❌ Erro no build Vite:', error.message);
  process.exit(1);
}

// 2. Copiar arquivos essenciais
console.log('📋 Copiando arquivos essenciais...');
const essentialFiles = [
  'package.json',
  'README.md',
  'LICENSE'
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

// 3. Criar scripts de instalação
console.log('🔧 Criando scripts de instalação...');
createInstallationScripts();

// 4. Criar arquivo de configuração
console.log('⚙️ Criando configuração...');
createConfigFiles();

// 5. Compactar para distribuição
console.log('📦 Compactando para distribuição...');
createDistributionPackage();

console.log('✅ Build concluído com sucesso!');
console.log('📁 Arquivos em: ./dist/');
console.log('🚀 AlmoxPro pronto para distribuição!');

function createInstallationScripts() {
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

echo Instalando dependencias...
call npm install --production

echo.
echo Configurando banco de dados...
echo Escolha uma opcao:
echo 1 - PostgreSQL Local
echo 2 - Supabase Nuvem
set /p choice="Digite sua escolha (1 ou 2): "

if "%choice%"=="1" goto postgresql
if "%choice%"=="2" goto supabase

echo Opcao invalida!
pause
exit /b 1

:postgresql
echo Configurando PostgreSQL...
node scripts/setup-postgresql.js
goto end

:supabase
echo Configurando Supabase...
node scripts/setup-supabase.js
goto end

:end
echo.
echo Instalacao concluida!
echo.
echo Para iniciar o sistema:
echo npm start
echo.
echo Acesse: http://localhost:3000
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
echo

# Instalar dependências
echo "Instalando dependências..."
npm install --production

echo
echo "Configurando banco de dados..."
echo "Escolha uma opção:"
echo "1 - PostgreSQL Local"
echo "2 - Supabase Nuvem"
read -p "Digite sua escolha (1 ou 2): " choice

case $choice in
    1)
        echo "Configurando PostgreSQL..."
        node scripts/setup-postgresql.js
        ;;
    2)
        echo "Configurando Supabase..."
        node scripts/setup-supabase.js
        ;;
    *)
        echo "Opção inválida!"
        exit 1
        ;;
esac

echo
echo "Instalação concluída!"
echo
echo "Para iniciar o sistema:"
echo "npm start"
echo
echo "Acesse: http://localhost:3000"
echo
`;

  writeFileSync(join(scriptsDir, 'install.sh'), unixScript);

  console.log('✅ Scripts de instalação criados');
}

function createConfigFiles() {
  // Configuração PostgreSQL
  const postgresConfig = `{
  "database": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "almoxpro",
    "username": "almox_user",
    "password": "",
    "ssl": false
  },
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "license": {
    "mode": "offline"
  }
}`;

  writeFileSync(join(distDir, 'config.postgresql.json'), postgresConfig);

  // Configuração Supabase
  const supabaseConfig = `{
  "database": {
    "type": "supabase",
    "url": "",
    "anonKey": "",
    "serviceKey": ""
  },
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "license": {
    "mode": "online"
  }
}`;

  writeFileSync(join(distDir, 'config.supabase.json'), supabaseConfig);

  // Configuração padrão
  const defaultConfig = `{
  "app": {
    "name": "AlmoxPro",
    "version": "1.0.0",
    "mode": "production"
  },
  "database": {
    "type": "postgresql",
    "config": "config.postgresql.json"
  },
  "license": {
    "server": "https://api.almoxpro.com",
    "validationInterval": 3600000
  }
}`;

  writeFileSync(join(distDir, 'config.json'), defaultConfig);

  console.log('✅ Arquivos de configuração criados');
}

function createDistributionPackage() {
  // Criar README de instalação
  const installReadme = `# AlmoxPro - Guia de Instalação

## Requisitos
- Node.js 18 ou superior
- PostgreSQL 12+ (para instalação local) OU
- Conta Supabase (para instalação na nuvem)

## Instalação Rápida

### Windows
1. Execute \`install.bat\`
2. Siga as instruções
3. Acesse http://localhost:3000

### Linux/Mac
1. Execute \`chmod +x install.sh && ./install.sh\`
2. Siga as instruções
3. Acesse http://localhost:3000

## Configuração do Banco

### PostgreSQL Local
1. Instale PostgreSQL
2. Crie banco: \`CREATE DATABASE almoxpro;\`
3. Execute o script de migração
4. Configure em \`config.postgresql.json\`

### Supabase Nuvem
1. Crie conta em https://supabase.com
2. Crie novo projeto
3. Copie URL e chaves
4. Configure em \`config.supabase.json\`

## Ativação da Licença

1. Após instalação, acesse o sistema
2. Clique em "Ativar Licença"
3. Digite sua chave de licença
4. Escolha seu plano

## Suporte
- Email: suporte@almoxpro.com
- Documentação: https://docs.almoxpro.com

---

© 2024 AlmoxPro - Todos os direitos reservados
`;

  writeFileSync(join(distDir, 'INSTALL.md'), installReadme);

  console.log('✅ Guia de instalação criado');
}
