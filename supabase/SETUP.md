# 🚀 Guía de Configuración de Supabase

## Paso 1: Crear un Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratuita
2. Haz clic en "New Project"
3. Completa los datos:
   - **Name**: Nombre de tu proyecto (ej: "ticket-system")
   - **Database Password**: Guarda esta contraseña en un lugar seguro
   - **Region**: Selecciona la más cercana (ej: South America - São Paulo)
4. Haz clic en "Create new project" (tomará ~2 minutos)

## Paso 2: Configurar la Base de Datos

1. En el panel izquierdo, ve a **SQL Editor**
2. Haz clic en "+ New query"
3. Copia TODO el contenido del archivo `schema.sql`
4. Pega en el editor SQL
5. Haz clic en **Run** (o presiona Ctrl+Enter)
6. Verifica que no haya errores (debería decir "Success")

## Paso 3: Obtener las Credenciales

1. En el panel izquierdo, ve a **Project Settings** (ícono de engranaje)
2. Ve a **API**
3. Encontrarás:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: Una clave larga que empieza con `eyJ...`

## Paso 4: Configurar Variables de Entorno

1. En la raíz del proyecto, copia `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Abre el archivo `.env` y agrega tus credenciales:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI... (tu clave completa)
   ```

3. Guarda el archivo

## Paso 5: Configurar Autenticación

1. En Supabase, ve a **Authentication** > **Providers**
2. Asegúrate de que **Email** esté habilitado
3. Configura las siguientes opciones:
   - **Enable email confirmations**: OFF (para desarrollo)
   - **Enable email invites**: OFF (para desarrollo)

   > Para producción, activa estas opciones y configura templates de email

## Paso 6: Crear Usuarios de Prueba (Opcional)

### Cliente de Prueba:
1. Ve a **Authentication** > **Users**
2. Haz clic en **Add user** > **Create new user**
3. Completa:
   - Email: `cliente@test.com`
   - Password: `password123`
   - Auto Confirm User: ✅ (activado)
4. Copia el User ID generado

### Crear Perfil del Cliente:
1. Ve a **SQL Editor**
2. Ejecuta:
   ```sql
   INSERT INTO public.users (id, name, email, role)
   VALUES ('USER_ID_COPIADO', 'Cliente Test', 'cliente@test.com', 'client');
   ```

### Administrador de Prueba:
1. Crea otro usuario:
   - Email: `admin@test.com`
   - Password: `admin123`
2. Copia su User ID
3. Crea su perfil con rol admin:
   ```sql
   INSERT INTO public.users (id, name, email, role)
   VALUES ('USER_ID_ADMIN', 'Admin Test', 'admin@test.com', 'admin');
   ```

## Paso 7: Agregar Eventos de Prueba

```sql
INSERT INTO public.events (title, subtitle, date, time, location, price, available_tickets, total_tickets, category, status)
VALUES
  ('Festival de Jazz 2024', 'Centro Cultural', '2025-01-20', '19:30', 'Bogotá', 45000, 150, 150, 'Música', 'active'),
  ('Concierto Rock', 'Parque de la 93', '2025-01-25', '20:00', 'Bogotá', 60000, 200, 200, 'Música', 'active'),
  ('Teatro: El Quijote', 'Teatro Nacional', '2025-01-15', '18:00', 'Bogotá', 35000, 100, 100, 'Teatro', 'active'),
  ('Stand Up Comedy Night', 'Casa del Humor', '2025-02-10', '21:00', 'Medellín', 30000, 80, 80, 'Comedia', 'active'),
  ('Exposición de Arte Moderno', 'Museo Nacional', '2025-02-05', '10:00', 'Bogotá', 15000, 300, 300, 'Arte', 'active');
```

## Paso 8: Verificar la Instalación

1. Reinicia el servidor de desarrollo:
   ```bash
   npm start
   ```

2. Abre la app y verifica:
   - ✅ No hay errores de configuración
   - ✅ Puedes ver eventos
   - ✅ Puedes hacer login

## 🔥 Comandos Útiles de SQL

### Ver todos los usuarios:
```sql
SELECT * FROM public.users;
```

### Ver todos los eventos:
```sql
SELECT * FROM public.events;
```

### Ver compras:
```sql
SELECT p.*, u.name as user_name, e.title as event_title
FROM public.purchases p
JOIN public.users u ON p.user_id = u.id
JOIN public.events e ON p.event_id = e.id
ORDER BY p.created_at DESC;
```

### Ver tickets:
```sql
SELECT t.*, e.title as event_title
FROM public.tickets t
JOIN public.events e ON t.event_id = e.id
ORDER BY t.created_at DESC;
```

## 🐛 Solución de Problemas

### Error: "Invalid API key"
- Verifica que copiaste bien la clave `anon public` key
- Asegúrate de que el archivo `.env` está en la raíz del proyecto
- Reinicia el servidor de desarrollo

### Error: "Row Level Security"
- Asegúrate de ejecutar TODO el archivo `schema.sql`
- Verifica que las policies estén creadas:
  ```sql
  SELECT * FROM pg_policies WHERE schemaname = 'public';
  ```

### No puedo insertar datos
- Verifica que el usuario esté autenticado
- Verifica que el usuario tenga el rol correcto en `public.users`
- Revisa las policies de la tabla

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Realtime](https://supabase.com/docs/guides/realtime)

## ✅ Checklist de Configuración

- [ ] Proyecto creado en Supabase
- [ ] Schema SQL ejecutado sin errores
- [ ] Variables de entorno configuradas en `.env`
- [ ] Email auth habilitado
- [ ] Usuarios de prueba creados
- [ ] Eventos de prueba agregados
- [ ] App funcionando sin errores
