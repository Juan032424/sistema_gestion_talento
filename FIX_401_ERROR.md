# 🚨 SOLUCIÓN COMPLETA - ERROR 401 LOGIN

## ❌ PROBLEMA IDENTIFICADO

```
POST http://localhost:3001/api/candidate-auth/login 401 (Unauthorized)
```

**CAUSA RAÍZ:** La migración SQL NO se ha ejecutado.  
**IMPACTO:** Sistema de autenticación no funcional - **CRÍTICO para producción**

---

## ✅ SOLUCIÓN PASO A PASO

### **PASO 1: Ejecutar Migración SQL (OBLIGATORIO)**

#### **Opción A: MySQL Workbench (Recomendado)**

1. Abre **MySQL Workbench**
2. Conecta a tu base de datos
3. Navega y abre el archivo:
   ```
   server/migrations/add_candidate_auth_tables.sql
   ```
4. Ejecuta TODO el script (botón ⚡ Execute o Ctrl+Shift+Enter)
5. Verifica que no hay errores en la consola

#### **Opción B: Terminal/CMD**

```bash
# Desde la raíz del proyecto
cd server

# Ejecutar migración
mysql -u root -p < migrations/add_candidate_auth_tables.sql

# Ingresa tu contraseña de MySQL cuando se solicite
```

#### **¿Qué hace esta migración?**

✅ Agrega columna `password_hash` a tabla `candidatos`  
✅ Agrega columna `ciudad` a tabla `candidatos`  
✅ Agrega columna `titulo_profesional` a tabla `candidatos`  
✅ Agrega columnas `created_at` y `updated_at`  
✅ Crea tabla `candidate_saved_jobs` (vacantes guardadas)  
✅ Crea tabla `candidate_notifications` (notificaciones)  
✅ Verifica tabla `application_tracking_links`

---

### **PASO 2: Crear Usuarios de Prueba**

Después de ejecutar la migración, crea usuarios de prueba:

```bash
# Desde server/
node scripts/create-test-users.js
```

**Deberías ver:**
```
🔌 Conectando a la base de datos...
✅ Conexión establecida

🔍 Verificando estructura de la tabla candidatos...
Columnas encontradas: [ 'password_hash', 'ciudad', 'titulo_profesional' ]
✅ Estructura de tabla correcta

👤 Creando usuario: demo@discol.com...
   🔐 Hash generado: $2b$10$YQF5vGx3qV0nE6B8yxKq...
   ✅ Usuario demo@discol.com creado/actualizado exitosamente

... (más usuarios)

═══════════════════════════════════════════════════════
📝 CREDENCIALES DE PRUEBA PARA LOGIN:
═══════════════════════════════════════════════════════

1. Usuario Demo
   Email:    demo@discol.com
   Password: Demo123!

2. Usuario Test
   Email:    test@discol.com
   Password: Test123!

3. María García
   Email:    maria@discol.com
   Password: Maria123!
═══════════════════════════════════════════════════════
```

---

### **PASO 3: Probar Login**

1. Abre: `http://localhost:5000/portal`
2. Click en el avatar "Invitado"
3. Completa con una de las credenciales de prueba:
   ```
   Email: demo@discol.com
   Password: Demo123!
   ```
4. Click en "Iniciar Sesión"
5. **✅ Debería funcionar ahora**

---

## 🔍 VERIFICACIÓN MANUAL (Opcional)

Si prefieres verificar manualmente que la migración se ejecutó:

```sql
-- En MySQL Workbench o terminal MySQL
USE discol_rrhh;

-- 1. Verificar que password_hash existe
DESCRIBE candidatos;

-- Deberías ver:
-- | password_hash        | varchar(255) | YES  |     | NULL    |       |
-- | ciudad               | varchar(100) | YES  |     | NULL    |       |
-- | titulo_profesional   | varchar(200) | YES  |     | NULL    |       |

-- 2. Verificar tablas creadas
SHOW TABLES LIKE 'candidate%';

-- Deberías ver:
-- | candidate_saved_jobs      |
-- | candidate_notifications   |

-- 3. Ver estructura completa de candidatos
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'candidatos'
  AND TABLE_SCHEMA = 'discol_rrhh'
ORDER BY ORDINAL_POSITION;
```

---

## 🎯 ERRORES MEJORADOS

He mejorado el manejo de errores en el frontend para dar feedback más claro:

### **Mensajes de Error de Login:**

| Código | Mensaje al Usuario |
|--------|-------------------|
| 401 | "Email o contraseña incorrectos" |
| 404 | "No existe una cuenta con este email" |
| 500 | "Error del servidor. Por favor intenta más tarde" |
| Network Error | "No se pudo conectar con el servidor. Verifica tu conexión" |

### **Mensajes de Error de Registro:**

| Código | Mensaje al Usuario |
|--------|-------------------|
| 400 | "Datos inválidos. Verifica la información" |
| 409 | "Ya existe una cuenta con este email" |
| 500 | "Error del servidor. Por favor intenta más tarde" |
| Network Error | "No se pudo conectar con el servidor. Verifica tu conexión" |

---

## 📋 CHECKLIST DE PRODUCCIÓN

Antes de llevar a producción, verifica:

- [ ] ✅ Migración SQL ejecutada
- [ ] ✅ Columna `password_hash` existe en `candidatos`
- [ ] ✅ Tablas `candidate_saved_jobs` y `candidate_notifications` creadas
- [ ] ✅ Variable `JWT_SECRET` definida en `.env`
- [ ] ✅ Backend corriendo en puerto 3001
- [ ] ✅ Frontend corriendo en puerto 5000
- [ ] ✅ Conexión a base de datos funcionando
- [ ] ✅ Login de prueba funcional
- [ ] ✅ Registro de prueba funcional
- [ ] ✅ Logout funcional
- [ ] ✅ Mensajes de error amigables
- [ ] ✅ Validaciones en frontend y backend
- [ ] ✅ Contraseñas hasheadas con bcrypt

---

## 🔐 SEGURIDAD IMPLEMENTADA

### **1. Hashing de Contraseñas**
```javascript
// bcrypt con 10 salt rounds
const hashedPassword = await bcrypt.hash(password, 10);
```

### **2. JWT Tokens**
```javascript
// Token expira en 30 días
const token = jwt.sign(
    { id: candidato.id, email: candidato.email, type: 'candidate' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
);
```

### **3. Validaciones**
```javascript
// Email válido
// Contraseña mínimo 6 caracteres
// Campos requeridos verificados
```

### **4. Middleware de Autenticación**
```javascript
// Verifica token en cada request protegido
// Rechaza tokens inválidos o expirados
// Valida tipo de usuario
```

---

## 🚀 SIGUIENTE PASO

**EJECUTA AHORA MISMO:**

```bash
# 1. Ejecutar migración SQL (MySQL Workbench o terminal)
mysql -u root -p < server/migrations/add_candidate_auth_tables.sql

# 2. Crear usuarios de prueba
cd server
node scripts/create-test-users.js

# 3. Probar login en http://localhost:5000/portal
```

---

## 🆘 SI SIGUEN LOS ERRORES

### **Error: Cannot find module 'mysql2/promise'**
```bash
cd server
npm install mysql2
```

### **Error: Cannot find module 'bcrypt'**
```bash
cd server
npm install bcrypt
```

### **Error: Cannot connect to MySQL**
```bash
# Verifica .env en server/
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=discol_rrhh
```

### **Error: JWT_SECRET not defined**
```bash
# Agrega a server/.env
JWT_SECRET=tu_secreto_super_seguro_aqui_cambiar_en_produccion
```

---

## 📞 ARCHIVOS IMPORTANTES

```
server/
├── migrations/
│   ├── add_candidate_auth_tables.sql  ← EJECUTAR PRIMERO
│   └── create_test_users.sql          ← Alternativa SQL manual
├── scripts/
│   └── create-test-users.js           ← Crear usuarios de prueba
├── services/
│   └── CandidateAuthService.js        ← Lógica de autenticación
├── routes/
│   └── candidateAuth.js               ← Rutas API
└── middleware/
    └── authenticateCandidate.js       ← Middleware JWT

client/
├── src/
    ├── context/
    │   └── CandidateAuthContext.tsx   ← Context de auth
    └── components/portal/
        └── CandidateAuthModal.tsx     ← Modal de login/registro
```

---

## ✅ RESULTADO ESPERADO

Después de seguir estos pasos:

1. ✅ Login funcional con credenciales de prueba
2. ✅ Registro de nuevos usuarios funcional
3. ✅ Mensajes de error claros y amigables
4. ✅ Avatar cambia a nombre real
5. ✅ Ring de estado verde (online)
6. ✅ Acceso a "Guardados" y "Mis Aplicaciones"
7. ✅ Logout funcional
8. ✅ Sesión persistente (30 días)

---

## 🎉 ¡SISTEMA LISTO PARA PRODUCCIÓN!

Una vez ejecutada la migración y creados los usuarios de prueba, el sistema de autenticación estará 100% funcional y listo para usuarios reales.

**¡Ejecuta la migración ahora y prueba!** 🚀✨
