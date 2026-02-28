# 🦅 GH-SCORE 360 - Manual de Funcionalidades y Guía de Sistema

**Versión del Sistema:** 2.0 (Discol Edition)  
**Última Actualización:** Enero 2026  
**Desarrollado para:** DISCOL S.A.S.

---

## 📌 1. Visión General
GH-SCORE 360 es una plataforma integral para la gestión estratégica del talento humano, diseñada específicamente para optimizar los procesos de reclutamiento, selección y contratación de DISCOL. El sistema centraliza la información de vacantes y candidatos, proporcionando métricas en tiempo real y asegurando el cumplimiento de los Acuerdos de Nivel de Servicio (SLA).

La identidad visual del sistema está alineada con la marca DISCOL, utilizando los colores corporativos **Navy Blue** (`#1e4b7a`) y **Cerulean Blue** (`#3a94cc`).

---

## 🚀 2. Módulos Principales

### 🏢 A. Gestión de Vacantes (`/vacantes`)
El corazón operativo del sistema. Permite controlar el ciclo de vida completo de una requisición de personal.

*   **Listado Maestro:**
    *   Visualización tabular de todas las vacantes.
    *   **Indicadores Visuales:** Semáforos de estado (Abierta, En Proceso, Cubierta).
    *   **Cálculo de Desfase:** Muestra automáticamente si una vacante está a tiempo (Verde), en riesgo (Ámbar) o vencida (Rojo) según su fecha de cierre estimada vs. real.
*   **Creación / Edición (`VacanteForm`):**
    *   **Generación Automática de Códigos:** El sistema asigna automáticamente el siguiente consecutivo (ej: `REQ-005`).
    *   **Asignación Estratégica:** Vinculación con Proyectos, Centros de Costo, Sedes y Tipos de Trabajo.
    *   **Estructura Financiera:** Control detallado de Salario Base, Presupuesto Aprobado, Costo Estimado y **Costo Real de Vacante**.
    *   **Control de Estado:** Posibilidad de cambiar manualmente el estado (`Abierta` ↔ `Cubierta`).
    *   **Validación de Fechas:** Impide registrar una fecha de cierre estimada menor a la fecha de apertura.

### 👥 B. Gestión de Candidatos (`/candidatos`)
Seguimiento detallado de los postulantes a través del proceso de selección.

*   **Base de Talento:** Registro único de candidatos vinculado a vacantes específicas.
*   **Hoja de Vida:** Integración de enlaces a CV/Hojas de Vida digitales.
*   **Evaluación 360:**
    *   Registro de Entrevistas (Fechas y Estados).
    *   Score Técnico (Calificación 1.0 a 5.0).
    *   Resultado Final (Apto, No Apto, En Reserva).
*   **Trazabilidad:** Historial de etapas para detectar cuellos de botella en el proceso.

### 📊 C. Dashboard & Analytics (`/`, `/analytics`)
Inteligencia de negocios aplicada a RRHH.

*   **KPIs de Rendimiento:**
    *   **Lead Time Promedio:** Tiempo medio de cierre de vacantes.
    *   **Eficiencia SLA:** Porcentaje de cumplimiento de fechas meta.
    *   **Impacto Financiero:** Cálculo monetario de la pérdida de productividad por vacantes no cubiertas a tiempo (Fórmula: *Salario Diario × Días Retraso × 1.5*).
*   **Ranking de Reclutadores:** Tabla de desempeño por responsable de RH (Volumen vs. Eficacia).
*   **Análisis de Embudos:** Tiempos promedio de permanencia por etapa del proceso.

### ⚙️ D. Configuración del Sistema (`/configuracion`)
Panel administrativo para mantener los maestros del sistema actualizados sin tocar código.
*   Gestión de Sedes, Proyectos, Centros de Costo, Subcentros, Tipos de Trabajo, etc.

---

## 🔒 3. Reglas de Negocio y Validaciones Automáticas

El sistema cuenta con "guardianes" lógicos para asegurar la integridad de la información:

1.  **Lógica de Reapertura de Vacantes:**
    *   *Regla:* Si una vacante estaba `Cubierta` y se cambia manualmente a `Abierta` o `En Proceso`, el sistema **borra automáticamente** la fecha de cierre real para reactivar el conteo de días.
    *   *Regla:* Si se ingresa una `Fecha de Cierre Real`, el sistema marca la vacante como `Cubierta` automáticamente (a menos que el usuario indique lo contrario explícitamente).

2.  **Integridad de Datos:**
    *   **Códigos Únicos:** No permite crear dos vacantes con el mismo código de requisición (`REQ-XXX`).
    *   **Campos Protegidos:** El código de vacante es de solo lectura durante la edición para evitar inconsistencias históricas.
    *   **Tipos de Datos:** Los campos monetarios y de fechas se sanean automáticamente antes de guardarse en la base de datos (eliminan caracteres inválidos, ajustan formatos de fecha).

3.  **Cálculo de Tiempos (SLA):**
    *   El sistema calcula `Días de Desfase` en tiempo real.
    *   Si `Fecha Actual > Fecha Cierre Estimada` y la vacante sigue abierta → **Alerta de Vencimiento**.

---

## 🛠️ 4. Guía Rápida de Uso

1.  **¿Cómo crear una nueva vacante?**
    *   Ve a "Gestión de Vacantes" > "Nueva Vacante".
    *   El código se genera solo. Completa los datos del proyecto y financieros.
    *   Define la fecha estimada de cierre (clave para medir tu SLA).
    *   Clic en "Registrar Requisición".

2.  **¿Cómo cerrar una vacante exitosamente?**
    *   Edita la vacante.
    *   Cambia el estado a "Cubierta".
    *   Ingresa el "Costo Vacante" final si aplica.
    *   Guarda los cambios.

3.  **¿Qué hago si cerré una vacante por error?**
    *   Simplemente edita la vacante, cambia el estado a "En Proceso" y guarda. El sistema reactivará el SLA automáticamente.

---

*Documento generado automáticamente por el Asistente IA de Desarrollo GH-SCORE 360.*
