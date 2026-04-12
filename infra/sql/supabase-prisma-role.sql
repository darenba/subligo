-- Ejecutar en el SQL Editor de Supabase antes de conectar Prisma en produccion.
-- Reemplaza CHANGE_ME_SUPER_STRONG_PASSWORD por una clave real.

create role prisma login password 'CHANGE_ME_SUPER_STRONG_PASSWORD';

grant anon to prisma;
grant authenticated to prisma;
grant service_role to prisma;

grant postgres to prisma;

alter role prisma createdb;
alter role prisma bypassrls;
