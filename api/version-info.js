// API para verificar versão do sistema
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Detectar versão
    const versionInfo = {
      mode: 'vercel', // Se está rodando no Vercel
      environment: process.env.NODE_ENV || 'production',
      host: req.headers.host,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
      vercel: {
        region: process.env.VERCEL_REGION || 'unknown',
        deployment: process.env.VERCEL_DEPLOYMENT_ID || 'unknown'
      },
      database: 'supabase', // Assumir Supabase para Vercel
      apis: {
        validateLicense: `${req.protocol}://${req.headers.host}/api/validate-license`,
        activateLicense: `${req.protocol}://${req.headers.host}/api/activate-license`,
        webhooks: `${req.protocol}://${req.headers.host}/api/webhooks`
      }
    };

    return res.status(200).json(versionInfo);

  } catch (error) {
    console.error('Version info error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      mode: 'unknown'
    });
  }
}
