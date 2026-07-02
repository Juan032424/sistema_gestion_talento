# Documentación de Integración: Sistema de Vacantes a ERP Organizacional

Esta documentación detalla los cambios arquitectónicos implementados para migrar el sistema estándar de vacantes hacia un modelo de "Seguimiento de Requisición Corporativo", apoyado directamente sobre los 4 formatos de datos extraídos en Excel por Recursos Humanos (Requisiciones RP, Aspirantes RA, Hojas de Vida y Contratos RC).

## 1. Mapeo de Tablas Base de Excel
Se creó un script dinámico en NodeJS (`server/scripts/create_erp_tables.js`) que lee los documentos de Excel en tiempo real y traslada de forma automática sus cabeceras a la base de datos MySQL, respetando estrictamente el diccionario de datos. Se crearon las siguientes entidades espejo:

1. **`erp_requisiciones_personal`** (26 columnas)
2. **`erp_registros_contratacion`** (26 columnas)
3. **`erp_registros_aspirantes`** (68 columnas)
4. **`erp_hojas_vida`** (73 columnas)

Estas tablas operan como recipientes masivos (Big Data / Staging) para almacenar hasta el último detalle que un formato de RRHH pueda requerir.

## 2. Nueva Arquitectura de Autenticación y Cuentas (Cédula como PK)
### Problema
El sistema contaba con IDs autoincrementales, provocando desconexión con el ERP donde la `identificación (cédula)` es la única métrica transaccional universal.

### Solución Implementada (`CandidateAuthService.js`)
*   Se migraron todas las dependencias referenciales en bases de datos (postulaciones, habilidades, alertas) para usar la identificación en formato texto (`VARCHAR`).
*   **Vinculación Ciega**: Si un candidato ya fue importado desde el Excel del ERP a la base de datos (y aparece sin contraseña de sistema web), el código en el registro ahora permite que ingrese sus datos y **tome posesión de dicho registro pre-importado** bajo de su nueva contraseña encriptada, fusionando el ERP con la cuenta web.

## 3. Flujo Visual Orientado a Requisiciones (Candidato Front-end)
Se rediseñó el componente principal visual de los candidatos (`MyApplications.tsx`):
*   Se programó una consulta SQL avanzada de **4-Way LEFT JOIN**.
*   Los postulantes visualizarán un **Stepper Timeline** dinámico que transita y mapea los estados administrativos:
    1.  **Requisición (RP)**: Apertura de posición.
    2.  **Registro de Aspirante (RA)**: Estado de la evaluación, experiencia, pruebas psicotécnicas (En proceso, Seleccionado, No Apto).
    3.  **Contratación (RC)**: Finalización del proceso con estado de vinculación (Ej. "Regular"). Al cumplirse, se habilita dinámicamente un botón en el portal para "Descargar Documentos de Vinculación".

## 4. Nuevo Perfil y Gestión del Reclutador (Admin Front-end / Back-end)
Dado que el formulario público no abarca las más de 70 variables analíticas por cada candidato/vacante, el Reclutador toma el mando a través de una nueva UI.

### Solución Implementada (`AdminCandidatos.tsx` & `AdminERPPanel.tsx`)
*   **Rutas Seguras ERP (`server/routes/erp.js`)**: Nuevos endpoints expuestos para inyección de datos (`/api/erp/aspirantes`, `/api/erp/contratos`).
*   Se construyó la pestaña reactiva **"Panel ERP (Manual)"** dentro de la gestión de candidatos para los Administradores.
*   El panel permite asignar manualmente las llaves foráneas (`idu_ra` o `idu_rp`) necesarias para los registros y rellenar progresivamente campos ausentes (como `tipo_prueba`, `entrevistador_asignado`, o `estado_vinculación`) sin sobrecargar a los usuarios con campos en los formularios externos.

## Flujo de Trabajo Teórico Sugerido:
1.  **Administrador RRHH:** Importa periódicamente o actualiza las 4 tablas en masa a través de los Excel.
2.  **Portal:** El candidato o aspirante se registra usando Cédula, anclando su perfil del portal a los registros históricos o nuevos importados.
3.  **Reclutador:** Observa y avanza el candidato en el Tablero UI (creando una Postulación RA si aplicó). Si faltan detalles analíticos, el reclutador usa el Panel ERP Manual para asignar estados y actualizar el flujo que conecta el frontend al Excel consolidado.
