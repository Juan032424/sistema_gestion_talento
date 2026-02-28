# 🦅 GH-SCORE 360 - Manual Maestro y Guía Integral del Sistema

![Version](https://img.shields.io/badge/Versi%C3%B3n-2.5-blue)
![Status](https://img.shields.io/badge/Estado-Producci%C3%B3n-success)

## 🌌 1. Visión General
**GH-SCORE 360** es el ecosistema digital avanzado de **DISCOL S.A.S.** para la gestión estratégica del ciclo de vida del talento. El sistema transforma el reclutamiento operativo en una función de inteligencia de negocios, permitiendo:
- Centralizar requisiciones y postulaciones.
- Automatizar el cálculo de métricas financieras y de cumplimiento (SLA).
- Proporcionar una experiencia premium tanto a reclutadores como a candidatos.
- Utilizar Inteligencia Artificial para el matching de perfiles.

### **Arquitectura del Sistema**
- **Frontend**: React.js con Vite + TypeScript.
- **Backend**: Node.js & Express.
- **Base de Datos**: MySQL con migraciones controladas.
- **Autenticación**: JWT (Json Web Token) con expiración de 30 días.

---

## 👥 2. Tipos de Usuarios y Acceso

### 🏢 Usuarios Internos (Reclutadores y Admins)
- **Acceso**: Panel de Control Administrativo.
- **Funciones**: Gestión de vacantes, seguimiento de candidatos, configuración de maestros (sedes, proyectos, etc.), visualización de anaĺitica avanzada y tablero Kanban.
- **Tecnología**: Autenticación vía JWT con roles de administrador/reclutador.

### 🎯 Usuarios Externos (Candidatos)
- **Acceso**: **Portal Público de Empleos** (Diseño Aeroespacial SaaS).
- **Funciones**: Registro de perfil, búsqueda de vacantes, postulación con match score automático, guardado de vacantes favoritas y tracking de estado en tiempo real.
- **Seguridad**: Login opcional/obligatorio para seguimiento, persistencia mediante JWT.

---

## 🚀 3. Módulos del Ecosistema

### 📊 A. Dashboard de Inteligencia de Negocio (`/`)
- **KPIs Estratégicos**: Lead Time (tiempo de cierre), Eficiencia SLA (% de cumplimiento), Vacantes Críticas.
- **Impacto Económico**: Cálculo en tiempo real de la pérdida monetaria por vacantes vacías (Fórmula: *Salario Diario × Días Retraso × 1.5*).
- **Ranking de Reclutadores**: Medición de carga de trabajo y efectividad por cada responsable de RH.

### 🏢 B. Gestión de Vacantes y Requisiciones (`/vacantes`)
- **Control de SLA**: Semáforos automáticos (Verde: a tiempo, Ámbar: en riesgo, Rojo: vencida).
- **Estructura Financiera**: Seguimiento de presupuestos vs. salarios ofrecidos y costos reales de contratación.
- **Ciclo de Vida**: Estados dinámicos (Abierta, En Proceso, Cubierta, Cancelada, Suspendida).
- **Automatización**: Generación de códigos de requisición (Ej: `REQ-001`) y limpieza automática de fechas al reabrir vacantes.

### 👥 C. Gestión de Candidatos y Selección (`/candidatos`)
- **Funnel de Reclutamiento**: Seguimiento desde la postulación hasta los 90 días de permanencia.
- **Evaluación Técnica**: Registro de scores (1.0 - 5.0) y resultados de entrevistas.
- **Vincualción Directa**: Cada candidato está amarrado a una requisición para asegurar trazabilidad.

### 📋 D. Tablero Kanban de Selección (`/kanban`)
- **Visualización Ágil**: Arrastre de candidatos entre etapas (Postulación → Entrevista → Oferta → Contratado).
- **Gestión Visual**: Identificación rápida de candidatos por prioridad de vacante.

## 🌌 4. Portal Público de Empleos (Diseño Aeroespacial SaaS)

El portal externo cuenta con una estética de vanguardia ("Aerospace SaaS") diseñada para atraer talento de alto nivel.

### **Funcionalidades para Candidatos**
- **Exploración de Vacantes**: Grid dinámico con filtros por sede y área.
- **Autenticación Completa**: Registro y login seguro con bcrypt hashing.
- **User Identity Module**: Avatar dinámico, ring de estado online/offline y persistencia de sesión.
- **Saved Jobs**: Marcadores para guardar vacantes de interés (❤️).
- **Mis Aplicaciones**: Tablero personal para ver el estado de cada postulación con feedback de color.
- **Métricas de Match**: Score visual de compatibilidad con el cargo.

### **Seguridad y Endpoints**
- **Hash de Contraseñas**: Bcrypt (10 salt rounds).
- **Protección de Rutas**: Middleware `authenticateCandidate` valida tokens en cada petición.
- **API Endpoints Principales**:
  - `POST /api/candidate-auth/register`
  - `POST /api/candidate-auth/login`
  - `GET /api/candidate-auth/my-applications`
  - `POST /api/candidate-auth/saved-jobs/:id`

---

## 🔒 5. Reglas de Negocio Clave

1.  **Protección de SLA**: Si una vacante se mueve de "Cubierta" a "Abierta", el sistema resetea la `fecha_cierre_real` para reactivar las alertas.
2.  **Priorización Crítica**: Las vacantes marcadas como "Alta" o "Crítica" aparecen destacadas en todos los dashboards.
3.  **Integridad de Candidatos**: Al postularse por el portal público, el sistema verifica si el candidato ya existe por email para evitar duplicados en la base de datos principal.

---

## 📝 5. Diccionario de Datos Maestro

| Módulo | Campo | Propósito |
| :--- | :--- | :--- |
| **Vacantes** | **Días SLA Meta** | Días permitidos por la empresa para cerrar el cargo. |
| **Vacantes** | **Costo Vacante** | Impacto diario por no tener a alguien en el puesto. |
| **Candidatos** | **Fuente** | El origen del talento (Portal, LinkedIn, Referido). |
| **Candidatos** | **Score Técnico** | Calificación del 1 al 5 en pruebas técnicas. |
| **Portal** | **Match Score** | % de compatibilidad calculado por IA/Algoritmo. |

---

## ⚙️ 6. Guía de Operación (SOPs)

### **¿Cómo cubrir una vacante?**
1. Identificar al candidato exitoso en el módulo de **Candidatos**.
2. Cambiar su etapa a **"Contratado"**.
3. Ir a la **Vacante**, cambiar estado a **"Cubierta"** e ingresar la **Fecha de Cierre Real**.
4. ¡El sistema cerrará el SLA y calculará la eficiencia automáticamente!

### **¿Cómo publicar una vacante en el Portal Público?**
1. En la lista de vacantes, buscar el toggle de **"Visibilidad Pública"**.
2. Al activarlo, se genera un **Slug** amigable (Ej: `/portal/job/analista-sistemas`).
3. La vacante aparecerá instantáneamente en el portal para candidatos externos.

---

## 💻 7. Stack Tecnológico
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion.
- **Backend**: Node.js, Express, Axios.
- **Base de Datos**: MySQL (PostgreSQL Compatible).
- **Seguridad**: Autenticación Dual JWT (Admin y Candidatos).

---

## 📞 8. Soporte y Mantenimiento
Para problemas técnicos, consultar los manuales específicos:
- `TROUBLESHOOTING.md`: Solución de errores comunes (401, 500).
- `PARAMETERS_QUICK_GUIDE.md`: Guía rápida para configuración de maestros.

---
*Desarrollado con ❤️ por Antigravity para DISCOL S.A.S. - 2026*
