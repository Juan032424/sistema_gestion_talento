# 📍 ÍNDICE DE ARCHIVOS CREADOS

**¿Dónde está cada cosa? Búscalo aquí.** ⬇️

---

## 📁 EN TU CARPETA RAÍZ

```
c:\Users\analistasistema\OneDrive - DISCOL SAS\POWER BI\SHEYLA - copia\
│
├─ migration_erp_integration.sql          ← 🗄️ BD: 5 tablas + 3 vistas
├─ GUIA_PRACTICA_VER_CANDIDATOS.md        ← 📖 13 pasos paso a paso
├─ ACTUALIZAR_SERVER.md                   ← 🔧 CÓMO registrar rutas
├─ RESUMEN_FINAL_INTEGRACION_ERP.md       ← 📄 Resumen ejecutivo
├─ ESTRUCTURA_COMPLETA.md                 ← 📁 Estructura de archivos
├─ DASHBOARD_FINAL.md                     ← 📊 Resumen tipo dashboard
├─ INDEX_ARCHIVOS.md                      ← 👈 ESTE ARCHIVO
│
└─ (archivos existentes del proyecto)
```

---

## 📂 EN `/server`

```
server/
│
├─ import_candidates_preview.js             ← 👁️ Lee Excel SIN guardar
│  Ejecución: node import_candidates_preview.js
│
├─ routes/
│  ├─ admin.routes.js                       ← 🛣️ Rutas: /api/admin/*
│  ├─ admin-candidatos.controller.js        ← 🎛️ Lógica CRUD + importación
│  ├─ applications-erp.controller.js        ← 📝 Endpoints de aplicaciones
│  └─ (otras rutas existentes)
│
├─ types/
│  ├─ erp.types.ts                          ← 🔤 Interfaces TypeScript
│  └─ (tipos existentes)
│
├─ services/
│  ├─ ERPAuthService.js                     ← ⚙️ Lógica de integración ERP
│  └─ (servicios existentes)
│
├─ index.js                                 ← ⚠️ ACTUALIZAR: Agregar ruta admin
│
├─ db.js                                    ← (conexión BD, no tocar)
├─ package.json                             ← (verificar xlsx instalado)
└─ .env                                     ← (credenciales BD)
```

---

## 📂 EN `/client/src`

```
client/src/
│
├─ components/
│  ├─ AdminCandidatos.tsx                   ← 🎨 Panel admin (nuevo)
│  ├─ MyApplications.tsx                    ← 📱 Portal candidatos
│  └─ (otros componentes)
│
├─ App.tsx                                  ← ⚠️ ACTUALIZAR: Agregar /admin/candidatos
│
└─ (otros archivos)
```

---

## 🎯 DÓNDE VER CADA COSA

### 1️⃣ **Ver datos a importar**
```bash
cd server
node import_candidates_preview.js

✅ Salida: 1,154 registros en consola
```

### 2️⃣ **Ver tablas MySQL**
```sql
mysql -u root -p sistema_gestion_talento

SHOW TABLES LIKE 'erp_%';
-- Debe mostrar 5 tablas

SELECT COUNT(*) FROM erp_candidatos;  -- 0 hasta importar
SELECT COUNT(*) FROM erp_requisiciones;
SELECT COUNT(*) FROM erp_aspirantes;
SELECT COUNT(*) FROM erp_contrataciones;
```

### 3️⃣ **Ver panel admin**
```
http://localhost:5173/admin/candidatos

Necesita: Backend + Frontend ejecutándose
```

### 4️⃣ **Ver detalles de importación**
Si haces POST a: `http://localhost:5000/api/admin/candidatos/importar-masivo`

✅ Retorna:
```json
{
  "exito": true,
  "cantidad": 1154,
  "detalles": {
    "candidatos": 888,
    "requisiciones": 169,
    "aspirantes": 60,
    "contrataciones": 17
  }
}
```

---

## ⚠️ ARCHIVOS QUE NECESITAS ACTUALIZAR

### Archivo 1: `server/index.js`

**Busca esta sección:**
```javascript
// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/applications', require('./routes/applications.routes'));
```

**Agrega esta línea:**
```javascript
app.use('/api/admin', require('./routes/admin.routes'));  // ← NUEVA
```

---

### Archivo 2: `client/src/App.tsx`

**En tu Router/Switch, agrega:**
```typescript
import AdminCandidatos from './components/AdminCandidatos';

// Dentro del Router:
<Route path="/admin/candidatos" element={<AdminCandidatos />} />
```

---

## 🚀 EJECUCIÓN RÁPIDA

### Terminal 1 (Backend):
```bash
cd server
npm install xlsx  # Si no está
npm run dev
# Verás: ✅ Server running on port 5000
```

### Terminal 2 (Frontend):
```bash
cd client
npm run dev
# Verás: ➜ Local:   http://localhost:5173/
```

### Terminal 3 (Preview):
```bash
cd server
node import_candidates_preview.js
# Verás: 888 candidatos + 169 requisiciones + 60 aspirantes + 17 contrataciones
```

### Navegador:
```
http://localhost:5173/admin/candidatos

Click: [Importar Masivo]
Espera: 30 segundos
Listo: ✅ 1,154 registros importados
```

---

## 📊 DATOS DESPUÉS DE IMPORTAR

```
MySQL: sistema_gestion_talento

erp_candidatos       ← 888 registros
erp_requisiciones    ← 169 registros
erp_aspirantes       ← 60 registros
erp_contrataciones   ← 17 registros
erp_vinculaciones    ← (opcional, para emparejar con sistema actual)

TOTAL: 1,154 registros en BD
```

---

## 📖 GUÍAS SEGÚN TU NECESIDAD

| Necesito... | Lee este archivo |
|-----------|-----------------|
| Ver paso a paso cómo funciona | GUIA_PRACTICA_VER_CANDIDATOS.md |
| Agregar rutas al server | ACTUALIZAR_SERVER.md |
| Entender la arquitectura | ESTRUCTURA_COMPLETA.md |
| Resumen ejecutivo | RESUMEN_FINAL_INTEGRACION_ERP.md |
| Tabla visual con todo | DASHBOARD_FINAL.md |
| Ver dónde está cada archivo | INDEX_ARCHIVOS.md (👈 ESTE) |

---

## ✅ CHECKLIST FINAL

```
☐ Crear archivo: migration_erp_integration.sql
☐ Crear archivo: import_candidates_preview.js
☐ Crear archivo: admin.routes.js
☐ Crear archivo: admin-candidatos.controller.js
☐ Crear archivo: AdminCandidatos.tsx

☐ Actualizar: server/index.js
☐ Actualizar: client/src/App.tsx

☐ Ejecutar: mysql < migration_erp_integration.sql
☐ Ejecutar: npm run dev (backend)
☐ Ejecutar: npm run dev (frontend)
☐ Abrir: http://localhost:5173/admin/candidatos
☐ Importar: 1,154 registros

✅ COMPLETADO: Sistema ERP integrado
```

---

## 💬 PREGUNTAS FRECUENTES

**P: ¿Dónde están los archivos Excel?**
R: En `C:\Users\[tu usuario]\Downloads\`

**P: ¿Qué hago primero?**
R: Ejecuta `node import_candidates_preview.js` en terminal

**P: ¿Se perderán datos del sistema actual?**
R: NO. Se agregan tablas nuevas, no se modifica nada existente.

**P: ¿Una vez?¿Cuánto tarda en importar?**
R: ~30 segundos para 1,154 registros

**P: ¿Puedo importar de nuevo?**
R: Sí, usa INSERT IGNORE (no duplica)

**P: ¿Dónde se guardan los datos?**
R: En 5 tablas nuevas de MySQL en `sistema_gestion_talento`

**P: ¿Cómo veo los datos importados?**
R: En el panel http://localhost:5173/admin/candidatos

**P: ¿Me ayuda a registrar un candidato nuevo?**
R: Sí, botón [Nuevo Candidato] en el panel

---

## 🎯 PRÓXIMAS ACCIONES

1. ✅ Leer esta guía ← TÚ ESTÁS AQUÍ
2. ⏭️ Ejecutar `node import_candidates_preview.js`
3. ⏭️ Ejecutar `mysql < migration_erp_integration.sql`
4. ⏭️ Actualizar `server/index.js` y `client/src/App.tsx`
5. ⏭️ Iniciar servidores
6. ⏭️ Importar datos en panel
7. ⏭️ Verificar en MySQL
8. ⏭️ ¡Deploy a producción!

---

## 📞 SOPORTE RÁPIDO

**Error 1: "No encuentra archivos Excel"**
→ Verifica carpeta `C:\Users\[usuario]\Downloads\`

**Error 2: "Error de conexión BD"**
→ Revisa `.env` en server

**Error 3: "Componente AdminCandidatos no existe"**
→ Actualiza `client/src/App.tsx` con ruta

**Error 4: "Rutas admin no funcionan"**
→ Actualiza `server/index.js` con `app.use('/api/admin'...)`

---

## 🏁 YA ESTÁ

Todo está creado. Ahora toca ejecutar. 🚀

**¿Listo?** Comienza con:

```bash
node server/import_candidates_preview.js
```

Luego sigue la guía **GUIA_PRACTICA_VER_CANDIDATOS.md**
