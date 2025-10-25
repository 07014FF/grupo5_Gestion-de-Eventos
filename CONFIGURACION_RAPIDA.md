# ⚡ Guía de Configuración Rápida

**Tiempo estimado:** 15-30 minutos

---

## 🎯 Pasos para Tener el Proyecto Funcionando

### 1️⃣ Ejecutar Migración de Base de Datos (5 min)

```sql
-- Abre Supabase Dashboard → SQL Editor
-- Ejecuta el archivo: supabase/update-purchases-payment-fields.sql
```

O copia y pega esto:

```sql
ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'mock',
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT,
ADD COLUMN IF NOT EXISTS payment_metadata JSONB,
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_purchases_transaction_id
ON public.purchases(payment_transaction_id);

CREATE INDEX IF NOT EXISTS idx_purchases_payment_status
ON public.purchases(payment_status);
```

### 2️⃣ Crear Usuario Admin (2 min)

```sql
-- 1. Registra un usuario normalmente desde la app
-- 2. Ejecuta esto reemplazando TU_EMAIL:

UPDATE public.users
SET role = 'admin'
WHERE email = 'tu_email@ejemplo.com';

-- 3. Verifica:
SELECT name, email, role FROM public.users WHERE email = 'tu_email@ejemplo.com';
```

### 3️⃣ Probar el Proyecto (5 min)

```bash
# Iniciar la app
npm start

# O con caché limpia
npx expo start -c
```

**Como Cliente:**
1. Registrarse
2. Ver eventos en Home
3. Comprar entrada (usará Mock payment)
4. Ver "Mis Entradas"
5. Ver QR

**Como Admin:**
1. Login con cuenta admin
2. Ir a Perfil
3. Click "Panel de Administración"
4. Ver estadísticas
5. Click "Crear Evento"
6. Crear un evento de prueba

---

## 🚀 Configuración de Producción (Opcional)

### Paso 1: Obtener Credenciales de Wompi

1. Ir a https://comercios.wompi.co/
2. Crear cuenta
3. Obtener credenciales de TEST primero:
   - Public Key
   - Private Key
   - Event Secret

4. Actualizar `.env`:
```env
EXPO_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_TU_KEY_AQUI
EXPO_PUBLIC_WOMPI_PRIVATE_KEY=prv_test_TU_KEY_AQUI
EXPO_PUBLIC_WOMPI_EVENT_SECRET=tu_secret_aqui
```

5. Reiniciar app: `npm start`

### Paso 2: Desplegar Webhook

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Vincular proyecto
supabase link --project-ref djzumauhocdopfgjcmyf

# Desplegar
supabase functions deploy payment-webhook
```

Copiar la URL que te da (ejemplo):
```
https://djzumauhocdopfgjcmyf.supabase.co/functions/v1/payment-webhook
```

### Paso 3: Configurar Webhook en Wompi

1. Ir a Wompi Dashboard → Webhooks
2. Agregar nueva URL (la del paso anterior)
3. Seleccionar evento: `transaction.updated`
4. Guardar

### Paso 4: Configurar Secret en Supabase

1. Supabase Dashboard → Settings → Edge Functions
2. Agregar secret:
   - Name: `WOMPI_EVENT_SECRET`
   - Value: (el secret de Wompi)

---

## ✅ Checklist de Configuración

### Básico (Para Testing)
- [ ] Migración de BD ejecutada
- [ ] Usuario admin creado
- [ ] App iniciada (`npm start`)
- [ ] Evento de prueba creado desde admin panel
- [ ] Compra de ticket probada (Mock)
- [ ] QR validado

### Producción (Para Usar Wompi Real)
- [ ] Cuenta Wompi creada
- [ ] Credenciales en `.env`
- [ ] Webhook desplegado
- [ ] Webhook configurado en Wompi
- [ ] Secret configurado en Supabase
- [ ] Probado con tarjeta de prueba

---

## 🐛 Troubleshooting

### Error: "Cannot find module"
```bash
npm install
npx expo start -c
```

### Error: "Invalid API key"
```bash
# Verifica .env tiene las credenciales correctas
# Reinicia: npm start
```

### No aparece el botón de Admin Panel
```sql
-- Verifica el rol del usuario:
SELECT role FROM public.users WHERE email = 'tu_email@ejemplo.com';

-- Si no es 'admin', actualiza:
UPDATE public.users SET role = 'admin' WHERE email = 'tu_email@ejemplo.com';
```

### Webhook no funciona
```bash
# Ver logs:
supabase functions logs payment-webhook

# Re-desplegar:
supabase functions deploy payment-webhook
```

---

## 📝 Tarjetas de Prueba Wompi

Una vez tengas credenciales de Wompi, usa estas tarjetas de prueba:

**Visa - Aprobada:**
- Número: `4242 4242 4242 4242`
- Vencimiento: Cualquier fecha futura
- CVC: Cualquier 3 dígitos

**Visa - Rechazada:**
- Número: `4111 1111 1111 1111`

**Mastercard - Aprobada:**
- Número: `5555 5555 5555 4444`

---

## 🎉 ¡Listo!

Tu app de tickets está funcionando con:
- ✅ Pagos (Mock o Wompi según configuración)
- ✅ Panel de Admin
- ✅ Webhooks (si desplegaste)
- ✅ QR Generation & Validation
- ✅ PDF Downloads

**Para preguntas o problemas:**
- Ver documentación completa: `FUNCIONALIDADES_CRITICAS_IMPLEMENTADAS.md`
- Ver guía de pagos: `INTEGRACION_PAGOS.md`
- Ver progreso: `PROGRESO_PROYECTO.md`

---

**¡Feliz desarrollo! 🚀**
