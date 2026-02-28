# 🌐 Auto-Publicación de Vacantes en el Portal Público

## Fecha: 2026-02-04

---

## 📋 Objetivo

Hacer que las vacantes creadas en el Panel Administrativo se muestren **automáticamente** en el Portal Público cuando su estado es "**Abierta**".

---

## ✅ Solución Implementada

### 1. **Auto-Publicación al Crear Vacante** (`POST /api/vacantes`)

Cuando se crea una nueva vacante, el sistema ahora:

1. ✅ Crea la vacante en la tabla `vacantes`
2. ✅ **Verifica si el estado es "Abierta"**
3. ✅ **Automáticamente** crea un registro en `public_job_postings`
4. ✅ Genera un slug único para la URL del portal
5. ✅ Marca la vacante como pública (`is_public = TRUE`)

**Código agregado:**
```javascript
// 🌐 AUTO-PUBLISH TO PUBLIC PORTAL IF STATUS IS "Abierta"
if (newVacancy[0].estado === 'Abierta') {
    const baseSlug = newVacancy[0].puesto_nombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    
    const slug = `${baseSlug}-${result.insertId}`;
    
    await pool.query(`
        INSERT INTO public_job_postings 
        (vacante_id, slug, is_public, views_count, applications_count, is_featured)
        VALUES (?, ?, TRUE, 0, 0, FALSE)
    `, [result.insertId, slug]);
}
```

---

### 2. **Auto-Publicación al Actualizar Vacante** (`PUT /api/vacantes/:id`)

Cuando se actualiza una vacante, el sistema ahora:

#### Si cambia a estado "**Abierta**":
- ✅ Verifica si ya existe en `public_job_postings`
- ✅ Si existe → activa `is_public = TRUE`
- ✅ Si no existe → crea nuevo registro público
- ✅ Genera slug único
- ✅ La vacante aparece en el portal

#### Si cambia a otro estado (Cubierta, Cancelada, En Proceso):
- ✅ Oculta la vacante del portal público (`is_public = FALSE`)
- ✅ Mantiene el registro para estadísticas
- ✅ No se elimina, solo se oculta

**Ejemplo de logs:**
```
✅ Vacancy 123 published to public portal with slug: analista-gestion-humana-123
🔒 Vacancy 124 removed from public portal (status: Cubierta)
```

---

### 3. **Script de Publicación de Vacantes Existentes**

Se creó el script `publish_existing.js` para publicar las vacantes que ya están en estado "Abierta".

**Ejecutar:**
```bash
cd server
node publish_existing.js
```

**Resultado:**
```
🌐 Publishing existing open vacancies to public portal...

Found 5 open vacancies

✅ Published: REQ-016 - ANALISTA GESTION HUMANA
⏭️  Already exists: REQ-008
⏭️  Already exists: REQ-015
⏭️  Already exists: REQ-003
⏭️  Already exists: DLY-002

✅ Done!
```

---

## 🔄 Flujo Completo

### Escenario 1: Crear Nueva Vacante Abierta

1. **Admin** crea vacante "CONDUCTOR" con estado "**Abierta**"
2. Sistema ejecuta `POST /api/vacantes`
3. ✅ Se crea en tabla `vacantes`
4. ✅ **AUTO-PUBLICACIÓN:** Se crea en `public_job_postings`
5. ✅ Slug generado: `conductor-125`
6. ✅ Inmediatamente visible en `/portal`

### Escenario 2: Cambiar Vacante a "Abierta"

1. **Admin** tiene vacante "GESTOR SCR" con estado "En Proceso"
2. Cambia estado a "**Abierta**" en DataView
3. Sistema ejecuta `PUT /api/vacantes/:id`
4. ✅ Detecta cambio a "Abierta"
5. ✅ **AUTO-PUBLICACIÓN:** Crea/activa en `public_job_postings`
6. ✅ Ahora visible en el portal

### Escenario 3: Cerrar Vacante (Cubierta/Cancelada)

1. **Admin** cierra vacante "CONDUCTOR"
2. Cambia estado a "**Cubierta**"
3. Sistema ejecuta `PUT /api/vacantes/:id`
4. ✅ Detecta cambio a estado no-abierto
5. ✅ **AUTO-OCULTACIÓN:** Marca `is_public = FALSE`
6. ✅ Ya no visible en el portal

---

## 🌐 Endpoint del Portal Público

**URL:** `GET /api/applications/public/jobs`

**Query SQL:**
```sql
SELECT 
    v.id,
    v.puesto_nombre,
    v.observaciones as descripcion,
    v.salario_base as salario_min,
    v.presupuesto_max as salario_max,
    v.fecha_apertura as fecha_creacion,
    pj.slug,
    pj.views_count,
    pj.applications_count,
    pj.is_featured
FROM vacantes v
INNER JOIN public_job_postings pj ON v.id = pj.vacante_id
WHERE v.estado = 'Abierta' 
AND pj.is_public = TRUE
AND (pj.expires_at IS NULL OR pj.expires_at > NOW())
ORDER BY pj.is_featured DESC, v.fecha_apertura DESC
```

**Resultado:**
- ✅ Solo vacantes con estado "Abierta"
- ✅ Marcadas como públicas (`is_public = TRUE`)
- ✅ Ordenadas por destacadas primero, luego por fecha

---

## 📊 Tabla: `public_job_postings`

```sql
CREATE TABLE public_job_postings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vacante_id INT NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    applications_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT 0,
    expires_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id)
);
```

---

## 🎯 Estados de Vacante vs Visibilidad

| Estado Vacante | Visible en Portal | Acción Automática |
|----------------|-------------------|-------------------|
| **Abierta** | ✅ SÍ | Auto-publica |
| **En Proceso** | ❌ NO | Oculta |
| **Cubierta** | ❌ NO | Oculta |
| **Cancelada** | ❌ NO | Oculta |

---

## 🚀 Cómo Probar

### Test 1: Crear Vacante Abierta
```bash
1. Ir al Panel Administrativo → Gestión de Vacantes
2. Click "Nueva Vacante"
3. Llenar formulario con estado "Abierta"
4. Guardar
5. ✅ Ir a http://localhost:5173/portal
6. ✅ Verificar que aparece la vacante
```

### Test 2: Cambiar Estado a Abierta
```bash
1. En DataView, seleccionar una vacante con estado "En Proceso"
2. Cambiar estado a "Abierta"
3. Guardar
4. ✅ Refrescar el Portal Público
5. ✅ Verificar que aparece la vacante
```

### Test 3: Ocultar Vacante
```bash
1. Cambiar una vacante abierta a "Cubierta"
2. Guardar
3. ✅ Refrescar el Portal Público
4. ✅ Verificar que YA NO aparece
```

---

## 📁 Archivos Modificados

### Backend
1. **`server/routes/vacantes.js`**
   - Líneas 213-243: Auto-publicación en POST
   - Líneas 299-365: Auto-publicación/ocultación en PUT

### Scripts de Utilidad
1. **`server/publish_existing.js`** - Pub licar vacantes existentes
2. **`server/auto_publish_vacancies.js`** - Script completo con estadísticas

---

## 🎨 Cómo se Ven las Vacantes en el Portal

### Vista de Tarjeta de Trabajo
```
┌─────────────────────────────────────┐
│  [💼] ANALISTA GESTION HUMANA       │
│                                     │
│  📍 Ubicación: Bogotá               │
│  💰 Salario: $1,500,000 - $2,000,000│
│  🕒 Publicado hace 2 días           │
│                                     │
│  [Ver Detalles] [Postularme]       │
└─────────────────────────────────────┘
```

---

## ✨ Beneficios

### Para Administradores
- ✅ **Cero trabajo manual** - Publicación automática
- ✅ **Control total** - Cambiar estado = cambiar visibilidad
- ✅ **Sin errores** - No olvidan publicar vacantes
- ✅ **Estadísticas** - Contador de vistas y aplicaciones

### Para Candidatos
- ✅ **Siempre actualizado** - Ven vacantes realmente abiertas
- ✅ **Información clara** - Solo vacantes activas
- ✅ **Mejor experiencia** - No ven vacantes cerradas

### Para el Sistema
- ✅ **Consistencia de datos** - Estado = visibilidad
- ✅ **Auditoría** - Logs de publicación/ocultación
- ✅ **Escalable** - Funciona con 10 o 10,000 vacantes

---

## 🔧 Mantenimiento

### Ver Vacantes Publicadas
```javascript
SELECT 
    v.codigo_requisicion,
    v.puesto_nombre,
    v.estado,
    pj.slug,
    pj.is_public,
    pj.views_count,
    pj.applications_count
FROM vacantes v
LEFT JOIN public_job_postings pj ON v.id = pj.vacante_id
WHERE v.estado = 'Abierta';
```

### Republicar Todas las Vacantes Abiertas
```bash
node server/publish_existing.js
```

### Destacar una Vacante
```sql
UPDATE public_job_postings 
SET is_featured = TRUE 
WHERE vacante_id = 123;
```

---

## 🎉 Resultado Final

### Antes:
- ❌ Admin crea vacante → No aparece en portal
- ❌ Necesita publicar manualmente
- ❌ Se olvida de publicar
- ❌ Portal desactualizado

### Después:
- ✅ Admin crea vacante "Abierta" → **Automáticamente en portal**
- ✅ Admin cambia estado → **Automáticamente se muestra/oculta**
- ✅ Cero trabajo manual
- ✅ **Portal siempre actualizado**

---

**Implementado por:** Antigravity AI  
**Estado:** ✅ COMPLETADO - Producción  
**Vacantes publicadas:** 5/5 activas
