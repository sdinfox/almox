# 🚀 Deploy do Sistema de Licenças - Vercel

## 📋 ESTRUTURA COMPLETA DEPLOY

### **🏗️ Arquitetura no Vercel:**
```
almoxpro.vercel.app/
├── (Sistema Principal)
│   ├── /                    # App React
│   ├── /api/validate-license  # API Validação
│   ├── /api/activate-license # API Ativação
│   ├── /api/webhooks        # Webhooks Pagamento
│   └── /admin/             # Painel Admin
├── (Banco de Licenças)
│   └── Supabase (PostgreSQL)
└── (Infraestrutura)
    ├── Vercel Functions
    ├── Supabase Database
    └── Stripe/Pagar.me
```

---

## **🔧 PASSO 1: CONFIGURAR SUPABASE LICENÇAS**

### **1. Criar Projeto Supabase:**
1. Acesse [supabase.com](https://supabase.com)
2. Criar novo projeto: `almoxpro-licenses`
3. Copiar URL e Service Key

### **2. Executar Schema:**
```bash
# Copiar e colar no SQL Editor
database/licenses-schema.sql
```

### **3. Configurar Variáveis:**
```bash
# No painel Supabase Settings > Environment Variables
SUPABASE_URL=seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-key
STRIPE_WEBHOOK_SECRET=whsec_...
PAGARME_WEBHOOK_SECRET=...
```

---

## **🔧 PASSO 2: CONFIGURAR VERCEL**

### **1. Enviar para GitHub:**
```bash
git add .
git commit -m "Implementar sistema de licenças"
git push origin main
```

### **2. Configurar Projeto Vercel:**
1. Importar repositório no Vercel
2. Configurar Build Command: `npm run build:prod`
3. Configurar Output Directory: `dist`
4. Configurar Environment Variables:
   ```
   SUPABASE_URL=seu-projeto.supabase.co
   SUPABASE_SERVICE_KEY=sua-service-key
   STRIPE_SECRET=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NODE_ENV=production
   ```

### **3. Deploy Automático:**
- Vercel detecta `vercel.json`
- Configura rotas automaticamente
- Deploy do sistema + APIs

---

## **🔧 PASSO 3: CONFIGURAR PAGAMENTOS**

### **1. Stripe (Recomendado):**
```bash
# Criar conta Stripe
# Configurar produtos:
- Basic: R$ 157/mês
- Professional: R$ 319/mês  
- Enterprise: R$ 535/mês

# Configurar webhooks:
- Endpoint: https://almoxpro.vercel.app/api/webhooks
- Events: checkout.session.completed, invoice.payment_succeeded
```

### **2. Pagar.me (Alternativa):**
```bash
# Criar conta Pagar.me
# Configurar planos
# Configurar webhooks
```

---

## **🔧 PASSO 4: PAINEL ADMINISTRATIVO**

### **1. Criar Painel:**
```bash
# Arquivo: admin/dashboard.js
- Listar licenças ativas
- Verificar validações
- Gerenciar clientes
- Estatísticas de uso
```

### **2. Proteger Painel:**
```javascript
// Middleware de autenticação admin
export async function middleware(req) {
  const token = req.cookies.get('admin_token');
  
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  return NextResponse.next();
}
```

---

## **🔄 FLUXO COMPLETO DE FUNCIONAMENTO:**

### **📱 Cliente Instala Sistema:**
```
1. Baixa AlmoxPro
2. Executa install.bat/install.sh
3. Escolhe PostgreSQL ou Supabase
4. Sistema inicia com trial 15 dias
```

### **🔑 Cliente Ativa Licença:**
```
1. Após 15 dias, sistema pede ativação
2. Cliente compra licença (Stripe/Pagar.me)
3. Recebe chave: ALMX-XXXXX-XXXX
4. Digita chave no sistema
5. Sistema chama: /api/activate-license
6. API ativa licença no banco
7. Sistema libera acesso
```

### **🔍 Validação Contínua:**
```
1. A cada hora, sistema chama: /api/validate-license
2. API verifica status no banco
3. Retorna validade e features
4. Sistema continua funcionando
```

### **💰 Renovação Automática:**
```
1. Stripe cobra mensalmente
2. Webhook: /api/webhooks
3. Sistema renova licença automaticamente
4. Cliente continua usando sem interrupção
```

---

## **📊 MONITORAMENTO E LOGS:**

### **1. Logs Vercel:**
```bash
# Acessar: vercel.com > projeto > Functions
# Verificar:
- Taxa de sucesso de validação
- Erros de API
- Performance
```

### **2. Logs Supabase:**
```bash
# Acessar: supabase.com > projeto > Logs
# Monitorar:
- Novas licenças criadas
- Tentativas de validação
- Falhas de ativação
```

### **3. Dashboard Admin:**
```bash
# Métricas importantes:
- Licenças ativas: 150
- Validações/dia: 3.600
- Taxa de sucesso: 98%
- Receita/mês: R$ 45.000
```

---

## **🚀 TESTE COMPLETO DEPLOY:**

### **1. Testar APIs:**
```bash
# Testar validação
curl -X POST https://almoxpro.vercel.app/api/validate-license \
  -H "Content-Type: application/json" \
  -d '{"key":"ALMX-TEST-1234","machineId":"TEST-123"}'

# Testar ativação
curl -X POST https://almoxpro.vercel.app/api/activate-license \
  -H "Content-Type: application/json" \
  -d '{"key":"ALMX-TEST-1234","machineId":"TEST-123","email":"test@email.com"}'
```

### **2. Testar Sistema:**
```bash
1. Baixar sistema do Vercel
2. Instalar localmente
3. Ativar licença de teste
4. Verificar validação online
5. Testar expiração e renovação
```

---

## **📋 CHECKLIST DEPLOY:**

### **✅ Antes do Deploy:**
- [ ] Schema do banco executado
- [ ] Variáveis de ambiente configuradas
- [ ] APIs testadas localmente
- [ ] Webhooks configurados
- [ ] Build funcionando

### **✅ Após o Deploy:**
- [ ] APIs respondendo no Vercel
- [ ] Banco conectado
- [ ] Webhooks recebendo eventos
- [ ] Sistema validando licenças
- [ ] Logs funcionando

### **✅ Monitoramento:**
- [ ] Dashboard de métricas
- [ ] Alertas de erro
- [ ] Backup automático
- [ ] Performance otimizada

---

## **🎯 RESULTADO ESPERADO:**

### **🏆 Sistema Completo:**
- ✅ **Deploy automático** via Git
- ✅ **APIs de licenciamento** funcionando
- ✅ **Validação online** em tempo real
- ✅ **Pagamentos automáticos**
- ✅ **Monitoramento completo**
- ✅ **Escalabilidade infinita**

### **💰 Receita Automatizada:**
- ✅ **Vendas recorrentes**
- ✅ **Ativação automática**
- ✅ **Renovação automática**
- ✅ **Suporte remoto**

### **🚀 Pronto para Vender:**
- ✅ **Produto profissional**
- ✅ **Infraestrutura robusta**
- ✅ **Suporte 24/7**
- ✅ **Escalável**

---

## **🎯 PRÓXIMOS PASSOS:**

1. **🔧 Fazer deploy** no Vercel agora
2. **🧪 Testar todas** as APIs
3. **💳 Configurar** Stripe/Pagar.me
4. **📊 Criar** dashboard admin
5. **🚀 Lançar** no marketplace

**ESTAMOS PRONTOS PARA O DEPLOY COMPLETO!** 🎯
