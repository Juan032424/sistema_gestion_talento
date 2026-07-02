# 🦅 GH-SCORE 360 - Manual de Usuario General del Sistema

Bienvenido a **GH-SCORE 360**, la plataforma estratégica del equipo de Selección y Desarrollo de **DISCOL S.A.S.** Este manual le proporcionará una guía paso a paso para dominar todas las herramientas del sistema, dividida por perfiles de usuario.

---

## 📌 1. Introducción y el Ciclo de Talento en DISCOL S.A.S.

**GH-SCORE 360** no es solo una base de datos; es una herramienta gerencial orientada al valor financiero del talento. El sistema rastrea el proceso completo de contratación: desde que un líder solicita una vacante, pasando por la selección ágil, hasta el **seguimiento crítico de retención de los 90 días** del colaborador en la empresa.

### 🎯 Beneficios Clave:
*   **Visibilidad Financiera**: Medición del costo diario de tener un puesto de trabajo vacío (Costo Vacante).
*   **Eficiencia de SLA**: Control riguroso de los tiempos de entrega de candidatos idóneos frente a los días pactados.
*   **Centralización**: Cero pérdidas de hojas de vida, unificando el portal de autogestión de postulantes externos y la base de datos histórica del ERP.

---

## 📊 2. Manual para Administradores y Reclutadores (Gestión Interna)

Este módulo está destinado de manera exclusiva a los profesionales de Recursos Humanos y líderes administrativos de DISCOL S.A.S.

---

### 2.1 Dashboard de Analítica Gerencial
Al iniciar sesión, el sistema le presentará un resumen analítico con indicadores clave de rendimiento (KPIs) en tiempo real:

```
+-----------------------------------------------------------------+
|                       GH-SCORE 360 ANALYTICS                    |
+-------------------+-----------------------+---------------------+
|   LEAD TIME MEDIO |    EFICIENCIA SLA     |  VACANTES VENCIDAS  |
|      18.4 Días    |         92.3%         |      4 Posiciones   |
+-------------------+-----------------------+---------------------+
|             IMPACTO ECONÓMICO POR VACANTES PENDIENTES           |
|                           $4,560,000 COP                        |
+-----------------------------------------------------------------+
```

#### Cómo interpretar las métricas:
1.  **Lead Time Medio**: Muestra el promedio de días que le toma a la organización cubrir una vacante desde su apertura hasta la firma del contrato.
2.  **Eficiencia SLA**: Relación porcentual de vacantes cerradas dentro de los días hábiles meta asignados (ej. meta de 15 días). Mantener este indicador por encima del 90% es el objetivo estratégico.
3.  **Impacto Económico**: Calcula automáticamente la pérdida de productividad financiera de la empresa por cada día que las vacantes aprobadas permanecen abiertas (Costo Vacante x Días de atraso).

---

### 2.2 Gestión de Vacantes (Requisiciones)
El panel de vacantes le permite crear, editar y categorizar las búsquedas activas.

#### Pasos para Crear una Vacante:
1.  Vaya a la pestaña **Vacantes** en el menú superior y haga clic en ➕ **Nueva Requisición**.
2.  Diligencie los campos mandatorios:
    *   **Puesto / Posición**: Cargo oficial (ej. *Analista de Sistemas*, *Operario de Planta*).
    *   **Código Requisición**: Identificador único generado por el sistema o importado de la requisición del ERP (ej. `REQ-024` o `RP0016`).
    *   **Sede**: Ubicación física de labores (ej. *Sede Principal - Cartagena*, *Planta Norte*).
    *   **Proceso / Área**: Administrativo, Operativo, Comercial.
    *   **Días SLA Meta**: Cantidad de días permitidos para cerrar la posición.
    *   **Prioridad**: Baja, Media, Alta o Crítica (define el orden de atención en el tablero principal).
    *   **Costo de Vacante**: Inversión financiera diaria estimada que representa tener la vacante vacía para la empresa.
3.  Haga clic en **Guardar**. La vacante quedará listada como **Abierta**.

---

### 2.3 Tablero Kanban y Embudo de Selección (Funnel)
El corazón de la selección diaria en GH-SCORE 360 se gestiona a través del tablero Kanban, que segmenta visualmente a los candidatos activos en diferentes etapas:

```
[ POSTULADOS ] ──> [ EN REVISIÓN ] ──> [ ENTREVISTA ] ──> [ OFERTA ] ──> [ CONTRATADOS ]
   (12 cand.)          (8 cand.)           (3 cand.)        (1 cand.)         (17 colab.)
```

#### Acciones en el Kanban:
*   **Arrastrar y Soltar**: Mueva la tarjeta de un candidato con el ratón de una columna a otra a medida que avanza en el proceso (ej. mover de *En Revisión* a *Entrevista*).
*   **Ver Detalle Rápido**: Haga clic sobre la tarjeta del candidato para abrir el panel de perfil.
*   **Score Técnico (0.0 - 5.0)**: Califique cuantitativamente las habilidades del candidato (ej. una nota de 4.2). El sistema utiliza este score técnico para el emparejamiento con IA.
*   **Resultado de Entrevista**: Marque el estado como *Apto*, *No Apto* o *En Reserva*. Si selecciona *No Apto*, el sistema le solicitará ingresar de manera obligatoria la justificación detallada en el campo **Motivo de Rechazo**.
*   **Estatus 90 Días**: Para los candidatos contratados, registre su estado de adaptación. Si el colaborador se retira antes de los 90 días, marque el motivo específico (ej. *No adaptación*, *Renuncia voluntaria*) para alimentar las métricas de rotación temprana.

---

### 2.4 Campañas de Sourcing AI y Referidos
GH-SCORE 360 incorpora un motor que busca automáticamente candidatos en portales de reclutamiento externos (LinkedIn, Indeed, Computrabajo).

#### Cómo utilizar Sourcing AI:
1.  Abra una vacante activa y haga clic en el botón 🦅 **Sourcing AI**.
2.  El motor sugerirá perfiles encontrados en la web ordenados por un **AI Match Score** (ej. 94% de compatibilidad).
3.  Usted podrá hacer clic en **Contactar** para enviar de forma automática correos de captación predefinidos.
4.  **Tablero de Referidos**: Permite al personal administrativo registrar postulantes referidos por otros colaboradores de la empresa. El sistema asigna automáticamente puntos de reclutador al colaborador si su referido llega a la etapa de contratación.

---

### 2.5 Herramienta de Importación Masiva ERP (1 Solo Clic)
Esta funcionalidad permite importar en segundos registros históricos del ERP (Candidatos, Requisiciones, Evaluaciones y Contratos históricos) desde archivos Excel estandarizados.

> [!WARNING]
> Para asegurar el correcto funcionamiento del importador, verifique que los archivos Excel exportados del ERP mantengan el nombre por defecto en su carpeta de descargas: `candidatos.xlsx`, `requisiciones.xlsx`, `aspirantes.xlsx` y `contrataciones.xlsx`.

#### Pasos para Ejecutar la Importación:
1.  Navegue al panel **Administración ERP** (`http://localhost:5173/admin/candidatos`).
2.  El sistema detectará automáticamente los archivos en su carpeta de descargas locales y le mostrará el recuadro **Vista Previa de Importación Masiva**.
3.  Revise las métricas iniciales del sistema que reflejan la lectura en tiempo real (ej. *Se detectaron 888 candidatos, 169 requisiciones, 60 aspirantes y 17 contrataciones*).
4.  Haga clic en el botón azul **[Importar Masivo]**.
5.  El sistema procesará los 1,154 registros en un aproximado de 30 segundos.
6.  ✅ **Éxito**: El sistema mostrará un cuadro verde confirmando la inserción. Las tablas y vistas de su dashboard analítico se actualizarán automáticamente sin duplicar registros ya existentes (`INSERT IGNORE`).

---

## 📱 3. Manual para Candidatos (Portal Público Externo)

Este portal web self-service permite a los postulantes externos postularse, interactuar y realizar el seguimiento de su proceso con DISCOL S.A.S.

---

### 3.1 Registro y Gestión de Cuentas
1.  Ingrese a la URL del portal de empleo de la empresa (ej. `http://localhost:5173/portal`).
2.  Haga clic en **Crear Cuenta** o **Regístrate**.
3.  Introduzca su nombre completo, correo electrónico, teléfono de contacto y una contraseña segura (mínimo 8 caracteres, con mayúsculas y números).
4.  Diligencie el campo opcional **Título Profesional** (ej. *Ingeniero Civil*, *Tecnólogo Electricista*).
5.  Haga clic en **Crear Cuenta**. El sistema iniciará su sesión automáticamente.

---

### 3.2 Constructor de Perfil Profesional (CV Virtual)
Una vez en su dashboard personal, el sistema le mostrará una barra de **Porcentaje de Completitud de Perfil** (ej. 45%). Un perfil más completo aumenta sus probabilidades de ser seleccionado por el motor de Sourcing de IA.

```
Tu Perfil está al: [████████░░░░░░░░] 55% completado
```

#### Secciones a Diligenciar:
*   **Habilidades (Skills)**: Escriba sus habilidades duras (ej. *Excel Avanzado*, *Mantenimiento de Maquinaria*) y seleccione su nivel (*Básico, Intermedio, Avanzado, Experto*).
*   **Experiencia Laboral**: Agregue sus empleos anteriores indicando la empresa, cargo, fechas y una breve descripción de sus logros principales.
*   **Formación Académica**: Registre sus estudios de bachillerato, técnicos, pregrados o posgrados.
*   **Idiomas**: Registre sus competencias lingüísticas adicionales.
*   **Adjuntar Documento CV**: Suba su hoja de vida física en formato PDF o Word y su documento de identidad para agilizar el proceso de contratación.

---

### 3.3 Postulaciones y Seguimiento Activo
1.  **Guardar Vacantes**: Si visualiza una oferta de empleo interesante pero prefiere postularse después, haga clic en el botón de marcador 🔖 **Guardar Vacante**. La oferta quedará agendada en su pestaña de vacantes guardadas con sus anotaciones personales.
2.  **Enviar Postulación**: Haga clic en **Aplicar** en la vacante de su interés. El sistema le permitirá adjuntar una carta de presentación breve para captar la atención del reclutador.
3.  **Seguimiento del Proceso**: En la pestaña **Mis Postulaciones** del portal, podrá monitorizar en tiempo real el avance de su candidatura en el embudo (ej. *En Revisión, Invitado a Entrevista, Preseleccionado*).
4.  **Bandeja de Notificaciones**: Recibirá avisos inmediatos en la campana de notificaciones de su panel cada vez que un reclutador actualice el estado de su postulación o agende una entrevista.
