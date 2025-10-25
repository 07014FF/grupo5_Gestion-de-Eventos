# Supabase Edge Functions

## Payment Webhook Function

Esta función maneja los webhooks de Wompi para confirmar pagos.

### Instalación y Despliegue

#### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

#### 2. Login a Supabase

```bash
supabase login
```

#### 3. Vincular tu proyecto

```bash
supabase link --project-ref djzumauhocdopfgjcmyf
```

#### 4. Configurar variables de entorno

Agregar en Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```
WOMPI_EVENT_SECRET=tu_event_secret_de_wompi
```

#### 5. Desplegar la función

```bash
supabase functions deploy payment-webhook
```

#### 6. Obtener la URL de la función

Después del deploy, obtendrás una URL como:
```
https://djzumauhocdopfgjcmyf.supabase.co/functions/v1/payment-webhook
```

#### 7. Configurar webhook en Wompi

1. Ve a https://comercios.wompi.co/
2. Dashboard → Webhooks
3. Agregar nueva URL: `https://djzumauhocdopfgjcmyf.supabase.co/functions/v1/payment-webhook`
4. Seleccionar evento: `transaction.updated`
5. Guardar

### Testing Local

```bash
# Servir función localmente
supabase functions serve payment-webhook --env-file .env

# Probar con curl
curl -X POST http://localhost:54321/functions/v1/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "transaction.updated",
    "data": {
      "transaction": {
        "id": "test-123",
        "reference": "PAY-123456",
        "status": "APPROVED"
      }
    }
  }'
```

### Logs

Ver logs de la función:

```bash
supabase functions logs payment-webhook
```

### Seguridad

- ✅ Verifica firma de Wompi (checksum)
- ✅ Usa SUPABASE_SERVICE_ROLE_KEY (no anon key)
- ✅ Valida estructura del payload
- ✅ CORS configurado

### Eventos Soportados

- `transaction.updated` - Cuando cambia el estado de una transacción

### Flujo

1. Wompi envía webhook cuando una transacción cambia de estado
2. Función verifica firma
3. Busca la compra en la base de datos
4. Actualiza estado del pago
5. Activa o cancela tickets según el resultado
6. Responde a Wompi con confirmación
