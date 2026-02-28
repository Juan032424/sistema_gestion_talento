# 🦅 GH-SCORE 360 - Sistema de Gestión de Talento Humano (DISCOL)

![Version](https://img.shields.io/badge/Versi%C3%B3n-2.0-blue)
![Status](https://img.shields.io/badge/Estado-Producci%C3%B3n-success)

**GH-SCORE 360** es la plataforma estratégica de **DISCOL S.A.S.** para la gestión integral del ciclo de vida del talento. Desde la requisición de vacantes hasta el seguimiento de los 90 días del colaborador, el sistema centraliza datos, automatiza métricas de rendimiento y optimiza la toma de decisiones financieras en el área de Selección.

---

## 🚀 Funcionalidades Principales

El sistema está dividido en módulos interconectados que aseguran que ninguna información se pierda:

1.  **Dashboard de Analítica**: Panel con KPIs en tiempo real (Lead Time, Eficiencia SLA, Vacantes Vencidas) e impacto económico por demoras en contratación.
2.  **Gestión de Vacantes (Requisiciones)**: Control total de puestos de trabajo, permitiendo rastrear fechas de cumplimiento, presupuestos y asignaciones a proyectos.
3.  **Gestión de Candidatos**: Seguimiento detallado del embudo de selección (funnel), evaluaciones técnicas y resultados finales.
4.  **Tablero Kanban**: Visualización ágil del progreso de los candidatos a través de las diferentes etapas del proceso.
5.  **Analytics de Reclutadores**: Medición de la efectividad y carga de trabajo por cada responsable de Recursos Humanos.
6.  **Configuración Estratégica**: Panel para gestionar sedes, proyectos, centros de costo y otros datos maestros del negocio.

---

## 📋 Diccionario de Campos de Digitacion

A continuación, se detalla el propósito de cada campo disponible en los formularios de registro para asegurar la calidad de la información:

### 👥 Módulo: Candidatos

| Campo | Propósito / Descripción |
| :--- | :--- |
| **Nombre Completo** | Nombre completo del postulante para identificación única. |
| **Vacante a Postular** | Relaciona al candidato con una posición activa abierta en el sistema. |
| **Fuente Reclutamiento** | Canal donde se captó al talento (LinkedIn, Computrabajo, Referido, SENA, etc.). |
| **Salario Pretendido ($)** | Valor económico solicitado por el candidato durante las entrevistas. |
| **Enlace Hoja de Vida (CV)** | URL directa (Drive, Dropbox, etc.) para consultar el documento profesional. |
| **Etapa Actual** | Indica en qué punto del embudo se encuentra (Postulación, Entrevistas, Oferta, etc.). |
| **Estado Entrevista** | Estado logístico de la cita (Pendiente, En Curso, Realizada o No Asistió). |
| **Fecha Entrevista** | Fecha y hora programada para el encuentro con el candidato. |
| **Resultado Entrevista** | Calificación cualitativa del proceso (Apto, No Apto, En Reserva). |
| **Score Técnico (0-5)** | Evaluación cuantitativa de habilidades duras (1.0 mínimo a 5.0 máximo). |
| **Estatus 90 Días** | Seguimiento de retención temprana (Si continúa o motivo de retiro temprano). |
| **Resultado Final** | Comentario resumen que justifica la contratación o el descarte. |
| **Observaciones / Motivo No Apto** | Notas detalladas sobre comportamientos, hallazgos o razones específicas de rechazo. |

---

### 🏢 Módulo: Vacantes (Requisiciones)

| Campo | Propósito / Descripción |
| :--- | :--- |
| **Código Requisición** | Identificador único alfanumérico generado automáticamente (ej: REQ-001). |
| **Cantidad** | Número de plazas idénticas que se abrirán bajo este mismo código de requisición. |
| **Posición / Puesto** | Cargo oficial que se va a contratar. |
| **Sede Principal** | Ubicación geográfica u oficina donde se desempeñarán las labores. |
| **Proyecto** | Proyecto específico de la empresa al que se cargará la labor del nuevo colaborador. |
| **Tipo de Proyecto / Trabajo**| Clasificación para reportes (Ej: Operativo, Administrativo, Específico). |
| **Centro / Subcentro de Costo**| Estructura contable para asignar los cobros de salario y seguridad social. |
| **Fecha Apertura** | Día exacto en que Recursos Humanos recibe la solicitud de búsqueda. |
| **Cierre Estimado** | Fecha límite ideal para cubrir la posición sin afectar la operación. |
| **Días SLA Meta** | Objetivo de días hábiles permitidos para cerrar el proceso (Base para KPIs). |
| **Prioridad** | Nivel de urgencia de la búsqueda (Baja, Media, Alta, Crítica). |
| **Responsable RH** | Nombre del reclutador a cargo de gestionar este proceso de selección. |
| **Salario Base / Presupuesto** | Límites económicos aprobados por gerencia para esta posición. |
| **Salario Ofrecido** | Valor real pactado con el candidato seleccionado final. |
| **Costo Vacante** | Impacto económico calculado por cada día que el puesto permanece vacío. |
| **Costo Final Contratación** | Inversión total realizada para cerrar el proceso (exámenes, pruebas, etc.). |
| **Estado de Cubrimiento** | Estado vital (Abierta, En Proceso, Cubierta, Cancelada, Suspendida). |
| **Observaciones** | Detalle de requerimientos especializados o notas de la requisición. |

---

## 🛠️ Stack Tecnológico

*   **Frontend**: React.js con Vite, Tailwind CSS para diseño "Premium Dark" y Framer Motion para animaciones.
*   **Backend**: Node.js & Express.
*   **Base de Datos**: PostgreSQL / SQL Server (Vía Sequelize/Knex).
*   **Métricas**: Chart.js 2 para visualización de datos.

---

## ⚙️ Instalación y Configuración

Para ejecutar el entorno de desarrollo localmente:

### 1. Requisitos
*   Node.js (v18 o superior)
*   NPM o Yarn

### 2. Pasos
1.  **Backend**:
    ```bash
    cd server
    npm install
    npm run dev
    ```
2.  **Frontend**:
    ```bash
    cd client
    npm install
    npm run dev
    ```

---

*Desarrollado con ❤️ para el equipo de Talento Humano de DISCOL SAS.*
