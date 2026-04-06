// API de Validação de Licenças - Vercel Serverless
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { key, machineId, version } = req.body;

    // Validação básica
    if (!key || !machineId) {
      return res.status(400).json({ 
        valid: false, 
        error: 'License key and machine ID are required' 
      });
    }

    // Verificar formato da chave
    if (!key.startsWith('ALMX-')) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Invalid license key format' 
      });
    }

    // Buscar licença no banco
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', key)
      .single();

    if (error || !license) {
      return res.status(404).json({ 
        valid: false, 
        error: 'License not found' 
      });
    }

    // Verificar se está ativa
    if (!license.is_active) {
      return res.status(403).json({ 
        valid: false, 
        error: 'License is inactive' 
      });
    }

    // Verificar expiração
    const now = new Date();
    const expiry = new Date(license.expires_at);
    
    if (now > expiry) {
      return res.status(403).json({ 
        valid: false, 
        error: 'License expired' 
      });
    }

    // Verificar limite de máquinas
    if (license.machine_limit && license.machine_limit > 0) {
      const { data: activeMachines } = await supabase
        .from('license_machines')
        .select('machine_id')
        .eq('license_id', license.id);

      if (activeMachines && activeMachines.length >= license.machine_limit) {
        const machineExists = activeMachines.some(m => m.machine_id === machineId);
        if (!machineExists) {
          return res.status(403).json({ 
            valid: false, 
            error: 'Machine limit exceeded' 
          });
        }
      }
    }

    // Registrar/Atualizar máquina
    if (machineId) {
      await supabase
        .from('license_machines')
        .upsert({
          license_id: license.id,
          machine_id: machineId,
          last_seen: new Date().toISOString(),
          version: version || '1.0.0'
        }, {
          onConflict: 'license_id,machine_id'
        });
    }

    // Atualizar último acesso
    await supabase
      .from('licenses')
      .update({ 
        last_validated: new Date().toISOString(),
        validation_count: license.validation_count + 1
      })
      .eq('id', license.id);

    // Retornar sucesso
    return res.status(200).json({
      valid: true,
      license: {
        id: license.id,
        plan: license.plan,
        expires_at: license.expires_at,
        days_remaining: Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)),
        features: license.features || [],
        machine_limit: license.machine_limit
      },
      machine: {
        id: machineId,
        registered: true
      }
    });

  } catch (error) {
    console.error('License validation error:', error);
    return res.status(500).json({ 
      valid: false, 
      error: 'Internal server error' 
    });
  }
}
