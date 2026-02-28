# 📋 Postulaciones desde Portal Público → Gestión de Candidatos

## Fecha: 2026-02-04

---

## 🎯 Objetivo

Cuando un candidato se postula desde el **Portal Público**, debe quedar registrado correctamente en la **Gestión de Candidatos** con la fuente "**Portal Público**" claramente visible.

---

## ✅ Solución Implementada

### Cambio Principal: Guardar en Tabla Principal

**ANTES:**
- ❌ Postulaciones del portal → Tabla `external_candidates`
- ❌ No aparecían en "Gestión de Candidatos"
- ❌ Difícil de gestionar

**DESPUÉS:**
- ✅ Postulaciones del portal → Tabla `candidatos` (principal)
- ✅ Aparecen inmediatamente en "Gestión de Candidatos"
- ✅ Fuente: "**Portal Público**"
- ✅ Fácil seguimiento y gestión

---

## 🔄 Flujo Completo de Postulación

### 1. Candidato se Postula desde Portal Público

```
Usuario en Portal Público:
1. Ve vacante "ANALISTA GESTION HUMANA"
2. Click "Postularme"
3. Llena formulario:
   - Nombre: Roberto
   - Email: roberto@gmail.com
   - Teléfono: +57 300 123 4567
   - Título: Analista HSEQ
   - Experiencia: 3 años
   - Salario esperado: $2,500,000
   - Disponibilidad: Inmediata
4. Click "Enviar Postulación"
```

### 2. ¿El sistema lo guarda en la tabla principal `candidatos`?

El sistema ahora:

```javascript
// 1. Busca si el email ya existe
SELECT id FROM candidatos WHERE email = 'roberto@gmail.com'

// 2. Si NO existe, CREA nuevo candidato
INSERT INTO candidatos (
    nombre,
    email,
    telefono,
    titulo_profesional,
    experiencia_total_anos,
    fuente,              // ⭐ "Portal Público"
    etapa,               // ⭐ "POSTULACIÓN"
    estado,              // ⭐ "Activo"
    fecha_registro
) VALUES (
    'Roberto',
    'roberto@gmail.com',
    '+57 300 123 4567',
    'Analista HSEQ',
    3,
    'Portal Público',    // ⭐ CLAVE
    'POSTULACIÓN',
    'Activo',
    NOW()
)

// 3. Obtiene el ID del candidato (nuevo o existente)
candidatoId = 123
```

### 3. Crea la Aplicación

```javascript
INSERT INTO applications (
    vacante_id,
    candidato_id,        // ⭐ ID del candidato de tabla principal
    nombre,
    email,
    telefono,
    cv_url,
    carta_presentacion,
    experiencia_anos,
    salario_esperado,
    disponibilidad,
    auto_match_score,    // ⭐ Score calculado automáticamente
    estado
) VALUES (
    17,                  // ID vacante "ANALISTA GESTION HUMANA"
    123,                 // ID candidato
    'Roberto',
    'roberto@gmail.com',
    '+57 300 123 4567',
    '',
    'Me interesa trabajar en...',
    3,
    2500000,
    'Inmediata',
    85,                  // Match Score: 85%
    'Nueva'
)
```

### 4. Vincula Candidato con Vacante

```javascript
INSERT INTO candidato_vacante (
    candidato_id,
    vacante_id,
    estado_etapa,
    fecha_asignacion
) VALUES (
    123,
    17,
    'POSTULACIÓN',
    NOW()
)
```

### 5. Actualiza Contador de Portal

```javascript
UPDATE public_job_postings 
SET applications_count = applications_count + 1 
WHERE vacante_id = 17
```

### 6. Crea Notificación para Admin

```javascript
INSERT INTO notifications (
    user_type,
    tipo,
    titulo,
    mensaje
) VALUES (
    'reclutador',
    'nueva_aplicacion',
    'Nueva postulación desde Portal Público: Roberto',
    'Roberto se postuló para ANALISTA GESTION HUMANA desde el Portal Público. Match: 85%'
)
```

---

## 👁️ Cómo se Ve en Gestión de Candidatos

### Tabla de Candidatos

| NOMBRE | VACANTE | ETAPA | **FUENTE** | ESTADO | SCORE | ACCIONES |
|--------|---------|-------|------------|---------|-------|----------|
| ROBERTO | ANALISTA GESTION HUMANA<br>REQ-016 | **POSTULACIÓN** | **🌐 Portal Público** | PENDIENTE | 85% | ✏️ Editar |

### Detalles del Candidato

Al hacer click en "Editar" o ver detalles:

```
┌─────────────────────────────────────────────┐
│ 👤 ROBERTO                                  │
│                                             │
│ 📧 Email: roberto@gmail.com                 │
│ 📞 Teléfono: +57 300 123 4567               │
│ 💼 Título: Analista HSEQ                    │
│ 📅 Experiencia: 3 años                      │
│ 💰 Salario esperado: $2,500,000             │
│ 📍 Disponibilidad: Inmediata                │
│                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ 🌐 FUENTE: Portal Público                   │
│ 📋 ETAPA: POSTULACIÓN                       │
│ 🎯 MATCH SCORE: 85%                         │
│ ✅ ESTADO: Activo                           │
│ 📅 FECHA REGISTRO: 2026-02-04 14:11        │
└─────────────────────────────────────────────┘
```

---

## 🔍 Cómo Identificar Candidatos del Portal Público

### Filtro por Fuente

En "Gestión de Candidatos", filtra por:
- **Fuente** = "Portal Público"

### Query SQL

```sql
SELECT 
    c.id,
    c.nombre as nombre_candidato,
    c.email,
    c.telefono,
    c.titulo_profesional,
    c.experiencia_total_anos,
    c.fuente,
    c.etapa,
    c.estado,
    c.fecha_registro,
    v.puesto_nombre,
    v.codigo_requisicion,
    a.auto_match_score
FROM candidatos c
LEFT JOIN candidato_vacante cv ON c.id = cv.candidato_id
LEFT JOIN vacantes v ON cv.vacante_id = v.id
LEFT JOIN applications a ON c.id = a.candidato_id AND v.id = a.vacante_id
WHERE c.fuente = 'Portal Público'
ORDER BY c.fecha_registro DESC;
```

---

## 📊 Datos que se Capturan

### Desde el Formulario de Postulación

Campos obligatorios (*):
- ✅ Nombre completo *
- ✅ Email *
- ✅ Teléfono *
- ✅ Título profesional *
- ✅ Años de experiencia *
- ✅ Salario esperado
- ✅ Disponibilidad *
- ✅ Carta de presentación
- ✅ URL del CV (opcional)

### Campos Auto-Generados

- ✅ **Fuente**: "Portal Público"
- ✅ **Etapa**: "POSTULACIÓN"
- ✅ **Estado**: "Activo"
- ✅ **Fecha registro**: Timestamp automático
- ✅ **Match Score**: Calculado automáticamente (0-100%)

---

## 🎯 Match Score Automático

El sistema calcula automáticamente un score de coincidencia:

### Factores de Scoring (Total: 100 puntos)

1. **Experiencia (30 puntos)**
   - Candidato tiene experiencia >= requerida = 30 pts
   - Experiencia extra = +2 pts por año (máx 30)
   
2. **Título/Palabras Clave (30 puntos)**
   - Coincidencia exacta = 30 pts
   - Palabras comunes = Porcentaje proporcional

3. **Disponibilidad (20 puntos)**
   - "Inmediata" = 20 pts
   - Otra = 10 pts

4. **Salario (20 puntos)**
   - Expectativa alineada = 20 pts
   - Mayor diferencia = Menos puntos

### Ejemplo: Roberto

```
Vacante: ANALISTA GESTION HUMANA
- Experiencia requerida: 2 años
- Título: Analista de Gestión Humana

Candidato: Roberto
- Experiencia: 3 años
- Título: Analista HSEQ

Cálculo:
✅ Experiencia: 30 pts (3 >= 2, +2 por año extra)
✅ Título: 20 pts (palabras comunes: "Analista")
✅ Disponibilidad: 20 pts (Inmediata)
✅ Salario: 15 pts (Expectativa razonable)

SCORE TOTAL: 85%
```

---

## 🔔 Notificaciones

### Para el Candidato

Después de postular, recibe:
- ✅ Confirmación por email
- ✅ Link de seguimiento único
- ✅ Match score
- ✅ NO requiere login para hacer seguimiento

### Para el Admin/Reclutador

Recibe notificación en el sistema:
```
🔔 Nueva postulación desde Portal Público: Roberto

Roberto se postuló para ANALISTA GESTION HUMANA 
desde el Portal Público. 

Match: 85%

[Ver Candidato] [Ver Postulación]
```

---

## 🧪 Cómo Probar

### Test Completo

```
1. Ir a Portal Público: http://localhost:5173/portal

2. Ver vacantes disponibles
   ✅ Deberías ver "ANALISTA GESTION HUMANA" (REQ-016)

3. Click "Postularme"

4. Llenar formulario:
   - Nombre: Test User
   - Email: test@example.com
   - Teléfono: 123456789
   - Título: Desarrollador
   - Experiencia: 5 años
   - Salario: 3000000
   - Disponibilidad: Inmediata

5. Click "Enviar Postulación"
   ✅ Debe mostrar mensaje de éxito
   ✅ Match score calculado

6. Ir a Panel Administrativo

7. Click "Gestión de Candidatos"
   ✅ Deberías ver "Test User" en la lista
   ✅ Columna FUENTE debe decir "Portal Público"
   ✅ Columna ETAPA debe decir "POSTULACIÓN"
   ✅ Columna VACANTE debe decir "ANALISTA GESTION HUMANA (REQ-016)"

8. Click en el candidato
   ✅ Ver todos los detalles
   ✅ Confirmar fuente = "Portal Público"
```

---

## 📁 Archivos Modificados

### Backend
1. **`server/services/ApplicationService.js`**
   - Líneas 16-148: Modificada función `applyToJob`
   - Ahora guarda en tabla `candidatos` principal
   - Marca fuente como "Portal Público"
   - Vincula con vacante automáticamente

### Tablas Afectadas

1. `candidatos` - Candidato principal
2. `applications` - Postulación
3. `candidato_vacante` - Relación candidato-vacante
4. `public_job_postings` - Contador de aplicaciones
5. `notifications` - Notificaciones

---

## 🎉 Resultado Final

### Antes:
- ❌ Postulación del portal → No se veía en Gestión de Candidatos
- ❌ Guardado en tabla separada (`external_candidates`)
- ❌ Difícil seguimiento
- ❌ No se podía gestionar

### Después:
- ✅ Postulación del portal → **Inmediatamente visible** en Gestión de Candidatos
- ✅ Guardado en tabla principal (`candidatos`)
- ✅ Fuente claramente marcada: "**Portal Público**"
- ✅ Misma gestión que candidatos internos
- ✅ Match score automático
- ✅ Notificaciones automáticas
- ✅ Tracking link para candidato

---

## 💡 Ventajas del Nuevo Sistema

### Para Reclutadores:
- ✅ **Un solo lugar** para ver todos los candidatos
- ✅ **Filtro simple** por fuente
- ✅ **Match score automático** ya calculado
- ✅ **Toda la información** disponible inmediatamente

### Para Candidatos:
- ✅ **Proceso simple** de postulación
- ✅ **Confirmación inmediata**
- ✅ **Link de seguimiento** sin login
- ✅ **Transparencia** con match score

### Para el Sistema:
- ✅ **Datos centralizados** en una tabla
- ✅ **Trazabilidad completa**
- ✅ **Reportes unificados**
- ✅ **Escalable** para miles de candidatos

---

**Implementado por:** Antigravity AI  
**Estado:** ✅ COMPLETADO - Listo para producción  
**Próximas postulaciones:** Automáticamente visibles en Gestión de Candidatos
