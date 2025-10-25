# ⚡ Inicio Rápido - Para Retomar Mañana

## 🚀 Comando para Iniciar
```bash
npm start
```

---

## ✅ Lo que YA Funciona

1. ✅ **Backend Supabase** configurado
2. ✅ **Login/Registro** real
3. ✅ **Comprar tickets** (se guarda en BD)
4. ✅ **Ver mis entradas** (carga de BD)
5. ✅ **Generar QR** y descargar PDF
6. ✅ **Escanear QR** con cámara
7. ✅ **Validar tickets** (marca como usado)

---

## 📝 Usuarios de Prueba

### Cliente:
- Registrarse desde la app
- Click "Login" → "Regístrate"

### Admin (Para validar tickets):
1. Registrar usuario normal
2. En Supabase SQL Editor:
```sql
UPDATE public.users SET role = 'admin'
WHERE email = 'TU_EMAIL';
```

---

## 🔍 Ver Datos en Supabase

```sql
-- Ver eventos
SELECT * FROM public.events;

-- Ver tickets
SELECT * FROM public.tickets;

-- Ver usuarios
SELECT * FROM public.users;
```

---

## 🎯 Próximos Pasos

### 1. Migrar Home a Supabase (30 min)
Archivo: `app/(tabs)/index.tsx`
- Cambiar mock data por `EventService.getActiveEvents()`

### 2. Crear Usuario Admin (5 min)
- Registrar desde app
- Cambiar rol en BD

### 3. Probar Flujo Completo (15 min)
- Comprar ticket como cliente
- Escanear QR como admin
- Validar entrada

---

## 📚 Archivos Clave

- **`PROGRESO_PROYECTO.md`** - Todo el detalle completo
- **`supabase/SETUP.md`** - Configuración de Supabase
- **`.env`** - Credenciales (✅ configurado)

---

## 🐛 Si Algo Falla

```bash
# Limpiar caché
npx expo start -c

# Verificar credenciales
cat .env
```

---

**¡Listo para continuar! 🎉**
