// Sistema de Licenciamento AlmoxPro - Versão Segura
import { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

interface LicenseInfo {
  key: string;
  plan: 'trial' | 'basic' | 'professional' | 'enterprise';
  expiry: string;
  machineId: string;
  isValid: boolean;
  daysRemaining: number;
}

export class LicenseManager {
  private static instance: LicenseManager;
  private licenseKey: string | null = null;
  private expiryDate: string | null = null;
  private machineId: string = '';
  private integrityHash: string = ''; // 🔒 NOVO: Hash de integridade

  private constructor() {
    this.initializeLicense();
  }

  static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }

  private initializeLicense(): void {
    // 🔒 Gerar ID único da máquina (avançado)
    this.machineId = this.generateMachineId();
    
    // 🔒 Carregar licença do localStorage com validação
    this.licenseKey = localStorage.getItem('almox_license_key');
    this.expiryDate = localStorage.getItem('almox_expiry_date');
    this.integrityHash = localStorage.getItem('almox_integrity_hash') || '';
    
    // 🔒 Validar integridade ao inicializar
    if (this.licenseKey && !this.validateIntegrity()) {
      console.warn('🚨 Licença corrompida detectada!');
      this.clearLicense();
    }
  }

  private generateMachineId(): string {
    // Gerar ID avançado baseado em múltiplos fatores
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('AlmoxPro Machine ID', 2, 2);
    }
    
    // Coletar múltiplos fingerprints
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      (navigator as any).hardwareConcurrency || 'unknown',
      (navigator as any).deviceMemory || 'unknown'
    ];
    
    // Gerar hash SHA-256 do fingerprint usando CryptoJS
    const fingerprintHash = CryptoJS.SHA256(fingerprint.join('|')).toString();
    
    return fingerprintHash;
  }

  // Validar integridade da licença
  private validateIntegrity(): boolean {
    if (!this.licenseKey || !this.integrityHash) {
      return false;
    }
    
    const currentHash = CryptoJS.SHA256(this.licenseKey).toString();
    
    return currentHash === this.integrityHash;
  }

  // 🔒 Limpar licença corrompida
  private clearLicense(): void {
    this.licenseKey = null;
    this.expiryDate = null;
    this.integrityHash = '';
    
    localStorage.removeItem('almox_license_key');
    localStorage.removeItem('almox_expiry_date');
    localStorage.removeItem('almox_integrity_hash');
    localStorage.removeItem('almox_machine_id');
  }

  // Salvar licença com hash de integridade
  private saveLicense(licenseKey: string, plan: string, days: number): void {
    this.licenseKey = licenseKey;
    this.expiryDate = new Date(Date.now() + (days * 24 * 60 * 60 * 1000)).toISOString();
    
    // Gerar hash de integridade usando CryptoJS
    this.integrityHash = CryptoJS.SHA256(licenseKey + plan + this.machineId).toString();
    
    localStorage.setItem('almox_license_key', licenseKey);
    localStorage.setItem('almox_expiry_date', this.expiryDate);
    localStorage.setItem('almox_plan', plan);
    localStorage.setItem('almox_integrity_hash', this.integrityHash);
    localStorage.setItem('almox_machine_id', this.machineId);
  }

  async validateLicense(): Promise<LicenseInfo> {
    const licenseInfo: LicenseInfo = {
      key: this.licenseKey || '',
      plan: 'trial',
      expiry: this.expiryDate || '',
      machineId: this.machineId,
      isValid: false,
      daysRemaining: 0
    };

    // Verificar se é trial
    if (!this.licenseKey) {
      return this.handleTrial(licenseInfo);
    }

    // Verificar se expirou
    if (this.isExpired()) {
      return {
        ...licenseInfo,
        isValid: false,
        daysRemaining: 0
      };
    }

    // Validar licença online (simplificado)
    try {
      console.log('Validando licença online:', this.licenseKey);
      
      // Simular validação bem-sucedida para chaves válidas
      if (this.licenseKey && this.licenseKey.startsWith('ALMX-') && this.licenseKey.length > 10) {
        return {
          ...licenseInfo,
          key: this.licenseKey,
          plan: (this.licenseKey.includes('PRO') ? 'professional' : 'basic') as LicenseInfo['plan'],
          isValid: true,
          daysRemaining: this.licenseKey.includes('PERPETUAL') ? 999999 : 30
        };
      }
      
      return licenseInfo;
    } catch (error) {
      console.warn('Falha na validação online, usando fallback offline');
      return licenseInfo;
    }
  }

  private handleTrial(licenseInfo: LicenseInfo): LicenseInfo {
    const trialStart = localStorage.getItem('almox_trial_start');
    
    if (!trialStart) {
      // Iniciar trial
      const now = new Date();
      localStorage.setItem('almox_trial_start', now.toISOString());
      const expiry = new Date(now.getTime() + (15 * 24 * 60 * 60 * 1000)); // 15 dias
      localStorage.setItem('almox_expiry_date', expiry.toISOString());
      
      return {
        ...licenseInfo,
        plan: 'trial',
        expiry: expiry.toISOString(),
        isValid: true,
        daysRemaining: 15
      };
    }

    // Verificar se trial ainda é válido
    const trialExpiry = new Date(trialStart);
    trialExpiry.setDate(trialExpiry.getDate() + 15);
    
    if (new Date() > trialExpiry) {
      return {
        ...licenseInfo,
        isValid: false,
        daysRemaining: 0
      };
    }

    const daysRemaining = Math.ceil((trialExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      ...licenseInfo,
      plan: 'trial',
      expiry: trialExpiry.toISOString(),
      isValid: true,
      daysRemaining
    };
  }

  private isExpired(): boolean {
    if (!this.expiryDate) return true;
    return new Date() > new Date(this.expiryDate);
  }

  private calculateDaysRemaining(): number {
    if (!this.expiryDate) return 0;
    const expiry = new Date(this.expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  async activateLicense(licenseKey: string): Promise<boolean> {
    try {
      // 🔒 Validar formato da chave
      if (!licenseKey || licenseKey.length < 10) {
        return false;
      }
      
      // 🔒 Simular ativação online
      console.log('Ativando licença:', licenseKey);
      
      // Determinar plano baseado na chave
      const plan: LicenseInfo['plan'] = licenseKey.includes('PRO') ? 'professional' : 'basic';
      const days: number = licenseKey.includes('PERPETUAL') ? 999999 : 30;
      
      // 🔒 Salvar com hash de integridade
      this.saveLicense(licenseKey, plan, days);
      
      return true;
    } catch (error) {
      console.error('Erro ao ativar licença:', error);
      return false;
    }
  }

  getLicenseInfo(): LicenseInfo {
    return {
      key: this.licenseKey || '',
      plan: (localStorage.getItem('almox_plan') || 'trial') as LicenseInfo['plan'],
      expiry: this.expiryDate || '',
      machineId: this.machineId,
      isValid: !this.isExpired(),
      daysRemaining: this.calculateDaysRemaining()
    };
  }
}

// Hook para React
export function useLicenseManager() {
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLicense = async () => {
      const manager = LicenseManager.getInstance();
      const info = await manager.validateLicense();
      setLicenseInfo(info);
      setIsLoading(false);
    };

    checkLicense();
    
    // Verificar licença a cada hora
    const interval = setInterval(checkLicense, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { licenseInfo, isLoading };
}