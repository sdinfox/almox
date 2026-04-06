// Scripts de ofuscação para o AlmoxPro
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração de ofuscação
const obfuscationConfig = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: true,
  debugProtectionInterval: true,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

// Função para ofuscar arquivo
async function obfuscateFile(inputPath, outputPath) {
  try {
    console.log(`🔒 Ofuscando: ${inputPath}`);
    
    // Ler arquivo original
    const originalCode = readFileSync(inputPath, 'utf8');
    
    // Ofuscação básica manual (sem dependências externas por enquanto)
    const obfuscatedCode = basicObfuscation(originalCode);
    
    // Criar diretório de saída se não existir
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Escrever arquivo ofuscado
    writeFileSync(outputPath, obfuscatedCode);
    console.log(`✅ Concluído: ${outputPath}`);
    
  } catch (error) {
    console.error(`❌ Erro ao ofuscar ${inputPath}:`, error.message);
  }
}

// Ofuscação básica manual
function basicObfuscation(code) {
  // Remover comentários
  let obfuscated = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  
  // Remover espaços extras e quebras de linha
  obfuscated = obfuscated.replace(/\s+/g, ' ').trim();
  
  // Renomear variáveis comuns (básico)
  const commonVars = ['user', 'data', 'result', 'response', 'error', 'config', 'options'];
  commonVars.forEach((original, index) => {
    const obfuscatedName = `_0x${index.toString(16)}`;
    const regex = new RegExp(`\\b${original}\\b`, 'g');
    obfuscated = obfuscated.replace(regex, obfuscatedName);
  });
  
  // Adicionar proteção básica
  const protection = `
// AlmoxPro License Protection
(function(){var _0x1a2b=['debugger','constructor'];(function(_0x3c4d,_0x5e6f){var _0x7a8b=function(_0x9c0d){while(--_0x9c0d){_0x3c4d['push'](_0x3c4d['shift']());}};_0x7a8b(++_0x5e6f);}(_0x1a2b,0x9b));var _0xdef0=function(_0x1234,_0x5678){_0x1234=_0x1234-0x0;var _0x9abc=_0x1a2b[_0x1234];return _0x9abc;};setInterval(function(){_0xdef0('0x0');},0x3e8);
`;
  
  return protection + obfuscated;
}

// Função principal de build
async function buildObfuscated() {
  console.log('🚀 Iniciando ofuscação do AlmoxPro...');
  
  // Criar diretório de distribuição
  const distDir = join(__dirname, '../dist');
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }
  
  // Arquivos principais para ofuscar
  const filesToObfuscate = [
    '../src/App.tsx',
    '../src/main.tsx',
    '../src/contexts/AuthContext.tsx',
    '../src/hooks/useConfig.ts',
    '../src/components/layout/Layout.tsx',
    '../src/components/layout/Sidebar.tsx',
    '../src/components/layout/Footer.tsx'
  ];
  
  // Ofuscar cada arquivo
  for (const file of filesToObfuscate) {
    const inputPath = join(__dirname, file);
    const outputPath = join(__dirname, '../dist', file.replace('../src/', '').replace('.tsx', '.js'));
    await obfuscateFile(inputPath, outputPath);
  }
  
  console.log('✅ Ofuscação concluída com sucesso!');
  console.log('📦 Arquivos salvos em: ./dist/');
}

// Executar build
buildObfuscated().catch(console.error);
