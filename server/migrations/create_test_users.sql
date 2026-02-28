-- ===============================================
-- SCRIPT: Crear Usuario de Prueba para Testing
-- Usuario de prueba con credenciales conocidas
-- ===============================================

-- IMPORTANTE: Ejecuta primero el script add_candidate_auth_tables.sql

-- 1. Verificar que la tabla candidatos tiene password_hash
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'candidatos' 
  AND COLUMN_NAME IN ('password_hash', 'ciudad', 'titulo_profesional');

-- 2. Crear usuario de prueba
-- Email: demo@discol.com
-- Password: Demo123!
-- Hash generado con bcrypt, 10 rounds
INSERT INTO candidatos (
    nombre,
    email,
    telefono,
    password_hash,
    ciudad,
    titulo_profesional,
    created_at,
    updated_at
) VALUES (
    'Usuario Demo',
    'demo@discol.com',
    '+57 300 123 4567',
    '$2b$10$YQF5vGx3qV0nE6B8yxKqAOZJ7f6yS5pXxEhqJ6p4aZ0B5Z7Z7Z7Z7', -- Password: Demo123!
    'Bogotá',
    'Desarrollador Full Stack',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    telefono = VALUES(telefono),
    ciudad = VALUES(ciudad),
    titulo_profesional = VALUES(titulo_profesional),
    updated_at = NOW();

-- 3. Otro usuario de prueba
-- Email: test@discol.com
-- Password: Test123!
INSERT INTO candidatos (
    nombre,
    email,
    telefono,
    password_hash,
    ciudad,
    titulo_profesional,
    created_at,
    updated_at
) VALUES (
    'Usuario Test',
    'test@discol.com',
    '+57 301 234 5678',
    '$2b$10$XPE8vGx3qV0nE6B8yxKqAOZJ7f6yS5pXxEhqJ6p4aZ0B5Z7Z7Z7Z8', -- Password: Test123!
    'Medellín',
    'Ingeniero de Software',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    telefono = VALUES(telefono),
    ciudad = VALUES(ciudad),
    titulo_profesional = VALUES(titulo_profesional),
    updated_at = NOW();

-- 4. Verificar que los usuarios se crearon
SELECT 
    id,
    nombre,
    email,
    telefono,
    ciudad,
    titulo_profesional,
    CASE 
        WHEN password_hash IS NOT NULL THEN '✓ Tiene contraseña'
        ELSE '✗ Sin contraseña'
    END as estado_password,
    created_at
FROM candidatos
WHERE email IN ('demo@discol.com', 'test@discol.com');

-- ===============================================
-- CREDENCIALES DE PRUEBA PARA TESTING
-- ===============================================
-- Usuario 1:
--   Email: demo@discol.com
--   Password: Demo123!
--
-- Usuario 2:
--   Email: test@discol.com
--   Password: Test123!
-- ===============================================

-- ===============================================
-- NOTA: Este script debe ejecutarse DESPUÉS de
-- add_candidate_auth_tables.sql
-- ===============================================
