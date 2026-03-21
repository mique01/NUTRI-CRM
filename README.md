# NutriCRM

CRM para nutricionistas construido con `React + Vite + Supabase`, listo para subir a GitHub y desplegar en Vercel.

## Que incluye

- Login con Google usando Supabase Auth.
- Solicitudes de acceso por mail al administrador con aprobacion por link.
- Consultorio compartido entre nutricionistas del mismo espacio.
- Pacientes compartidos, historia clinica editable, notas y archivos privados.
- Turnos preparados para una futura sincronizacion con Google Calendar.
- RLS, buckets y funciones SQL listas en un solo archivo.

## 1. Crear proyecto en Supabase

1. Crea un proyecto nuevo en [Supabase](https://supabase.com/).
2. Abre `SQL Editor`.
3. Pega completo el archivo [setup.sql](/C:/Users/Miqueas00/Desktop/crm%20cami/supabase/setup.sql).
4. Ejecutalo una vez.

## 2. Configurar Google OAuth en Supabase

1. En Supabase ve a `Authentication > Providers > Google`.
2. Activa Google.
3. En Google Cloud crea credenciales OAuth web.
4. Agrega estas URLs de redirect:
   - local: `http://localhost:8080/auth/callback`
   - produccion: `https://TU-DOMINIO-VERCEL/auth/callback`
5. En Supabase carga el `Client ID` y `Client Secret` de Google.
6. En `Authentication > URL Configuration` define:
   - `Site URL`: `http://localhost:8080` en local y luego tu dominio real en produccion
   - `Redirect URLs`: agrega tambien `http://localhost:8080/auth/callback` y tu callback productivo

## 3. Variables de entorno

Crea un archivo `.env.local` basado en [.env.example](/C:/Users/Miqueas00/Desktop/crm%20cami/.env.example):

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
ILOVEPDF_PUBLIC_KEY=your-ilovepdf-public-key
ILOVEPDF_SECRET_KEY=your-ilovepdf-secret-key
SUPABASE_SERVICE_ROLE_KEY=your-server-side-service-role-key
ACCESS_REQUEST_ADMIN_EMAIL=admin@example.com
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=NutriCRM <onboarding@resend.dev>
APP_BASE_URL=https://your-vercel-app.vercel.app
```

`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` y `ACCESS_REQUEST_ADMIN_EMAIL` se usan solo del lado serverless en Vercel.

## 4. Desarrollo local

```bash
npm.cmd install
npm.cmd run dev
```

La app queda en `http://localhost:8080`.

## 5. Flujo inicial de uso

1. Entra con Google.
2. Si es la primera cuenta, vas a `Setup` y creas el consultorio.
3. Si otra persona intenta entrar con Google y todavia no tiene acceso, la app registra la solicitud y le manda un mail al administrador.
4. El administrador aprueba la cuenta desde el link del mail.
5. A partir de ahi, esa persona ya puede entrar al CRM con Google.

## 6. Deploy en GitHub + Vercel

1. Sube este proyecto a un repo nuevo en GitHub.
2. En Vercel, importa el repo.
3. Framework preset: `Vite`.
4. Agrega estas variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `ILOVEPDF_PUBLIC_KEY`
   - `ILOVEPDF_SECRET_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ACCESS_REQUEST_ADMIN_EMAIL`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `APP_BASE_URL`
5. Deploya.
6. Vuelve a Supabase y actualiza las URLs OAuth productivas si cambio el dominio.

El archivo [vercel.json](/C:/Users/Miqueas00/Desktop/crm%20cami/vercel.json) ya deja resueltas las rutas SPA y mantiene libre `/api` para las funciones serverless.

## Estructura importante

- [supabase/setup.sql](/C:/Users/Miqueas00/Desktop/crm%20cami/supabase/setup.sql): tablas, funciones, RLS y storage.
- [src/lib/supabase.ts](/C:/Users/Miqueas00/Desktop/crm%20cami/src/lib/supabase.ts): cliente Supabase.
- [src/context/AuthContext.tsx](/C:/Users/Miqueas00/Desktop/crm%20cami/src/context/AuthContext.tsx): sesion, perfil y consultorio actual.
- [src/services](/C:/Users/Miqueas00/Desktop/crm%20cami/src/services): capa tipada del frontend.
- [api/request-access.js](/C:/Users/Miqueas00/Desktop/crm%20cami/api/request-access.js): crea la solicitud y manda el mail al admin.
- [api/approve-access.js](/C:/Users/Miqueas00/Desktop/crm%20cami/api/approve-access.js): aprueba el acceso desde el link del mail.

## Pendiente para una segunda etapa

- Sincronizacion real con Google Calendar.
- Exportacion de historia clinica a PDF.
- Aprobacion y rechazo de solicitudes desde una consola administrativa mas completa.
