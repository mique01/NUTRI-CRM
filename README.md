# NutriCRM

CRM para nutricionistas construido con `React + Vite + Supabase`, listo para subir a GitHub y desplegar en Vercel.

## Qué incluye

- Login con Google usando Supabase Auth.
- Consultorio compartido con invitaciones por email/token.
- Pacientes compartidos entre nutricionistas del mismo consultorio.
- Historia clínica estructurada editable.
- Notas cronológicas.
- Turnos por paciente preparados para futura sincronización con Google Calendar.
- Subida privada de planes alimenticios y estudios médicos en Supabase Storage.
- RLS y buckets listos en un solo archivo SQL.

## 1. Crear proyecto en Supabase

1. Creá un proyecto nuevo en [Supabase](https://supabase.com/).
2. Abrí `SQL Editor`.
3. Pegá completo el archivo [supabase/setup.sql](/C:/Users/Miqueas00/Desktop/crm%20cami/supabase/setup.sql).
4. Ejecutalo una vez.

## 2. Configurar Google OAuth en Supabase

1. En Supabase andá a `Authentication > Providers > Google`.
2. Activá Google.
3. En Google Cloud creá credenciales OAuth web.
4. Agregá estas URLs de redirect:
   - local: `http://localhost:8080/auth/callback`
   - producción: `https://TU-DOMINIO-VERCEL/auth/callback`
5. En Supabase cargá el `Client ID` y `Client Secret` de Google.
6. En `Authentication > URL Configuration` definí:
   - `Site URL`: `http://localhost:8080` en local y luego tu dominio real en producción
   - `Redirect URLs`: agregá también `http://localhost:8080/auth/callback` y tu callback productivo

## 3. Variables de entorno

Creá un archivo `.env.local` basado en [.env.example](/C:/Users/Miqueas00/Desktop/crm%20cami/.env.example):

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

No uses la `service_role` en este frontend.

## 4. Desarrollo local

```bash
npm.cmd install
npm.cmd run dev
```

La app queda en `http://localhost:8080`.

## 5. Flujo inicial de uso

1. Entrá con Google.
2. Si es la primera cuenta, vas a `Setup` y creás el consultorio.
3. Si sos admin, desde el dashboard podés generar invitaciones para otras nutricionistas.
4. La invitada abre el link, entra con Google y queda unida al mismo consultorio compartido.

## 6. Deploy en GitHub + Vercel

1. Subí este proyecto a un repo nuevo en GitHub.
2. En Vercel, importá el repo.
3. Framework preset: `Vite`.
4. Agregá las variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deployá.
6. Volvé a Supabase y actualizá las URLs OAuth productivas si cambió el dominio.

El archivo [vercel.json](/C:/Users/Miqueas00/Desktop/crm%20cami/vercel.json) ya deja resueltas las rutas SPA.

## Estructura importante

- [src/lib/supabase.ts](/C:/Users/Miqueas00/Desktop/crm%20cami/src/lib/supabase.ts): cliente Supabase.
- [src/context/AuthContext.tsx](/C:/Users/Miqueas00/Desktop/crm%20cami/src/context/AuthContext.tsx): sesión, perfil y consultorio actual.
- [src/services](/C:/Users/Miqueas00/Desktop/crm%20cami/src/services): servicios tipados del backend.
- [src/hooks/use-crm-data.ts](/C:/Users/Miqueas00/Desktop/crm%20cami/src/hooks/use-crm-data.ts): query hooks.
- [supabase/setup.sql](/C:/Users/Miqueas00/Desktop/crm%20cami/supabase/setup.sql): tablas, funciones, RLS y storage.

## Pendiente para una segunda etapa

- Sincronización real con Google Calendar.
- Exportación de historia clínica a PDF.
- Envío automático de invitaciones por email en vez de compartir manualmente el link.
