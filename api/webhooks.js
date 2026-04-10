// API de Webhooks - Pagamentos e Assinaturas
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Webhook secrets
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const PAGARME_WEBHOOK_SECRET = process.env.PAGARME_WEBHOOK_SECRET;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signature = req.headers['stripe-signature'];
    const body = req.body;

    // Verificar se é webhook do Stripe
    if (signature && STRIPE_WEBHOOK_SECRET) {
      return handleStripeWebhook(req, res, signature, body);
    }

    // Verificar se é webhook do Pagar.me
    if (req.headers['x-hub-signature'] && PAGARME_WEBHOOK_SECRET) {
      return handlePagarmeWebhook(req, res, body);
    }

    return res.status(400).json({ error: 'Invalid webhook' });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Handle Stripe webhooks
async function handleStripeWebhook(req, res, signature, body) {
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
}

// Handle Pagar.me webhooks
async function handlePagarmeWebhook(req, res, body) {
  const { event, data } = body;

  switch (event) {
    case 'charge.paid':
      await handlePagarmePaymentSucceeded(data);
      break;
    case 'subscription.created':
      await handlePagarmeSubscriptionCreated(data);
      break;
    case 'subscription.canceled':
      await handlePagarmeSubscriptionCancelled(data);
      break;
    default:
      console.log(`Unhandled Pagar.me event type ${event}`);
  }

  res.json({ received: true });
}

// Handle checkout completion (criar licença)
async function handleCheckoutCompleted(session) {
  try {
    const { customer_email, metadata } = session;
    const { plan, machineId } = metadata;

    // Gerar chave de licença
    const licenseKey = generateLicenseKey();
    
    // Calcular data de expiração
    const expiryDate = new Date();
    switch (plan) {
      case 'basic':
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        break;
      case 'professional':
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        break;
      case 'enterprise':
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        break;
    }

    // Criar licença no banco
    const { data: license, error } = await supabase
      .from('licenses')
      .insert({
        license_key: licenseKey,
        plan: plan,
        customer_email: customer_email,
        expires_at: expiryDate.toISOString(),
        is_active: false, // Será ativada no primeiro uso
        created_at: new Date().toISOString(),
        stripe_session_id: session.id,
        features: getPlanFeatures(plan)
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating license:', error);
      return;
    }

    // Enviar email com a chave de licença
    await sendLicenseEmail(customer_email, {
      licenseKey,
      plan,
      expiryDate: expiryDate.toISOString()
    });

    console.log('License created successfully:', licenseKey);

  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

// Handle payment succeeded (renovação)
async function handlePaymentSucceeded(invoice) {
  try {
    const { subscription, customer_email } = invoice;
    
    // Buscar licença associada
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('stripe_subscription_id', subscription)
      .single();

    if (error || !license) {
      console.log('License not found for subscription:', subscription);
      return;
    }

    // Renovar licença
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    await supabase
      .from('licenses')
      .update({
        expires_at: expiryDate.toISOString(),
        is_active: true,
        last_renewed: new Date().toISOString()
      })
      .eq('id', license.id);

    // Enviar email de renovação
    await sendRenewalEmail(customer_email, {
      plan: license.plan,
      expiryDate: expiryDate.toISOString()
    });

    console.log('License renewed successfully:', license.license_key);

  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

// Handle payment failed
async function handlePaymentFailed(invoice) {
  try {
    const { subscription, customer_email } = invoice;
    
    // Buscar licença
    const { data: license } = await supabase
      .from('licenses')
      .select('*')
      .eq('stripe_subscription_id', subscription)
      .single();

    if (license) {
      // Enviar email de falha
      await sendPaymentFailedEmail(customer_email, {
        plan: license.plan,
        nextRetry: invoice.next_payment_attempt
      });
    }

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Handle subscription cancelled
async function handleSubscriptionCancelled(subscription) {
  try {
    // Buscar licença
    const { data: license } = await supabase
      .from('licenses')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (license) {
      // Marcar como inativa (mas manter até expirar)
      await supabase
        .from('licenses')
        .update({
          is_active: false,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', license.id);

      // Enviar email de cancelamento
      await sendCancellationEmail(license.customer_email, {
        plan: license.plan,
        expiresAt: license.expires_at
      });
    }

  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
  }
}

// Funções utilitárias
function generateLicenseKey() {
  const prefix = 'ALMX';
  const randomPart = Math.random().toString(36).substr(2, 9).toUpperCase();
  const checksum = crypto.createHash('md5').update(prefix + randomPart).digest('hex').substr(0, 4).toUpperCase();
  return `${prefix}-${randomPart}-${checksum}`;
}

function getPlanFeatures(plan) {
  const features = {
    basic: ['users_5', 'materials_1000', 'basic_reports', 'email_support'],
    professional: ['users_20', 'materials_5000', 'advanced_reports', 'api_access', 'priority_support'],
    enterprise: ['users_unlimited', 'materials_unlimited', 'multi_branch', 'custom_api', 'dedicated_support', 'sla']
  };
  
  return features[plan] || [];
}

// Funções de email (placeholders)
async function sendLicenseEmail(email, data) {
  console.log('License email sent to:', email, data);
  // Implementar envio de email
}

async function sendRenewalEmail(email, data) {
  console.log('Renewal email sent to:', email, data);
  // Implementar envio de email
}

async function sendPaymentFailedEmail(email, data) {
  console.log('Payment failed email sent to:', email, data);
  // Implementar envio de email
}

async function sendCancellationEmail(email, data) {
  console.log('Cancellation email sent to:', email, data);
  // Implementar envio de email
}
