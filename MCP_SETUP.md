# Configuración MCP (Model Context Protocol)

Este proyecto utiliza MCP para conectar Claude Code con Supabase, permitiendo interacciones directas con la base de datos.

## Archivos de Configuración

### `.mcp.json`
Archivo principal de configuración que define los servidores MCP disponibles.

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase",
        "--supabase-url",
        "https://djzumauhocdopfgjcmyf.supabase.co",
        "--supabase-anon-key",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      ]
    }
  }
}
```

## ¿Qué hace MCP?

MCP permite que Claude Code:
- 📊 Consulte datos directamente de Supabase
- ✏️ Realice operaciones CRUD (Create, Read, Update, Delete)
- 🔍 Ejecute consultas SQL personalizadas
- 📈 Obtenga esquemas y estructuras de tablas
- 🔄 Interactúe con la base de datos en tiempo real

## Tablas Disponibles

El proyecto tiene las siguientes tablas configuradas:

1. **users** - Usuarios de la aplicación
2. **events** - Eventos disponibles
3. **purchases** - Compras realizadas
4. **tickets** - Tickets generados
5. **validations** - Validaciones de tickets

## Uso

Una vez configurado, Claude Code puede:

```
Ejemplos de comandos:
- "Muéstrame todos los eventos activos"
- "Consulta los tickets del usuario X"
- "Verifica el estado de la compra Y"
- "Lista las validaciones recientes"
```

## Seguridad

⚠️ **Importante**:
- El archivo `.mcp.json` contiene credenciales de Supabase
- Las credenciales usadas son la **anon key** (clave pública)
- Esta clave tiene permisos limitados por RLS (Row Level Security)
- NO incluir la **service_role_key** en este archivo

## Sincronización con Variables de Entorno

Las credenciales en `.mcp.json` deben coincidir con las del archivo `.env`:

- `EXPO_PUBLIC_SUPABASE_URL` → debe ser la misma URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` → debe ser la misma anon key

## Actualizar Credenciales

Si cambias tu proyecto de Supabase:

1. Actualiza el archivo `.env` con las nuevas credenciales
2. Actualiza el archivo `.mcp.json` con las mismas credenciales
3. Reinicia Claude Code para aplicar los cambios

## Solución de Problemas

### MCP no se conecta
- Verifica que las credenciales sean correctas
- Asegúrate de que el proyecto Supabase esté activo
- Revisa que tengas conexión a internet

### Errores de permisos
- Verifica las políticas RLS en Supabase
- Asegúrate de usar la anon key correcta
- Revisa los permisos de las tablas

## Referencias

- [Documentación MCP](https://modelcontextprotocol.io/)
- [MCP Supabase Server](https://github.com/supabase/mcp-server-supabase)
- [Documentación Supabase](https://supabase.com/docs)
