
# Guía de Migración a Vercel Serverless

Este proyecto ha sido migrado para funcionar 100% en la infraestructura Serverless de Vercel, eliminando la necesidad de un servidor Express persistente.

## Estructura Final

```
/
├── api/                  # Serverless Functions (Backend Reemplazo)
│   ├── _lib/             # Lógica compartida (Supabase, Auth, Utils)
│   ├── auth/             # Endpoints Auth (login, register, me)
│   ├── admin/            # Endpoints Admin
│   ├── appointments/     # Endpoints Citas
│   ├── customers/        # Endpoints Clientes
│   ├── employees/        # Endpoints Empleados
│   ├── gamification/     # Endpoints Gamification
│   └── services/         # Endpoints Servicios
├── frontend/             # React (Vite) - Sin cambios mayores
├── backend/              # (Obsoleto/Referencia) Código Express antiguo
└── package.json          # Dependencias para las funciones serverless
```

## Variables de Entorno (Vercel)

Configura estas variables en tu proyecto de Vercel (Settings > Environment Variables):

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL de tu proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Key "service_role" (¡No la anon key!) para acceso total de backend |
| `JWT_SECRET` | Secreto para firmar tokens (mismo que el anterior si quieres mantener sesiones) |

## Verificación Pre-Deploy

1. **Supabase**: Asegúrate de que las tablas en Supabase existen y coinciden con lo que espera el código (business_users, customers, appointments, services, etc.). El código asume que el esquema ya existe ("No modificar DB").
2. **Dependencies**: El archivo `package.json` en la raíz maneja las dependencias del backend serverless.
3. **Frontend**: El frontend usa rutas relativas `/api/*`. En Vercel, esto se enruta automáticamente a las funciones en la carpeta `api/`.

## Cómo correr localmente

Usa Vercel CLI para simular el entorno de producción:

```bash
npm install -g vercel
vercel dev
```

Esto levantará el frontend y las funciones backend en un solo puerto (usualmente localhost:3000).

## Notas sobre Transacciones

Debido a la naturaleza stateless de las funciones y al uso de Supabase HTTP API, algunas operaciones complejas (como `completeAppointment`) se ejecutan secuencialmente en lugar de en una transacción SQL atómica. Esto es aceptable para la mayoría de casos de uso SaaS, pero tenlo en cuenta si hay fallos de red en medio de una operación.
