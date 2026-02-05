
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
├── frontend/             # React (Vite)
│   ├── index.html        # ⚠️ REQUERIDO - Punto de entrada HTML
│   ├── src/              # Código fuente React
│   ├── package.json      # Dependencias del frontend
│   └── vite.config.js    # Configuración de Vite
├── backend/              # (Obsoleto/Referencia) Código Express antiguo
├── package.json          # Dependencias para las funciones serverless
└── vercel.json           # ⚠️ Configuración de Vercel (routing y build)
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

## Deploy en Vercel

### Configuración del Proyecto

1. **Conecta tu repositorio** a Vercel (GitHub, GitLab, o Bitbucket)

2. **Configuración Automática**: El archivo `vercel.json` ya está configurado con:
   - Framework: Vite
   - Build command automático
   - Output directory: `frontend/dist`
   - Routing para API y frontend

3. **Variables de Entorno**: Configura las variables mencionadas arriba en Settings > Environment Variables
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`

### Estructura Requerida

Vercel necesita:

- ✅ `frontend/index.html` - Punto de entrada (ya creado)
- ✅ `frontend/src/main.jsx` - Entrada de React
- ✅ `api/*` - Funciones serverless (en la raíz del proyecto)

### Verificación Post-Deploy

Después del deploy, verifica:

1. Frontend accesible en `https://tu-proyecto.vercel.app`
2. API endpoints funcionando en `https://tu-proyecto.vercel.app/api/*`
3. Autenticación con Supabase operativa
4. Variables de entorno configuradas correctamente
