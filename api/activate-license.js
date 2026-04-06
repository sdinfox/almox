// API de Ativação de Licenças - Vercel Serverless
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
    const { key, machineId, email, plan } = req.body;

    // Validação básica
    if (!key || !machineId) {
      return res.status(400).json({ 
        success: false, 
        error: 'License key and machine ID are required' 
      });
    }

    // Verificar formato da chave
    if (!key.startsWith('ALMX-')) {
      return res.status(400).json({ 
        success: false, 
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
        success: false, 
        error: 'License not found' 
      });
    }

    // Verificar se já está ativa
    if (license.is_active) {
      // Verificar expiração
      const now = new Date();
      const expiry = new Date(license.expires_at);
      
      if (now <= expiry) {
        return res.status(200).json({
          success: true,
          message: 'License already active',
          license: {
            plan: license.plan,
            expires_at: license.expires_at,
            days_remaining: Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
          }
        });
      }
    }

    // Verificar plano e calcular nova expiração
    let expiryDate = new Date();
    switch (license.plan) {
      case 'basic':
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        break;
      case 'professional':
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        break;
      case 'enterprise':
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        break;
      case 'trial':
        expiryDate.setDate(expiryDate.getDate() + 15);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid plan' 
        });
    }

    // Ativar licença
    const { data: updatedLicense, error: updateError } = await supabase
      .from('licenses')
      .update({
        is_active: true,
        expires_at: expiryDate.toISOString(),
        activated_at: new Date().toISOString(),
        activated_machine_id: machineId,
        activation_email: email || license.activation_email,
        last_validated: new Date().toISOString()
      })
      .eq('id', license.id)
      .select()
      .single();

    if (updateError) {
      console.error('License activation error:', updateError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to activate license' 
      });
    }

    // Registrar máquina
    await supabase
      .from('license_machines')
      .upsert({
        license_id: license.id,
        machine_id: machineId,
        activated_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        version: '1.0.0'
      }, {
        onConflict: 'license_id,machine_id'
      });

    // Enviar email de confirmação (opcional)
    if (email || license.activation_email) {
      await sendActivationEmail(email || license.activation_email, {
        licenseKey: key,
        plan: license.plan,
        machineId: machineId,
        expiresAt: expiryDate.toISOString()
      });
    }

    // Retornar sucesso
    return res.status(200).json({
      success: true,
      message: 'License activated successfully',
      license: {
        id: license.id,
        plan: license.plan,
        expires_at: expiryDate.toISOString(),
        days_remaining: Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)),
        features: license.features || [],
        machine_id: machineId
      }
    });

  } catch (error) {
    console.error('License activation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}

// Função para enviar email de ativação
async function sendActivationEmail(email, licenseData) {
  try {
    // Implementar envio de email (Resend, SendGrid, etc.)
    console.log('Activation email sent to:', email);
    console.log('License data:', licenseData);
    
    // Exemplo com Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'noreply@almoxpro.com',
    //   to: email,
    //   subject: 'AlmoxPro - Licença Ativada',
    //   html: getActivationEmailTemplate(licenseData)
    // });
    
  } catch (error) {
    console.error('Failed to send activation email:', error);
  }
}
