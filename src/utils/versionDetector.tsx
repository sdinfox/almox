// Utilitário para detectar a versão do sistema
import { useState, useEffect } from 'react';

export interface VersionInfo {
  mode: 'local' | 'vercel' | 'unknown';
  database: 'postgresql' | 'supabase' | 'unknown';
  environment: 'development' | 'production' | 'unknown';
  host: string;
  port?: number;
  project?: string;
  domain?: string;
}

export function detectVersion(): VersionInfo {
  const info: VersionInfo = {
    mode: 'unknown',
    database: 'unknown',
    environment: 'unknown',
    host: window.location.hostname,
    port: window.location.port ? parseInt(window.location.port) : undefined
  };

  // Detectar ambiente
  if (process.env.NODE_ENV) {
    info.environment = process.env.NODE_ENV as 'development' | 'production';
  } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    info.environment = 'development';
  } else {
    info.environment = 'production';
  }

  // Detectar modo (local vs vercel)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    info.mode = 'local';
    info.database = 'postgresql'; // Assumir PostgreSQL para local
  } else if (window.location.hostname.includes('.vercel.app')) {
    info.mode = 'vercel';
    info.database = 'supabase'; // Assumir Supabase para Vercel
    info.project = window.location.hostname.split('.')[0];
  } else {
    // Verificar se tem config.json
    try {
      const config = localStorage.getItem('config');
      if (config) {
        const parsedConfig = JSON.parse(config);
        info.mode = parsedConfig.server?.mode || 'unknown';
        info.database = parsedConfig.database?.type || 'unknown';
        info.project = parsedConfig.server?.project;
        info.domain = parsedConfig.server?.domain;
      }
    } catch (error) {
      console.warn('Erro ao ler configuração:', error);
    }
  }

  return info;
}

export function isLocalMode(): boolean {
  return detectVersion().mode === 'local';
}

export function isVercelMode(): boolean {
  return detectVersion().mode === 'vercel';
}

export function getDatabaseType(): 'postgresql' | 'supabase' | 'unknown' {
  return detectVersion().database;
}

export function getVersionDisplay(): string {
  const info = detectVersion();
  
  if (info.mode === 'local') {
    return `Servidor Local (${info.database})`;
  } else if (info.mode === 'vercel') {
    return `Servidor Nuvem (${info.project || 'Vercel'})`;
  } else {
    return `Modo Desconhecido`;
  }
}

export function getAPIBaseURL(): string {
  const info = detectVersion();
  
  if (info.mode === 'vercel') {
    return 'https://almoxpro.vercel.app/api';
  } else {
    return 'http://localhost:3000/api';
  }
}

// Hook para React
export function useVersionInfo() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>(detectVersion());
  
  useEffect(() => {
    // Atualizar quando a configuração mudar
    const handleStorageChange = () => {
      setVersionInfo(detectVersion());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  return versionInfo;
}
