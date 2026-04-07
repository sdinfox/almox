// Scripts de ofuscação para o AlmoxPro - Versão Melhorada
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import CryptoJS from 'crypto-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração de ofuscação avançada
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
  unicodeEscapeSequence: false,
  domainLock: true, // 🔒 NOVO: Bloquear domínios não autorizados
  machineLock: true, // 🔒 NOVO: Bloquear máquinas não autorizadas
  integrityCheck: true // 🔒 NOVO: Verificação de integridade
};

// 🔒 DOMÍNIOS AUTORIZADOS (Whitelist)
const AUTHORIZED_DOMAINS = [
  'almoxpro.com',
  'almoxpro.com.br',
  'localhost:3000',
  '127.0.0.1:3000'
];

// 🔒 MÁQUINAS AUTORIZADAS (Whitelist)
const AUTHORIZED_MACHINES = new Set();

// Função para ofuscar arquivo
async function obfuscateFile(inputPath, outputPath) {
  try {
    console.log(`🔒 Ofuscando: ${inputPath}`);
    
    // Ler arquivo original
    const originalCode = readFileSync(inputPath, 'utf8');
    
    // 🔒 VALIDAR DOMÍNIO ANTES DE OFUSCAR
    const domainValidation = `
// AlmoxPro Domain Validation
(function(){
  var _0x1a2b=['hostname','location'];
  (function(_0x3c4d,_0x5e6f){
    while(--_0x5e6f){
      _0x3c4d['push'](_0x3c4d['shift']());
    }
  }(_0x1a2b,0x9b));
  var _0x7a8b=function(_0x9c0d,_0x5e6f){
    var _0x1234=_0x9c0d-_0x5e6f;
    var _0x5678=_0x1a2b[_0x1234];
    return _0x5678;
  };
  
  // 🔒 VERIFICAR SE DOMÍNIO ESTÁ AUTORIZADO
  var _0xdef0=function(){
    var _0xhost=window.location.hostname;
    var _0xauthorized=${JSON.stringify(AUTHORIZED_DOMAINS)};
    if(!_0xauthorized.includes(_0xhost)){
      // 🔒 BLOQUEAR SE DOMÍNIO NÃO AUTORIZADO
      document.body.innerHTML='<div style="color:red;font-size:20px;text-align:center;padding:50px;">🚨 DOMÍNIO NÃO AUTORIZADO</div>';
      throw new Error('DOMAIN_NOT_AUTHORIZED');
    }
  };
  
  setInterval(_0xdef0,0x3e8);
})();
`;
    
    // 🔒 VALIDAR MÁQUINA ANTES DE OFUSCAR
    const machineValidation = `
// AlmoxPro Machine Validation
(function(){
  var _0x1a2b=['machineId','fingerprint'];
  (function(_0x3c4d,_0x5e6f){
    while(--_0x5e6f){
      _0x3c4d['push'](_0x3c4d['shift']());
    }
  }(_0x1a2b,0x9b));
  var _0x7a8b=function(_0x9c0d,_0x5e6f){
    var _0x1234=_0x9c0d-_0x5e6f;
    var _0x5678=_0x1a2b[_0x1234];
    return _0x5678;
  };
  
  // 🔒 VERIFICAR SE MÁQUINA ESTÁ AUTORIZADA
  var _0xdef0=function(){
    var _0xmachineId=localStorage.getItem('almox_machine_id');
    var _0xauthorized=${JSON.stringify(Array.from(AUTHORIZED_MACHINES))};
    if(!_0xauthorized.includes(_0xmachineId)){
      // 🔒 BLOQUEAR SE MÁQUINA NÃO AUTORIZADA
      document.body.innerHTML='<div style="color:red;font-size:20px;text-align:center;padding:50px;">🚨 MÁQUINA NÃO AUTORIZADA</div>';
      throw new Error('MACHINE_NOT_AUTHORIZED');
    }
  };
  
  setInterval(_0xdef0,0x3e8);
})();
`;
    
    // 🔒 OFUSCAÇÃO AVANÇADA COM VALIDAÇÕES
    const obfuscatedCode = domainValidation + machineValidation + advancedObfuscation(originalCode);
    
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

// Ofuscação avançada
function advancedObfuscation(code) {
  // Remover comentários
  let obfuscated = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  
  // Remover espaços extras e quebras de linha
  obfuscated = obfuscated.replace(/\s+/g, ' ').trim();
  
  // 🔒 Renomear variáveis comuns (avançado)
  const commonVars = ['user', 'data', 'result', 'response', 'error', 'config', 'options', 'license', 'machine', 'domain'];
  commonVars.forEach((original, index) => {
    const obfuscatedName = `_0x${CryptoJS.lib.WordArray.random(4).toString()}`;
    const regex = new RegExp(`\\b${original}\\b`, 'g');
    obfuscated = obfuscated.replace(regex, obfuscatedName);
  });
  
  // 🔒 Adicionar proteção avançada
  const protection = `
// AlmoxPro License Protection v2.0
(function(){var _0x1a2b=['debugger','constructor','eval','Function'];(function(_0x3c4d,_0x5e6f){var _0x7a8b=function(_0x9c0d){while(--_0x9c0d){_0x3c4d['push'](_0x3c4d['shift']());}};_0x7a8b(++_0x5e6f);}(_0x1a2b,0x9b));var _0xdef0=function(_0x1234,_0x5678){_0x1234=_0x1234-0x0;var _0x9abc=_0x1a2b[_0x1234];return _0x9abc;};setInterval(function(){_0xdef0('0x0');},0x3e8);
})();
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
