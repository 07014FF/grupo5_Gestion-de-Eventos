# 🚨 SOLUCIÓN URGENTE: Error "No hay tickets disponibles"

## Problema
Los eventos en la base de datos tienen `available_tickets = 0` o `NULL`, lo que impide crear compras.

## Solución Rápida (5 minutos)

### Opción 1: Ejecutar SQL manualmente en Supabase Dashboard

1. **Abre tu dashboard de Supabase**: https://supabase.com/dashboard
2. **Ve a SQL Editor** (ícono de base de datos en la barra lateral)
3. **Copia y pega este SQL**:

```sql
-- Ver eventos con problemas
SELECT id, title, available_tickets, total_tickets
FROM public.events
WHERE available_tickets IS NULL OR available_tickets <= 0;

-- ARREGLAR: Actualizar todos los eventos
UPDATE public.events
SET available_tickets = COALESCE(total_tickets, 100)
WHERE available_tickets IS NULL OR available_tickets <= 0;

-- Verificar que se arregló
SELECT id, title, available_tickets, total_tickets
FROM public.events
ORDER BY created_at DESC
LIMIT 10;
```

4. **Presiona "Run"** o `Ctrl+Enter`
5. **¡Listo!** Ahora prueba comprar tickets nuevamente

### Opción 2: Aplicar migraciones desde CLI

Si tienes Supabase CLI instalado:

```bash
cd /home/mateo/Escritorio/VScode/Github/grupo5_Gestion-de-Eventos
npx supabase db push
```

**Nota:** Este comando puede tardar. Si tarda más de 30 segundos, usa la Opción 1.

## ¿Por qué pasó esto?

- Los eventos se crearon sin `available_tickets` o con valor 0
- El trigger `decrement_available_tickets` requiere que haya tickets disponibles
- La migración que creamos arreglará esto automáticamente una vez aplicada

## Después de arreglar

Una vez que ejecutes el SQL, el código ya tiene protecciones para:
- ✅ Detectar eventos sin tickets
- ✅ Intentar arreglarlos automáticamente
- ✅ Insertar tickets uno por uno (compatible con el trigger)
- ✅ Hacer rollback automático si falla
- ✅ Mostrar mensajes de error claros

## ¿Necesitas ayuda?

Si el problema persiste después de ejecutar el SQL, revisa los logs y busca estos mensajes:
- `⚠️ Evento sin tickets disponibles, intentando actualizar...`
- `✅ available_tickets actualizado`
- `❌ Error insertando ticket:`
