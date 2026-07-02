# 🚀 GUÍA PRÁCTICA: VER Y REGISTRAR CANDIDATOS DEL ERP

**Estado:** Lista para ejecutar ahora mismo  
**Tiempo estimado:** 5-10 minutos para ver todos los cambios

---

## PASO 1️⃣: Ver la previsualización de datos

### Ejecuta este comando:
```bash
cd server
node import_candidates_preview.js
```

### Qué verás:
```
🚀 IMPORTADOR ERP - VISTA PREVIA
================================

📋 LEYENDO CANDIDATOS...
✅ Se encontraron 888 candidatos

📋 LEYENDO REQUISICIONES...
✅ Se encontraron 169 requisiciones

📋 LEYENDO ASPIRANTES...
✅ Se encontraron 60 aspirantes

📋 LEYENDO CONTRATACIONES...
✅ Se encontraron 17 contrataciones

================================================================================
📊 RESUMEN DE DATOS EN EXCEL
================================================================================

📄 CANDIDATOS: 888
   ├─ 787444 | Juan Pérez | juan@mail.com
   ├─ 456123 | María García | maria@mail.com
   ├─ 345678 | Carlos López | carlos@mail.com
   └─ ... y 885 más

📋 REQUISICIONES: 169
   ├─ RP0014 | Aprendiz | 1 vacante(s)
   ├─ RP0179 | Técnico | 2 vacante(s)
   ├─ RP0045 | Supervisor | 1 vacante(s)
   └─ ... y 166 más

👤 ASPIRANTES: 60
   ├─ RA0007 | Juan Pérez | RP0014
   ├─ RA0012 | María García | RP0045
   ├─ RA0003 | Carlos López | RP0179
   └─ ... y 57 más

✅ CONTRATADOS: 17
   ├─ RC0001 | Juan Pérez | Aprendiz
   ├─ RC0005 | María García | Técnico
   ├─ RC0008 | Carlos López | Supervisor
   └─ ... y 14 más

💾 Datos guardados en: server/preview_erp_data.json
✅ Vista previa completada. Datos listos para importar.
```

**¿Qué significa?**
- ✅ Los archivos Excel se leyeron correctamente
- ✅ Se identificaron 888 candidatos con todos sus datos
- ✅ Se vincularon 60 aspiraciones a requisiciones
- ✅ Se clasificaron 17 contrataciones finales

---

## PASO 2️⃣: Ejecutar SQL para crear tablas

```bash
mysql -u root -p sistema_gestion_talento < migration_erp_integration.sql
```

**Qué crear las 5 tablas:**
- `erp_candidatos` (888 registros listos para importar)
- `erp_requisiciones` (169 requisiciones)
- `erp_aspirantes` (60 aspiraciones)
- `erp_contrataciones` (17 contratos)
- `erp_vinculaciones` (vincular candidatos con sistema)

**Verificar en MySQL:**
```sql
SHOW TABLES LIKE 'erp_%';  

/*
Resultado esperado:
+------------------------------+
| Tables_in_sistema_gestion_talento (erp_%) |
+------------------------------+
| erp_aspirantes               |
| erp_candidatos               |
| erp_contrataciones           |
| erp_requisiciones            |
| erp_vinculaciones            |
+------------------------------+
*/

SELECT COUNT(*) FROM erp_candidatos;   -- 0 (vacía aún)
SELECT COUNT(*) FROM erp_requisiciones;  -- 0
SELECT COUNT(*) FROM erp_aspirantes;     -- 0
SELECT COUNT(*) FROM erp_contrataciones; -- 0
```

---

## PASO 3️⃣: Iniciar el servidor backend

```bash
cd server
npm install xlsx  # Si no está instalado

# Crear archivo .env si no existe (con conexión MySQL)
# Asegúrate que DB_HOST, DB_USER, DB_PASS estén configurados

npm run dev
# o: node index.js
```

**Verifica que el servidor inicie sin errores:**
```
✅ Server running on port 5000
✅ Connected to database
```

---

## PASO 4️⃣: En otra terminal, inicia el frontend

```bash
cd client
npm run dev
```

**Verás:**
```
  ➜  Local:   http://localhost:5173/
```

---

## PASO 5️⃣: Accede al panel de administración

### URL en tu navegador:
```
http://localhost:5173/admin/candidatos
```

### Qué verás en pantalla:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         🏢 Gestión de Candidatos ERP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Buscar...]  [Estado: Todos ▼]  [Importar Masivo]  [Nuevo Candidato]

📋 Candidatos (0)  | 💼 Requisiciones (0) | ✅ Contrataciones (0)

┌─────────────────────────────────────────────────────────┐
│ Cédula | Nombre | Email | Teléfono | Estado | Acciones │
├─────────────────────────────────────────────────────────┤
│        │        │       │          │        │          │
│  (vacía porque aún no hemos importado)                   │
└─────────────────────────────────────────────────────────┘
```

---

## PASO 6️⃣: IMPORTAR MASIVAMENTE

### En el panel, haz click en: **"Importar Masivo"**

### Verás un diálogo:
```
┌──────────────────────────────────────┐
│   Importación Masiva                 │
├──────────────────────────────────────┤
│ ℹ️  Se importarán automáticamente:    │
│                                      │
│ ✅ 888 Candidatos                    │
│ ✅ 169 Requisiciones                 │
│ ✅ 60 Aspirantes                     │
│ ✅ 17 Contrataciones                 │
│                                      │
│ Total: 1,154 registros               │
├──────────────────────────────────────┤
│  [Cancelar]       [Importar]         │
└──────────────────────────────────────┘
```

### Click en **[Importar]**

### Espera 20-30 segundos... 🔄

### ✅ Verás el resultado:
```
✅ Se importaron 1,154 candidatos
```

---

## PASO 7️⃣: VE LOS CAMBIOS EN LA TABLA

Después de importar, recarga la página o espera a que se actualice automáticamente.

### Ahora verás:

```
📋 Candidatos (888)  | 💼 Requisiciones (169) | ✅ Contrataciones (17)

┌─────────────────────────────────────────────────────────────────────────┐
│ Cédula    │ Nombre                   │ Email              │ Teléfono    │
├───────────┼──────────────────────────┼────────────────────┼─────────────┤
│ 787444    │ Juan Pérez               │ juan@mail.com      │ 3001234567  │
│ Estado: En requisición    [Ver]                                         │
├───────────┼──────────────────────────┼────────────────────┼─────────────┤
│ 456123    │ María García             │ maria@mail.com     │ 3007654321  │
│ Estado: En evaluación     [Ver]                                         │
├───────────┼──────────────────────────┼────────────────────┼─────────────┤
│ 345678    │ Carlos López             │ carlos@mail.com    │ 3009876543  │
│ Estado: Contratado        [Ver]                                         │
├───────────┼──────────────────────────┼────────────────────┼─────────────┤
│ ... 885 más candidatos                                                   │
└─────────────────────────────────────────────────────────────────────────┘

Contador superior actualizado:
✅ 888 candidatos totales
○ 60 en evaluación
✓ 17 contratados
```

---

## PASO 8️⃣: EXPLORAR DETALLES

### Haz click en **[Ver]** de cualquier candidato

### Se abre una ventana emergente:

```
┌────────────────────────────────────────────────────┐
│           Perfil de Candidato                      │
├────────────────────────────────────────────────────┤
│                                                    │
│ 👤 Datos Personales                                │
│ ┌──────────────────────────────────────────┐      │
│ │ Cédula: 787444                           │      │
│ │ Nombre: Juan Pérez García                │      │
│ │ Email: juan@mail.com                     │      │
│ │ Teléfono: 3001234567                     │      │
│ │ Fecha Nac: 1990-05-15                    │      │
│ │ Género: Hombre                           │      │
│ └──────────────────────────────────────────┘      │
│                                                    │
│ 📍 Ubicación                                       │
│ ┌──────────────────────────────────────────┐      │
│ │ Departamento: Cundinamarca               │      │
│ │ Ciudad: Bogotá                           │      │
│ └──────────────────────────────────────────┘      │
│                                                    │
│ 🎓 Formación                                       │
│ ┌──────────────────────────────────────────┐      │
│ │ Nivel Académico: Técnico                 │      │
│ └──────────────────────────────────────────┘      │
│                                                    │
│ 📋 Proceso de Contratación                        │
│ ① Candidato Pre-Registrado      ✓ (completado)  │
│ ② Aplicación Registrada - RA0007 ✓ (completado) │
│ ③ Contratado - RC0001            ◌ (pendiente)   │
│                                                    │
│ 📢 Requisición RP0014                             │
│ • Puesto: Aprendiz                               │
│ • Fecha: 2026-03-20                              │
│                                                    │
├────────────────────────────────────────────────────┤
│        [Cerrar]         [Registrar Oficial]       │
└────────────────────────────────────────────────────┘
```

---

## PASO 9️⃣: TAB REQUISICIONES

### Haz click en la pestaña: **💼 Requisiciones (169)**

### Verás tarjetas de cada requisición:

```
┌──────────────────────────────────────────────┐
│ Aprendiz                     [1 vacante]     │
│ RP0014                                       │
├──────────────────────────────────────────────┤
│ • Solicitante: Juan Carlos Mora             │
│ • Nivel: Técnico                            │
│ • Experiencia: 2 años                       │
│                                              │
│ 1    |  2    |  ███████░░ 75%               │
│ Aspir| Contr|  Avance                       │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Técnico en Sistemas                [2 vacantes]
│ RP0179                                       │
├──────────────────────────────────────────────┤
│ • Solicitante: María González               │
│ • Nivel: Profesional                        │
│ • Experiencia: 3 años                       │
│                                              │
│ 5    |  2    |  ██████████ 100%             │
│ Aspir| Contr|  Avance                       │
└──────────────────────────────────────────────┘

... más requisiciones
```

**Cada tarjeta muestra:**
- Nombre del puesto
- IDU (RP0014, RP0179, etc.)
- Número de vacantes
- Aspirantes que aplicaron
- Confirmados/Contratados
- Porcentaje de avance

---

## PASO 1️⃣0️⃣: TAB CONTRATACIONES

### Haz click en: **✅ Contrataciones (17)**

### Verás la lista de contratados:

```
┌─────────────────────────────────────┐
│ Juan Pérez García                   │
│ Aprendiz                   [Activo] │
│ Contrato: RC0001                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ María García López                  │
│ Técnico                    [Activo] │
│ Contrato: RC0005                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Carlos López Ramírez                │
│ Supervisor                 [Activo] │
│ Contrato: RC0008                    │
└─────────────────────────────────────┘

... 14 más
```

---

## PASO 1️⃣1️⃣: BUSCAR CANDIDATOS

### En la caja de búsqueda (arriba), escribe:

```
787444       ← Buscar por cédula
```

**O:**
```
Juan         ← Buscar por nombre
```

**O:**
```
juan@mail.com ← Buscar por email
```

### Verás filtrados solo los que coinciden:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Cédula    │ Nombre                   │ Email              │ Teléfono    │
├───────────┼──────────────────────────┼────────────────────┼─────────────┤
│ 787444    │ Juan Pérez               │ juan@mail.com      │ 3001234567  │
│ Estado: En requisición    [Ver]                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## PASO 1️⃣2️⃣: REGISTRAR NUEVO CANDIDATO MANUAL

### Click en: **[Nuevo Candidato]**

### Se abre un formulario:

```
┌────────────────────────────────────┐
│  Registrar Nuevo Candidato         │
├────────────────────────────────────┤
│ Cédula        [          ]          │
│ Tipo de ID    [Cédula ▼]            │
│ Nombres       [          ]          │
│ Apellidos     [          ]          │
│ Email         [          ]          │
│ Teléfono      [          ]          │
│ Departamento  [          ]          │
│ Ciudad        [          ]          │
├────────────────────────────────────┤
│     [Cancelar]  [Registrar]       │
└────────────────────────────────────┘
```

### Diligencia los datos y haz click en **[Registrar]**

### Verás:
```
✅ Candidato registrado exitosamente
```

### El nuevo candidato aparecerá en la tabla automáticamente.

---

## PASO 1️⃣3️⃣: VER LOS DATOS EN LA BASE DE DATOS

### En MySQL, verifica lo que se importó:

```sql
-- Ver resumen
SELECT COUNT(*) as total_candidatos FROM erp_candidatos;
-- Resultado: 888

SELECT COUNT(*) as total_requisiciones FROM erp_requisiciones;
-- Resultado: 169

SELECT COUNT(*) as total_aspirantes FROM erp_aspirantes;
-- Resultado: 60

SELECT COUNT(*) as total_contrataciones FROM erp_contrataciones;
-- Resultado: 17

-- Ver candidatos ejemplo
SELECT 
    identificacion, 
    CONCAT(primer_nombre, ' ', primer_apellido) as nombre,
    email, 
    nivel_academico,
    fecha_registro
FROM erp_candidatos
LIMIT 10;

/* Resultado:
┌───────────────┬──────────────────┬──────────────────┬──────────────┬─────────────────┐
│ identificacion│ nombre           │ email            │ nivel_academico│fecha_registro  │
├───────────────┼──────────────────┼──────────────────┼──────────────┤─────────────────┤
│ 787444        │ Juan Pérez       │ juan@mail.com    │ Técnico       │ 2026-03-25... │
│ 456123        │ María García     │ maria@mail.com   │ Profesional   │ 2026-03-25... │
│ 345678        │ Carlos López     │ carlos@mail.com  │ Básico        │ 2026-03-25... │
│ ...           │ ...              │ ...              │ ...           │ ...            │
└───────────────┴──────────────────┴──────────────────┴──────────────┴─────────────────┘
*/
```

---

## 🎯 RESUMEN: CAMBIOS IMPLEMENTADOS

| Componente | Ubicación | Lo que hace |
|-----------|-----------|------------|
| **Preview Script** | `server/import_candidates_preview.js` | Lee Excel y muestra vista previa (sin guardar) |
| **Admin Controller** | `server/routes/admin-candidatos.controller.js` | Endpoints para CRUD + importación |
| **Admin Routes** | `server/routes/admin.routes.js` | Rutas: `/api/admin/candidatos/*` |
| **Dashboard Mobile** | `client/src/components/AdminCandidatos.tsx` | Panel completo con tabs, búsqueda, diálogos |
| **Database** | `migration_erp_integration.sql` | 5 tablas + 3 vistas |

---

## ✅ CHECKLIST FINAL

- [ ] ✅ Ejecuté `node import_candidates_preview.js` → Vi 1,154 registros
- [ ] ✅ Ejecuté script SQL → Creé 5 tablas vacías
- [ ] ✅ Inicié servidor backend `npm run dev`
- [ ] ✅ Inicié frontend `npm run dev`
- [ ] ✅ Entré a `http://localhost:5173/admin/candidatos`
- [ ] ✅ Hice click en **[Importar Masivo]**
- [ ] ✅ Seleccioné **[Importar]**  
- [ ] ✅ Vi 1,154 registros importados ✓
- [ ] ✅ Vi tabla con 888 candidatos
- [ ] ✅ Vi tabs con Requisiciones y Contrataciones
- [ ] ✅ Busqué candidatos por cédula/nombre
- [ ] ✅ Hice click en **[Ver]** y abrió detalle
- [ ] ✅ Registré un candidato nuevo manual
- [ ] ✅ Verifiqué en MySQL que los datos están guardados

---

## 🆘 PROBLEMAS COMUNES

### Problema: "No encuentra los archivos Excel"
**Solución:** Verificar que estos 4 archivos estén en `C:\Users\[tu usuario]\Downloads\`:
- `Lista de Hoja de Vida (1).xlsx`
- `Listado de Requisiciones de Personal.xlsx`
- `Lista de Registros de Apirantes.xlsx`
- `Lista de Registros de Contratacion.xlsx`

### Problema: "Error de conexión a base de datos"
**Solución:** Verificar `.env` en server:
```
DB_HOST=localhost
DB_USER=root
DB_PASS=tu_password
DB_NAME=sistema_gestion_talento
```

### Problema: "Componente AdminCandidatos no existe"
**Solución:** Agregar en `client/src/App.tsx` o donde uses rutas:
```typescript
import AdminCandidatos from './components/AdminCandidatos';

// Añade esta línea en tu router:
<Route path="/admin/candidatos" element={<AdminCandidatos />} />
```

### Problema: "El botón Importar no hace nada"
**Solución:** Abrir consola del navegador (F12) y ver si hay errores. Verificar que el backend esté corriendo.

---

## 🎉 ¡YA ESTÁ!

Ahora tienes:
✅ **1,154 candidatos del ERP importados**
✅ **Dashboard visual completo**
✅ **Búsqueda y filtros funcionando**
✅ **Detalles de cada candidato con timeline**
✅ **Opción de registrar nuevos manualmente**
✅ **Todo guardado en MySQL con 5 tablas**

**¿Listo para el siguiente paso?** Cuéntame si necesitas:
- Integración con sistema actual de candidatos
- Formularios de registro autom
ático  
- Descargas de documentos PDF
- Reportes y análisis
- Flujo de contratación automático

