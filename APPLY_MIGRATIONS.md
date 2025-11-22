# Guía para Aplicar Migraciones y Crear Usuario Validador

## 1. Aplicar Migración de Políticas RLS

La migración `20250121000000_update_validator_policies.sql` ya está creada y lista para aplicarse.

### Opción A: Aplicar vía Supabase Dashboard (Recomendado)

1. Ir a https://supabase.com/dashboard/project/_/sql/new
2. Copiar y pegar el siguiente SQL:

```sql
-- Migration: Update ticket_validations policies to support qr_validator role

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all validations" ON ticket_validations;
DROP POLICY IF EXISTS "Admins can create validations" ON ticket_validations;
DROP POLICY IF EXISTS "Users can view their own validations" ON ticket_validations;

-- Create new policies that include qr_validator role
CREATE POLICY "Admins and validators can view validations" ON ticket_validations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'qr_validator')
    )
  );

CREATE POLICY "Admins and validators can create validations" ON ticket_validations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'qr_validator')
    )
  );

-- Users can still view their own validations
CREATE POLICY "Users can view their own validations" ON ticket_validations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = ticket_validations.ticket_id
      AND purchases.user_id = auth.uid()
    )
  );
``` 

3. Hacer clic en "Run"

### Opción B: Aplicar vía CLI (Si el comando funciona)

```bash
npx supabase db push --include-all
```

## 2. Crear Usuario Validador

### Opción A: Via Supabase Dashboard

1. Ir a Authentication > Users en el Supabase Dashboard
2. Hacer clic en "Invite user" o "Add user"
3. Ingresar:
   - Email: `validador@test.com`
   - Password: `Validador123!`
4. Confirmar el email manualmente desde el dashboard
5. Luego ejecutar este SQL para asignar el rol:

```sql
UPDATE users
SET role = 'qr_validator'
WHERE email = 'validador@test.com';
```

### Opción B: Via SQL (Completo)

Ejecutar en el SQL Editor del Dashboard:

```sql
-- Insertar usuario en auth.users (si no existe)
-- Nota: Esto debe hacerse manualmente en Authentication > Users del dashboard
-- Después ejecutar:

-- Actualizar el rol del usuario
UPDATE users
SET role = 'qr_validator'
WHERE email = 'validador@test.com';
```

## 3. Verificar las Migraciones

Para verificar que las políticas se aplicaron correctamente:

```sql
-- Ver todas las políticas de ticket_validations
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'ticket_validations';
```

Deberías ver 3 políticas:
- "Admins and validators can view validations"
- "Admins and validators can create validations"
- "Users can view their own validations"

## 4. Probar el Usuario Validador

Una vez creado el usuario:

1. Iniciar sesión en la app con:
   - Email: `validador@test.com`
   - Password: `Validador123!`

2. El usuario debería poder:
   - Acceder a la pantalla `/validator`
   - Ver eventos disponibles
   - Escanear códigos QR
   - Crear validaciones de tickets

## Credenciales de Prueba

### Usuario Validador
- **Email**: validador@test.com
- **Password**: Validador123!
- **Rol**: qr_validator

### Tarjetas de Prueba Culqi (Año 2030)

**Visa - Pago exitoso:**
- Número: 4111111111111111
- CVV: 123
- Fecha: 09/2030

**Mastercard - Pago exitoso:**
- Número: 5111111111111118
- CVV: 123
- Fecha: 09/2030

**Amex - Pago exitoso:**
- Número: 371111111111114
- CVV: 1234
- Fecha: 09/2030

**Visa - Pago rechazado (fondos insuficientes):**
- Número: 4222222222222224
- CVV: 123
- Fecha: 09/2030

**Visa - Pago rechazado (tarjeta robada):**
- Número: 4333333333333335
- CVV: 123
- Fecha: 09/2030
