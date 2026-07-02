# 🔧 ACTUALIZAR SERVER - REGISTRAR RUTAS ADMIN

Para que funcione el panel de administración, necesitas agregar las rutas en tu `server/index.js`

---

## OPCIÓN A: Si tu server/index.js ya tiene rutas (Express)

### Busca la sección donde se registran rutas, típicamente se ve así:

```javascript
// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/applications', require('./routes/applications.routes'));
app.use('/api/vacantes', require('./routes/vacantes.routes'));
```

### Añade esta línea:

```javascript
// ✅ NUEVA LÍNEA - Rutas Admin para gestionar candidatos ERP
app.use('/api/admin', require('./routes/admin.routes'));
```

### Resultado final:

```javascript
// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/applications', require('./routes/applications.routes'));
app.use('/api/vacantes', require('./routes/vacantes.routes'));
app.use('/api/admin', require('./routes/admin.routes'));  // ← NUEVA

// Middleware de error (debe ser al final)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ exito: false, mensaje: error.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
```

---

## OPCIÓN B: Si tu index.js es un Express más completo

Si tienes una estructura como esta:

```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/applications', require('./routes/applications.routes'));

app.listen(5000, () => console.log('Server running'));
```

### Actualización:

```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Rutas (agregar admin rutas)
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/applications', require('./routes/applications.routes'));
app.use('/api/admin', require('./routes/admin.routes'));  // ← NUEVA

app.listen(5000, () => console.log('✅ Server running'));
```

---

## OPCIÓN C: Instalación de dependencias requeridas

Si alguna dependencia no está instalada, hazlo:

```bash
cd server

# Para leer Excel
npm install xlsx

# Para conexión básica (ya debería estar)
npm install express cors dotenv mysql2
```

---

## VERIFICAR QUE FUNCIONA

### Abre tu navegador en:

```
http://localhost:5000/api/admin/candidatos/preview
```

### Deberías ver (si Excel está en Downloads):

```json
{
  "exito": true,
  "resumen": {
    "candidatos": 888,
    "requisiciones": 169,
    "aspirantes": 60,
    "contrataciones": 17
  },
  "datos": {
    "candidatos": [
      {
        "numFila": 3,
        "identificacion": "787444",
        "tipoID": "Cedula",
        "nombre": "Juan Pérez",
        ...
      }
    ],
    ...
  }
}
```

### Si aparece error 404:
- ❌ Las rutas NO se registraron
- ✅ Solución: Volver al index.js y agregar `app.use('/api/admin', require('./routes/admin.routes'));`

### Si aparece error de archivos:
- ❌ Los archivos Excel no están en Downloads
- ✅ Solución: Cortar/pegar los 4 archivos a `C:\Users\[tu usuario]\Downloads\`

---

## ENDPOINTS DISPONIBLES

Una vez registradas las rutas, tendrás acceso a:

### 📋 GET /api/admin/candidatos/preview
Lee Excel y retorna vista previa (NO guarda en DB)

### 📊 GET /api/admin/estadisticas
Retorna: total candidatos, requisiciones, aspirantes, contrataciones

### 👥 GET /api/admin/candidatos
Lista todos los candidatos en base de datos

### 👤 GET /api/admin/candidatos/:cedula
Detalle de un candidato específico

### ➕ POST /api/admin/candidatos/registrar
Registra un candidato nuevo

```javascript
// Body:
{
  "identificacion": "123456",
  "tipoID": "Cedula",
  "nombres": "Juan",
  "apellidos": "Pérez",
  "email": "juan@mail.com",
  "telefono": "3001234567",
  "departamento": "Cundinamarca",
  "ciudad": "Bogotá"
}
```

### ⚡ POST /api/admin/candidatos/importar-masivo
Importa los 1,154 registros de Excel a la BD

```javascript
// Response:
{
  "exito": true,
  "mensaje": "Importación completada exitosamente",
  "cantidad": 1154,
  "detalles": {
    "candidatos": 888,
    "requisiciones": 169,
    "aspirantes": 60,
    "contrataciones": 17
  }
}
```

### ✏️ PUT /api/admin/candidatos/:cedula
Actualiza un candidato

```javascript
// Body:
{
  "email": "nuevo@mail.com",
  "telefono": "3199999999"
}
```

### 🗑️ DELETE /api/admin/candidatos/:cedula
Elimina un candidato

---

## INTEGRACIÓN CON FRONTEND

### En tu `client/src/App.tsx` o donde manejes rutas:

```typescript
import AdminCandidatos from './components/AdminCandidatos';

// En tu Router o después del Switch:
<Route path="/admin/candidatos" element={<AdminCandidatos />} />

// O en App.tsx:
if (pathname === '/admin/candidatos') {
  return <AdminCandidatos />;
}
```

### Para acceder desde el navegador:

```
http://localhost:5173/admin/candidatos
```

---

## PRUEBA RÁPIDA CON POSTMAN

1. Abre Postman (o Insomnia)
2. Configura una nueva petición:

```
GET http://localhost:5000/api/admin/candidatos/preview
```

3. Haz click en **Send**

4. Deberías ver los 1,154 registros en el JSON

---

## SI NO FUNCIONA

### Checklist:

- [ ] ¿El servidor está corriendo (`npm run dev` en server/)?
- [ ] ¿Agregué la línea `app.use('/api/admin', require('./routes/admin.routes'));`?
- [ ] ¿Los 4 archivos Excel están en Downloads?
- [ ] ¿Las rutas `admin.routes.js` y `admin-candidatos.controller.js` existen?
- [ ] ¿Instalé `npm install xlsx`?
- [ ] ¿La base de datos está conectada?

### Log de errores:

```bash
# En la terminal del server
npm run dev

# Deberías ver:
✅ Server running on port 5000
✅ Connected to database: sistema_gestion_talento
```

Si hay error, cópialo y comparte.

---

## ✅ LISTO

Después de agregar esa línea en index.js:

1. **Guarda el archivo**
2. **Reinicia el server** (Ctrl+C y vuelve a ejecutar `npm run dev`)
3. **Abre navegador** en `http://localhost:5173/admin/candidatos`
4. **Verás el panel completo**

---

## SIGUIENTES PASOS

- [ ] Actualiza server/index.js
- [ ] Reinicia el servidor
- [ ] Ve a http://localhost:5173/admin/candidatos
- [ ] Click en **[Importar Masivo]**
- [ ] Espera 30 segundos
- [ ] ✅ 1,154 candidatos importados
- [ ] 🎉 Dataset completo registrado en MySQL
