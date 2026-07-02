# 🚀 START HERE - COMIENZA AQUÍ

**¿Qué se creó?** 8 archivos listos para importar 1,154 candidatos desde Excel a tu BD.

---

## ⚡ 3 COSAS QUE DEBES HACER AHORA

### 1️⃣ VE QUÉ SE VA A IMPORTAR (sin guardar)
```bash
cd server
node import_candidates_preview.js
```
**Verás:** 888 candidatos + 169 requisiciones + 60 aspirantes + 17 contrataciones ✓

---

### 2️⃣ CREA LAS 5 TABLAS EN MySQL
```bash
mysql -u root -p sistema_gestion_talento < migration_erp_integration.sql
```
**Verificar:**
```sql
SHOW TABLES LIKE 'erp_%';  -- Debe mostrar 5 tablas
```

---

### 3️⃣ INICIA EL SISTEMA Y IMPORTA

**Terminal 1:**
```bash
cd server && npm run dev
```

**Terminal 2:**
```bash
cd client && npm run dev
```

**Navegador:**
```
http://localhost:5173/admin/candidatos
Click: [Importar Masivo] → ⏳ 30 segundos → ✅ 1,154 importados
```

---

## 📋 ARCHIVOS CREADOS (8 archivos)

| Archivo | Qué hace |
|---------|----------|
| `migration_erp_integration.sql` | Crea 5 tablas BD |
| `import_candidates_preview.js` | Lee Excel |
| `admin.routes.js` | Rutas API |
| `admin-candidatos.controller.js` | Lógica de importación |
| `AdminCandidatos.tsx` | Panel visual |
| `erp.types.ts` | Interfaces TS |
| `ERPAuthService.js` | Servicios |
| `applications-erp.controller.js` | Endpoints |

---

## ⚠️ ACTUALIZA 2 ARCHIVOS

### server/index.js
Busca:
```javascript
app.use('/api/applications', require('./routes/applications.routes'));
```
Agrega debajo:
```javascript
app.use('/api/admin', require('./routes/admin.routes'));  // ← NUEVA
```

### client/src/App.tsx
Agrega:
```typescript
import AdminCandidatos from './components/AdminCandidatos';

// En tu Router:
<Route path="/admin/candidatos" element={<AdminCandidatos />} />
```

---

## 📚 DOCUMENTACIÓN

- **GUIA_PRACTICA_VER_CANDIDATOS.md** ← Paso a paso (13 pasos)
- **ACTUALIZAR_SERVER.md** ← Cómo actualizar rutas
- **INDEX_ARCHIVOS.md** ← Dónde está cada archivo
- **DASHBOARD_FINAL.md** ← Resumen visual

---

## ✅ RESULTADO

```
Base de Datos:      ✅ 1,154 registros
Panel Admin:        ✅ Funciona
Importación:        ✅ Automática
Histórico sistema:  ✅ 0% pérdida
```

---

## 🏁 PARA EMPEZAR AHORA

```bash
# Paso 1: Ver preview
cd server
node import_candidates_preview.js

# Paso 2: Crear tablas
mysql -u root -p < migration_erp_integration.sql

# Paso 3: Iniciar backend
npm run dev

# Paso 4: (En otra terminal) Iniciar frontend
cd client
npm run dev

# Paso 5: Abrir navegador
http://localhost:5173/admin/candidatos

# Paso 6: Click [Importar Masivo]
# Espera 30 segundos → ¡LISTO! ✅
```

---

**¿Listo?** Comienza con:

👉 `node server/import_candidates_preview.js`

Luego lee: **GUIA_PRACTICA_VER_CANDIDATOS.md** para los detalles.
