# 🔧 Solución: Error de Recursión Infinita en RLS

## 🐛 El Problema

Estás viendo este error:
```
Error loading user profile:
{"code":"42P17","details":null,"hint":null,"message":"Infinite recursion detected in policy for relation \"users\""}
```

**Causa:** Las políticas de Row Level Security (RLS) de la tabla `users` estaban creando un loop infinito porque para verificar si un usuario es admin, hacían una consulta a la misma tabla `users`, lo que activaba las mismas políticas nuevamente, y así infinitamente.

---

## ✅ La Solución

He creado un script SQL que:

1. **Crea una función helper** (`get_user_role`) que obtiene el rol del usuario sin activar las políticas RLS
2. **Elimina las políticas problemáticas**
3. **Recrea las políticas** usando la función helper en lugar de hacer SELECT directo

---

## 📝 Pasos para Solucionar

### Paso 1: Ir a Supabase Dashboard

1. Abre tu navegador
2. Ve a: https://supabase.com/dashboard
3. Selecciona tu proyecto: `djzumauhocdopfgjcmyf`

### Paso 2: Abrir SQL Editor

1. En el menú lateral izquierdo, haz clic en **"SQL Editor"**
2. Haz clic en **"New query"** (o el botón "+" verde)

### Paso 3: Ejecutar el Script de Solución

1. Abre el archivo: `supabase/fix-rls-policies.sql` en tu editor
2. **Copia TODO el contenido** del archivo (Ctrl+A, Ctrl+C)
3. **Pega** en el SQL Editor de Supabase (Ctrl+V)
4. Haz clic en **"Run"** (botón verde en la esquina inferior derecha)

### Paso 4: Verificar Resultados

Deberías ver en los resultados:

#### Tabla 1: Políticas de users
```
┌─────────────┬───────────┬──────────────────────────────┬────────┬─────┐
│ schemaname  │ tablename │ policyname                   │ cmd    │ ... │
├─────────────┼───────────┼──────────────────────────────┼────────┼─────┤
│ public      │ users     │ Admins can view all users    │ SELECT │     │
│ public      │ users     │ Users can insert own profile │ INSERT │     │
│ public      │ users     │ Users can update own profile │ UPDATE │     │
│ public      │ users     │ Users can view own profile   │ SELECT │     │
└─────────────┴───────────┴──────────────────────────────┴────────┴─────┘
```

#### Tabla 2: Función creada
```
┌───────────────┬──────────────────────┬────────────┐
│ function_name │ is_security_definer  │ volatility │
├───────────────┼──────────────────────┼────────────┤
│ get_user_role │ true                 │ s          │
└───────────────┴──────────────────────┴────────────┘
```

✅ Si ves estas 2 tablas con datos similares, **la solución fue exitosa**.

### Paso 5: Probar en la App

1. **Cierra completamente** la aplicación (si está abierta)
2. **Reinicia** el servidor:
   ```bash
   npm start
   ```
3. En la app, intenta hacer **login** con uno de estos usuarios:

   **Cliente:**
   - Email: `cliente@ticketapp.com`
   - Password: `Cliente123!`

   **Admin:**
   - Email: `admin@ticketapp.com`
   - Password: `Admin123!`

4. **Verifica** que:
   - ✅ El login funciona sin errores
   - ✅ Puedes ver tu perfil
   - ✅ El rol aparece correctamente (badge en pantalla de perfil)
   - ✅ No hay errores en la consola

---

## 🔍 ¿Qué Cambió Exactamente?

### ❌ ANTES (con recursión):

```sql
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users  -- ⚠️ Consulta la misma tabla!
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
```

Cuando un admin intentaba ver usuarios:
1. PostgreSQL ejecuta la política
2. La política hace SELECT de `users`
3. Ese SELECT activa la misma política nuevamente
4. Loop infinito ♾️

### ✅ AHORA (sin recursión):

```sql
-- Función helper con SECURITY DEFINER (ignora RLS)
CREATE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
SECURITY DEFINER  -- 🔑 Clave: ignora las políticas
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- Política usa la función en lugar de SELECT directo
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );
```

Ahora cuando un admin intenta ver usuarios:
1. PostgreSQL ejecuta la política
2. La política llama a `get_user_role()`
3. La función se ejecuta con `SECURITY DEFINER`, **sin activar políticas**
4. Retorna el rol directamente
5. ✅ Sin recursión

---

## 🧪 Testing Completo

Después de aplicar el fix, prueba estos escenarios:

### Como Cliente:
- [ ] Login con `cliente@ticketapp.com`
- [ ] Ver perfil → debe mostrar badge "CLIENTE"
- [ ] Ver eventos disponibles
- [ ] Comprar un ticket
- [ ] Ver "Mis Entradas"

### Como Admin:
- [ ] Login con `admin@ticketapp.com`
- [ ] Ver perfil → debe mostrar badge "ADMINISTRADOR"
- [ ] Ir a pestaña "QR"
- [ ] Ver lista de todos los tickets (si hay)

### Como Super Admin:
- [ ] Login con `superadmin@ticketapp.com`
- [ ] Ver perfil → debe mostrar badge "SUPER ADMIN"
- [ ] Todos los permisos de admin funcionan

---

## 🆘 Si Aún Hay Errores

### Error: "Function get_user_role does not exist"

**Solución:**
- El script no se ejecutó completamente
- Vuelve a ejecutar el script completo en SQL Editor

### Error: "Permission denied for relation users"

**Solución:**
```sql
-- Ejecuta esto en SQL Editor:
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
```

### Error: "Could not load user profile"

**Solución:**
```sql
-- Verifica que tu usuario existe:
SELECT id, email, role FROM public.users WHERE email = 'TU_EMAIL';

-- Si no existe, créalo:
INSERT INTO public.users (id, name, email, role)
VALUES (
  'TU_AUTH_USER_ID',
  'Tu Nombre',
  'TU_EMAIL',
  'client'
);
```

### Los roles no aparecen en la app

**Solución:**
1. Cierra sesión en la app
2. Cierra completamente la app
3. Reinicia: `npm start`
4. Vuelve a hacer login
5. Verifica en Supabase que el rol está en la BD:
   ```sql
   SELECT email, role FROM public.users;
   ```

---

## 📊 Verificación Final

Ejecuta esto en SQL Editor para ver el estado actual:

```sql
-- Ver todos los usuarios y sus roles
SELECT
  id,
  name,
  email,
  role,
  created_at
FROM public.users
ORDER BY
  CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'client' THEN 3
  END;

-- Ver todas las políticas de users
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Probar la función get_user_role
SELECT public.get_user_role(auth.uid()) as my_role;
```

**Resultado esperado:**
- 3 usuarios con roles correctos
- 4 políticas en la tabla users
- Tu rol actual se muestra correctamente

---

## ✅ Conclusión

Una vez ejecutado el script `fix-rls-policies.sql`:

✅ **Error de recursión infinita: SOLUCIONADO**
✅ **Login funciona correctamente**
✅ **Roles se cargan sin problemas**
✅ **Políticas RLS funcionando sin loops**

---

**Próximo paso:** Si todo funciona, podemos continuar con las mejoras de la app.

**Tiempo estimado:** 5 minutos para ejecutar el fix y verificar.

---

**Fecha de creación:** 21 de Octubre, 2025
**Archivo de solución:** `supabase/fix-rls-policies.sql`
