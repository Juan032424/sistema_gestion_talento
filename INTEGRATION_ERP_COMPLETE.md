# 🚀 INTEGRATION GUIDE: ERP System Implementation

**Última actualización:** 25 de Marzo de 2026
**Versión:** 1.0
**Estado:** Listo para implementar

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen)
2. [Arquitectura de Integración](#arquitectura)
3. [Cambios en Base de Datos](#bd)
4. [Backend - Servicios](#backend)
5. [Frontend - Componentes](#frontend)
6. [Proceso de Implementación](#implementacion)
7. [Testing & Validación](#testing)
8. [FAQ & Troubleshooting](#faq)

---

## <a name="resumen"></a>1. RESUMEN EJECUTIVO

### Objetivo
Integrar los 4 archivos ERP (Candidatos, Requisiciones, Aspirantes, Contrataciones) con el sistema candidatos existente, manteniendo **100% compatibilidad** sin perder datos.

### Componentes Integrados

| Fuente ERP | Tabla BD | Registros | Clave Primaria |
|---|---|---|---|
| Lista de Hoja de Vida.xlsx | `erp_candidatos` | 888 | `identificacion` (String) |
| Listado de Requisiciones.xlsx | `erp_requisiciones` | 169 | `idu_requisicion` (RP0014, etc.) |
| Lista de Aspirantes.xlsx | `erp_aspirantes` | 60 | `idu_aspirante` (RA0007, etc.) |
| Lista de Contrataciones.xlsx | `erp_contrataciones` | 17 | `idu_contrato` (RC0001, etc.) |

### Flujo de Integración

```
Candidatos del Sistema
        ↓
Autenticación mejorada
(verifica cédula en ERP)
        ↓
Si existe en ERP
    └→ Vinculación automática
    └→ Sincronización de datos
        ↓
Historial visual con:
  • Requisición (RP) - Estado
  • Aspiración (RA) - Evaluación
  • Contratación (RC) - Documentos
        ↓
Timeline/Stepper visual
  Paso 1: Requisición aprobada
  Paso 2: Candidato aplicó
  Paso 3: Seleccionado
  Paso 4: Contratado
```

---

## <a name="arquitectura"></a>2. ARQUITECTURA DE INTEGRACIÓN

### A. Tablas Nuevas en Base de Datos

```
erp_candidatos
├─ id (PK)
├─ identificacion (UNIQUE) ← Clave del ERP
├─ tipo_id (Enum)
├─ nombre, apellido, email, teléfono
├─ dirección, municipio, departamento
├─ nivel_académico, género, etc.
└─ hoja_vida_pdf, cedula_pdf

erp_requisiciones
├─ id (PK)
├─ idu_requisicion (UNIQUE) ← RP0014, RP0179, etc.
├─ puesto_solicitado, jornada, salario
├─ requisitos_académicos, experiencia
├─ estatus_aprobación (Aprobado/Rechazado)
└─ área_proyecto, lugar_trabajo, tipo_contrato

erp_aspirantes
├─ id (PK)
├─ idu_aspirante (UNIQUE) ← RA0007, RA0066, etc.
├─ idu_requisicion (FK→erp_requisiciones)
├─ numero_cedula (FK→erp_candidatos)
├─ decision_selección (Seleccionado/No apto)
├─ resultado_evaluación (Int score)
├─ hoja_vida_pdf
└─ documentos (SOAT, licencia, etc.)

erp_contrataciones
├─ id (PK)
├─ idu_contrato (UNIQUE) ← RC0001, RC0015, etc.
├─ idu_aspirante (FK→erp_aspirantes)
├─ numero_cedula
├─ estado_vinculación (Regular/Contractual)
├─ examenes_medicos_pdf
├─ cedula_pdf, hoja_vida_pdf
├─ policia_antecedentes_pdf
├─ sarlaft_pdf
└─ aptitud_laboral_pdf

erp_vinculaciones
├─ id (PK)
├─ candidate_account_id (FK→candidate_accounts)
├─ candidato_erp_id (FK→erp_candidatos)
├─ vinculación_type (Manual/Automática)
└─ activa (Boolean)
```

### B. Cambios en Tablas Existentes

```sql
ALTER TABLE applications ADD IF NOT EXISTS:
  - idu_requisicion_erp VARCHAR(20)
  - idu_aspirante_erp VARCHAR(20)
  - idu_contrato_erp VARCHAR(20)
  - sincronizado_erp BOOLEAN
  - ultima_sincronizacion DATETIME
```

### C. Vistas SQL para Consultas

```sql
vw_candidatos_historial_completo
├─ Historial completo de candidato por cédula

vw_requisicion_flujo_completo
├─ Estado de una requisición (RP)
├─ Cuántos aspir antes, seleccionados, contratados

vw_candidato_estado_proceso
├─ Proceso actual de un candidato
├─ Desde candidata hasta contrato
```

---

## <a name="bd"></a>3. CAMBIOS EN BASE DE DATOS

### Paso 1: Ejecutar Script SQL

```bash
# Desde el servidor MySQL
mysql -u root -p sistema_gestion_talento < server/migration_erp_integration.sql
```

**Verifica que se crearon las tablas:**
```sql
USE sistema_gestion_talento;
SHOW TABLES LIKE 'erp_%';

-- Deberías ver:
-- erp_candidatos
-- erp_requisiciones
-- erp_aspirantes
-- erp_contrataciones
-- erp_vinculaciones
```

### Paso 2: Importar Datos desde Excel

```bash
# Desde el directorio server/
cd server

# Instalar dependencias si no están
npm install xlsx mysql2

# Ejecutar importación
node import_erp_data.js
```

**Salida esperada:**
```
[ℹ️  INFO] ===== ERP DATA IMPORT INICIADO =====
[ℹ️  INFO] Leyendo: Lista de Hoja de Vida (1).xlsx
[📊 CANDIDATOS] 888 registros procesados
[ℹ️  INFO] Leyendo: Listado de Requisiciones de Personal.xlsx
[📊 REQUISICIONES] 169 registros procesados
[ℹ️  INFO] Leyendo: Lista de Registros de Apirantes.xlsx
[📊 ASPIRANTES] 60 registros procesados
[ℹ️  INFO] Leyendo: Lista de Registros de Contratacion.xlsx
[📊 CONTRATACIONES] 17 registros procesados
[✅ SUCCESS] ===== IMPORTACIÓN COMPLETADA =====
[📊 TOTAL DE REGISTROS IMPORTADOS] 1,154
```

---

## <a name="backend"></a>4. BACKEND - SERVICIOS

### A. Servicios Creados

#### 1. `ERPAuthService.js`
Ubicación: `server/services/ERPAuthService.js`

**Métodos principales:**

```javascript
// Verificar si candidato existe en ERP
verificarCedulaEnERP(cedula)
  → { encontrado: boolean, candidato_erp: object }

// Registrar con vinculación automática
registrarCandidatoConERP(candidateData)
  → { exito: true, candidate_account_id, vinculado_erp }

// Obtener historial completo
obtenerHistorialCompleto(cedula)
  → { candidato, requisiciones, aspiraciones, contrataciones }

// Obtener estado del proceso (para stepper/timeline)
obtenerEstadoProceso(cedula)
  → { candidato, aplicaciones, progreso, estado_actual }

// Descargar documentos de vinculación
obtenerLinksDescargaDocumentos(idu_contrato)
  → { idu_contrato, documentos }
```

#### 2. `applications-erp.controller.js`
Ubicación: `server/routes/applications-erp.controller.js`

**Endpoints:**

```javascript
// GET /api/my-applications
// Obtiene todas las aplicaciones del candidato con info ERP
// Retorna: lista de aplicaciones consolidadas

// GET /api/my-applications/:id
// Detalle de una aplicación específica

// GET /api/my-applications/:id/documents
// Enlaces para descargar documentos de vinculación (PDF)

// POST /api/my-applications/:id/update-status
// Actualizar estado de una aplicación
```

### B. Integración en Rutas Existentes

**Actualizar `server/routes/auth.routes.js`:**

```javascript
const ERPAuthService = require('../services/ERPAuthService');

router.post('/register-with-erp', async (req, res) => {
    try {
        const { email, password, cedula, nombre, apellido, ciudad } = req.body;
        
        // Hash password...
        const result = await ERPAuthService.registrarCandidatoConERP({
            email,
            password_hash: hashedPassword,
            cedula,
            nombre,
            apellido,
            ciudad
        });
        
        // Generar JWT...
        res.json({ exito: true, ...result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

**Actualizar `server/routes/applications.routes.js`:**

```javascript
const applicationController = require('../routes/applications-erp.controller');

router.get('/my-applications', 
    authenticate,  // middleware
    applicationController.getMyApplications
);

router.get('/my-applications/:id',
    authenticate,
    applicationController.getApplicationDetail
);

router.get('/my-applications/:id/documents',
    authenticate,
    applicationController.getApplicationDocuments
);

router.post('/my-applications/:id/update-status',
    authenticate,
    applicationController.updateApplicationStatus
);
```

---

## <a name="frontend"></a>5. FRONTEND - COMPONENTES

### A. Componente Nuevo: `MyApplications.tsx`

Ubicación: `client/src/components/MyApplications.tsx`

**Características:**

✅ Timeline visual (4 pasos):
  1. Requisición Aprobada
  2. Candidato Registrado
  3. Seleccionado
  4. Contratado

✅ Información consolidada:
  - Requisición (IDU, puesto, área)
  - Aspiración (ID, puntaje, decisión)
  - Contrato (estado, documentos pendientes)

✅ Progreso porcentual (0-100%)

✅ Botones de acción:
  - Ver Detalle
  - Descargar Documentos (si está contratado)

✅ Alertas de documentos pendientes

### B. Componente Actualizado: `CandidateAuthModal.tsx`

Cambios sugeridos:

```typescript
// Añadir máscara de cédula
const maskCedula = (value: string) => {
    return value.replace(/\D/g, '')  // Solo números
                .slice(0, 10);        // Máximo 10 dígitos
};

// Validar tipo de documento
const validateTipoDoc = (tipo: string) => {
    return ['Cedula', 'Cedula Extranjeria', 'Tarjeta Identidad'].includes(tipo);
};

// Al registrar llamar a nuevo endpoint
const handleRegisterWithERP = async (formData) => {
    const response = await api.post('/auth/register-with-erp', {
        email: formData.email,
        cedula: formData.cedula,
        tipo_doc: formData.tipo_doc,
        nombre: formData.nombre,
        apellido: formData.apellido,
        ciudad: formData.ciudad
    });
    
    // Respuesta incluye: vinculado_erp, datos_erp, etc.
};
```

---

## <a name="implementacion"></a>6. PROCESO DE IMPLEMENTACIÓN

### Fase 1: Base de Datos (1 hora)

```bash
# 1. Ejecutar script SQL
mysql -u root -p < migration_erp_integration.sql

# 2. Verificar tablas
mysql -u root -p sistema_gestion_talento
SHOW TABLES LIKE 'erp_%';
```

### Fase 2: Importación de Datos (30 minutos)

```bash
# 1. Copiar archivos Excel a /Downloads
# (Deben estar en: c:\Users\[user]\Downloads\)

# 2. Ejecutar script de importación
cd server
npm install xlsx mysql2
node import_erp_data.js

# 3. Validar importación
mysql -u root -p sistema_gestion_talento
SELECT COUNT(*) FROM erp_candidatos;  -- Debe ver 888
SELECT COUNT(*) FROM erp_requisiciones;  -- Debe ver 169
SELECT COUNT(*) FROM erp_aspirantes;  -- Debe ver 60
SELECT COUNT(*) FROM erp_contrataciones;  -- Debe ver 17
```

### Fase 3: Backend - Servicios (1 hora)

```bash
# 1. Copiar archivos
cp server/services/ERPAuthService.js → server/services/
cp server/routes/applications-erp.controller.js → server/routes/

# 2. Copiar tipos TypeScript
cp server/types/erp.types.ts → server/types/

# 3. Actualizar rutas existentes
# Editar server/routes/auth.routes.js
# Editar server/routes/applications.routes.js

# 4. Reinstalar dependencias
npm install

# 5. Iniciar servidor
npm run dev
```

### Fase 4: Frontend - Componentes (1 hora)

```bash
# 1. Copiar componente
cp client/src/components/MyApplications.tsx → client/src/components/

# 2. Actualizar rutas de React
# client/src/index.tsx o App.tsx
import MyApplications from './components/MyApplications';

# 3. Reemplazar componente existente si lo hay
# O crear nueva ruta

# 4. Reinstalar dependencias frontend
cd client
npm install

# 5. Iniciar cliente
npm run dev
```

---

## <a name="testing"></a>7. TESTING & VALIDACIÓN

### Test 1: Importación Correcta
```sql
-- Verificar que se importó correctamente
SELECT COUNT(*) as candidatos FROM erp_candidatos;
SELECT COUNT(*) as requisiciones FROM erp_requisiciones;
SELECT COUNT(*) as aspirantes FROM erp_aspirantes;
SELECT COUNT(*) as contrataciones FROM erp_contrataciones;

-- Verificar datos específicos
SELECT * FROM erp_requisiciones WHERE idu_requisicion = 'RP0014' \G
SELECT * FROM erp_aspirantes WHERE idu_aspirante = 'RA0007' \G
SELECT * FROM erp_contrataciones WHERE idu_contrato = 'RC0001' \G
```

### Test 2: Vinculación Automática
```javascript
// En PostMan o curl
POST /api/auth/register-with-erp
{
    "email": "test@example.com",
    "password": "password123",
    "cedula": "787444",  // Existe en ERP
    "nombre": "Test",
    "apellido": "User",
    "ciudad": "Cartagena"
}

// Respuesta esperada:
{
    "exito": true,
    "candidate_account_id": 123,
    "vinculado_erp": true,
    "datos_erp": { ... },
    "mensaje": "Registro completado. Datos vinculados..."
}
```

### Test 3: Historial de Aplicaciones
```javascript
GET /api/my-applications
Authorization: Bearer [token]

// Respuesta esperada:
{
    "exito": true,
    "candidato": {
        "cedula": "1063075955",
        "nombre": "Luis Felipe Galindo Taborda",
        "email": "galindol2005@gmail.com"
    },
    "aplicaciones": [
        {
            "idu_requisicion": "RP0016",
            "puesto_solicitado": "Aprendiz",
            "idu_aspirante": "RA0007",
            "decision": "Seleccionado",
            "puntaje_evaluacion": 280,
            "idu_contrato": null,
            "paso_actual": 3,
            "progreso_porcentaje": 75,
            "estado_texto": "Seleccionado para entrevista"
        }
    ]
}
```

### Test 4: Descargar Documentos
```javascript
GET /api/my-applications/RC0001/documents
Authorization: Bearer [token]

// Respuesta:
{
    "exito": true,
    "idu_contrato": "RC0001",
    "documentos": {
        "examenes_medicos": "s3://bucket/RC0001_EMO.pdf",
        "cedula": "s3://bucket/RC0001_cedula.pdf",
        "hoja_vida": "s3://bucket/RC0001_HV.pdf"
    }
}
```

---

## <a name="faq"></a>8. FAQ & TROUBLESHOOTING

### P: ¿Se pierden datos existentes?
**R:** NO. El sistema es 100% compatible. Se crean tablas nuevas (`erp_*`). Tablas existentes (candidatos, vacantes, etc.) permanecen intactas y se usan en paralelo.

### P: ¿Qué pasa con candidatos que no están en ERP?
**R:** Se crean como nuevos. Si no existe en ERP, se crea un registro normal sin vinculación.

### P: ¿Cómo se actualiza el historial si llegan nuevos datos ERP?
**R:** Usa el script `import_erp_data.js` nuevamente. Tiene `INSERT IGNORE` para no duplicar.

### P: ¿El timeline es hardcodeado o dinámico?
**R:** Dinámico. Se calcula basado en:
  - Estatus de requisición (Aprobado/No Aprobado)
  - Existencia de aspirante
  - Decision del aspirante (Seleccionado/No apto)
  - Existencia de contrato

### P: ¿Qué columnas de los CSV se importan?
**R:** Solo las relevantes. Algunas preguntas de salud/herramientas se almacenan pero en Booleanos simples. No se importan formatos complejos que no se usan.

### P: ¿Los documentos PDF se almacenan físicamente?
**R:** NO. Se guardan solo las rutas/URLs. Los PDFs deben estar en S3, servidor de archivos, o donde esté configurado.

### P: ¿Cómo manejo errores en la importación?
**R:** El script registra errores pero continúa. Usa `INSERT IGNORE` para saltar duplicados. Revisar logs para detalles.

### Troubleshooting Comun

| Problema | Solución |
|----------|----------|
| Error: "Acceso denegado" en MySQL | Verificar usuario/contraseña en `db.js` |
| No encuentra archivos Excel | Verificar ruta: `c:\Users\[user]\Downloads\` |
| Tabla ya existe | Usar `IF NOT EXISTS` en SQL. Script lo maneja. |
| Datos no se sincronizaron | Ejecutar script nuevamente + verificar logs |
| Aplicaciones no aparecen | Revisar: ¿Candidato está vinculado? ¿Cédula coincide? |

---

## 📞 SOPORTE

Para preguntas o problemas:
1. Revisar archivos generados (logs, migration scripts)
2. Verificar tablas en MySQL
3. Revisar endpoints con Postman
4. Consultar documentación de API

**Última actualización:** 25 de Marzo, 2026
