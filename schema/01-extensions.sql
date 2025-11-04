-- ========================================
-- EXTENSIONES DE POSTGRESQL
-- ========================================
-- Este archivo contiene las extensiones necesarias para el proyecto

-- Extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- Extensión para funciones de criptografía
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;

-- Extensión para estadísticas de queries
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" SCHEMA extensions;

-- Extensión para GraphQL
CREATE EXTENSION IF NOT EXISTS "pg_graphql" SCHEMA graphql;

-- Extensión para almacenar secretos de forma segura
CREATE EXTENSION IF NOT EXISTS "supabase_vault" SCHEMA vault;
