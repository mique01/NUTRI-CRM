# NutriCRM

CRM para nutricionistas construido con `React + Vite + Supabase`, listo para subir a GitHub y desplegar en Vercel.

## Que incluye

- Acceso al CRM solo con emails autorizados e invitados desde Supabase Auth.
- Login principal por email con enlace magico.
- Consultorio compartido entre nutricionistas del mismo espacio.
- Pacientes compartidos, historia clinica editable, notas y archivos privados.
- Turnos preparados para una futura sincronizacion con Google Calendar.
- RLS, buckets y funciones SQL listas en un solo archivo.

## 1. Crear proyecto en Supabase

1. Crea un proyecto nuevo en [Supabase](https://supabase.com/).
2. Abre `SQL Editor`.
3. Pega completo el archivo [setup.sql](/C:/Users/Miqueas00/Desktop/crm%20cami/supabase/setup.sql).
4. Ejecutalo una vez.

## 2. Configurar acceso por email en Supabase

1. En Supabase ve a `Authentication > Providers`.
2. Activa `Email`.
3. En `Authentication > URL Configuration` define:
   - `Site URL`: `http://localhost:8080` en local y luego tu dominio real en produccion.
   - `Redirect URLs`: agrega `http://localhost:8080/auth/callback` y tu callback productivo.
4. Invita usuarios desde `Authentication > Users > Invite user`.

Importante:
- solo los emails invitados por vos podran entrar al CRM;
- Google ya no es el login principal del CRM;
- Google queda reservado para una futura opcion de `Conectar con Google` dentro del sistema.

## 3. Variables de entorno

Crea un archivo `.env.local` basado en [.env.example](/C:/Users/Miqueas00/Desktop/crm%20cami/.env.example):

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
ILOVEPDF_PUBLIC_KEY=your-ilovepdf-public-key
ILOVEPDF_SECRET_KEY=your-ilovepdf-secret-key
```

## 4. Desarrollo local

```bash
npm.cmd install
npm.cmd run dev
```

La app queda en `http://localhost:8080`.

## 5. Flujo inicial de uso

1. Invita la cuenta desde Supabase.
2. La persona abre el mail de invitacion.
3. Luego ingresa al CRM con ese mismo email autorizado.
4. Si la cuenta esta invitada, entra al consultorio compartido.
5. Mas adelante, ya dentro del CRM, se puede agregar `Conectar con Google` para Calendar.

## 6. Deploy en GitHub + Vercel

1. Sube este proyecto a un repo nuevo en GitHub.
2. En Vercel, importa el repo.
3. Framework preset: `Vite`.
4. Agrega estas variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `ILOVEPDF_PUBLIC_KEY`
   - `ILOVEPDF_SECRET_KEY`
5. Deploya.
6. Vuelve a Supabase y actualiza las URLs de redirect si cambia el dominio.

## Estructura importante

- [supabase/setup.sql](/C:/Users/Miqueas00/Desktop/crm%20cami/supabase/setup.sql): tablas, funciones, RLS y storage.
- [src/lib/supabase.ts](/C:/Users/Miqueas00/Desktop/crm%20cami/src/lib/supabase.ts): cliente Supabase.
- [src/context/AuthContext.tsx](/C:/Users/Miqueas00/Desktop/crm%20cami/src/context/AuthContext.tsx): sesion, perfil y consultorio actual.
- [src/services](/C:/Users/Miqueas00/Desktop/crm%20cami/src/services): capa tipada del frontend.

## Pendiente para una segunda etapa

- Conexion real con Google Calendar.
- Exportacion de historia clinica a PDF.
- Panel de integraciones para conectar Google una vez dentro del CRM.
