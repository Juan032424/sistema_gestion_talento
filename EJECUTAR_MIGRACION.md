# 🎯 GUÍA EJECUTAR MIGRACIÓN SQL - PASO A PASO

## ⚡ ACCIÓN INMEDIATA REQUERIDA

Para que el sistema funcione DEBES ejecutar la migración SQL. Sigue estos pasos **EXACTAMENTE**:

---

## 📋 OPCIÓN 1: MySQL Workbench (MÁS FÁCIL)

### **Paso 1: Abrir MySQL Workbench**
1. Busca "MySQL Workbench" en tu computadora
2. Ábrelo
3. Click en tu conexión local (generalmente "Local instance MySQL")
4. Ingresa tu contraseña de MySQL

### **Paso 2: Abrir el Archivo SQL**
1. En el menú superior, click en **File** → **Open SQL Script...**
2. Navega a la carpeta de tu proyecto:
   ```
   C:\Users\analistasistema\OneDrive - DISCOL SAS\POWER BI\SHEYLA - copia\server\migrations\
   ```
3. Selecciona el archivo: **`add_candidate_auth_tables.sql`**
4. Click en **Abrir**

### **Paso 3: Ejecutar el Script**
1. Verás todo el código SQL en el editor
2. **IMPORTANTE:** Asegúrate que tu base de datos esté seleccionada:
   - En el panel izquierdo, busca `discol_rrhh`
   - Haz click derecho → **Set as Default Schema**
   - O ejecuta este comando primero:
     ```sql
     USE discol_rrhh;
     ```
3. Click en el icono de **rayo** (⚡) o presiona **Ctrl + Shift + Enter**
4. Espera a que termine (verás mensajes en la parte inferior)

### **Paso 4: Verificar que Funcionó**
1. En el panel de la izquierda, busca la tabla `candidatos`
2. Haz click derecho → **Select Rows - Limit 1000**
3. Verifica que veas las columnas nuevas:
   - `password_hash`
   - `ciudad`
   - `titulo_profesional`
   - `created_at`
   - `updated_at`

---

## 📋 OPCIÓN 2: Terminal/CMD (ALTERNATIVA)

### **Paso 1: Abrir Terminal**
1. Presiona **Windows + R**
2. Escribe `cmd` y presiona Enter

### **Paso 2: Navegar a la Carpeta del Proyecto**
```bash
cd "C:\Users\analistasistema\OneDrive - DISCOL SAS\POWER BI\SHEYLA - copia\server"
```

### **Paso 3: Ejecutar Migración**
```bash
mysql -u root -p discol_rrhh < migrations\add_candidate_auth_tables.sql
```

Cuando te pida la contraseña, ingrésala (no se verá mientras escribes)

### **Paso 4: Verificar**
```bash
mysql -u root -p discol_rrhh -e "DESCRIBE candidatos;"
```

Deberías ver las nuevas columnas listadas.

---

## 🎯 DESPUÉS DE LA MIGRACIÓN

### **Paso 5: Crear Usuarios de Prueba**

Desde la terminal (en la carpeta `server`):

```bash
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
   ✅ Usuario demo@discol.com creado exitosamente
```

---

## 🧪 PROBAR EL SISTEMA

### **1. Abrir el Portal**
```
http://localhost:5000/portal
```

### **2. Click en el Avatar "Invitado"**
- Verás el modal de login

### **3. Usar Credenciales de Prueba**
```
Email:    demo@discol.com
Password: Demo123!
```

### **4. Click en "Iniciar Sesión"**
- ✅ Debería funcionar
- ✅ Avatar cambia a "UD" (Usuario Demo)
- ✅ Ring cambia a verde
- ✅ Texto cambia a "Usuario Demo"

### **5. Probar Navegación**
- Click en "Guardados" → ✅ Funciona (no pide login)
- Click en "Mis Aplicaciones" → ✅ Funciona (no pide login)

### **6. Probar Logout**
- Click en botón "Salir" (rojo)
- ✅ Avatar vuelve a "Invitado"
- ✅ Ring cambia a gris
- ✅ "Guardados" vuelve a pedir login

---

## 🚨 SI HAY ERRORES

### **Error: "Access denied for user..."**
```bash
# Tu contraseña de MySQL es incorrecta
# Usa la contraseña que configuraste al instalar MySQL
```

### **Error: "Unknown database 'discol_rrhh'"**
```bash
# La base de datos no existe, créala:
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS discol_rrhh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### **Error: "Can't find module 'mysql2'"**
```bash
cd server
npm install mysql2
```

### **Error: "Can't find module 'bcrypt'"**
```bash
cd server
npm install bcrypt
```

### **Error en create-test-users.js: "Column password_hash doesn't exist"**
```
# La migración no se ejecutó correctamente
# Vuelve a ejecutar el Paso 3 de la Opción 1 o 2
```

---

## ✅ CHECKLIST FINAL

- [ ] MySQL Workbench abierto
- [ ] Archivo add_candidate_auth_tables.sql abierto
- [ ] Base de datos discol_rrhh seleccionada
- [ ] Script ejecutado (⚡)
- [ ] Columnas nuevas verificadas
- [ ] Script create-test-users.js ejecutado
- [ ] Usuarios de prueba creados
- [ ] Login probado con demo@discol.com
- [ ] Navegación probada
- [ ] Logout probado

---

## 📞 USUARIOS DE PRUEBA DISPONIBLES

Después de ejecutar `create-test-users.js`:

```
1. Usuario Demo
   Email:    demo@discol.com
   Password: Demo123!
   Ciudad:   Bogotá
   Título:   Desarrollador Full Stack

2. Usuario Test
   Email:    test@discol.com
   Password: Test123!
   Ciudad:   Medellín
   Título:   Ingeniero de Software

3. María García
   Email:    maria@discol.com
   Password: Maria123!
   Ciudad:   Cali
   Título:   Diseñadora UX/UI
```

---

## 🎉 RESULTADO ESPERADO

**ANTES DE LA MIGRACIÓN:**
- ❌ Login no funciona (Error 401)
- ❌ Registro no funciona
- ❌ Todo pide autenticación pero falla

**DESPUÉS DE LA MIGRACIÓN:**
- ✅ Login funciona perfectamente
- ✅ Registro de nuevos usuarios funciona
- ✅ Guardados funciona
- ✅ Mis Aplicaciones funciona
- ✅ Logout funciona
- ✅ Sesión persiste 30 días
- ✅ Avatar muestra iniciales
- ✅ Ring verde = online
- ✅ Navegación completa

---

## 💡 IMPORTANTE

**La migración solo se ejecuta UNA VEZ.**

Una vez ejecutada:
- ✅ Todas las columnas necesarias existen
- ✅ Todas las tablas están creadas
- ✅ Sistema 100% funcional
- ✅ Listo para producción

**No necesitas ejecutarla de nuevo a menos que:**
- Cambies de base de datos
- Elimines las columnas/tablas
- Hagas un reset completo

---

## 🚀 SIGUIENTE PASO

**EJECUTA AHORA:**

1. Abre MySQL Workbench
2. Abre `server/migrations/add_candidate_auth_tables.sql`
3. Click en ⚡ (rayo)
4. Ejecuta `node scripts/create-test-users.js`
5. Prueba login en http://localhost:5000/portal

---

**¡Todo funcionará después de esto!** 🎉✨
