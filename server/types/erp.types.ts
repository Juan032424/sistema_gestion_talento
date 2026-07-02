/**
 * ERP Integration Types & Interfaces
 * Defines the data structures for ERP integration
 */

// =====================================================
// CANDIDATOS ERP
// =====================================================
export interface ICanditatoERP {
    id?: number;
    identificacion: string;
    tipo_id: 'Cedula' | 'Cedula Extranjeria' | 'Tarjeta Identidad' | 'Pasaporte';
    lugar_expedicion?: string;
    fecha_expedicion?: string;
    
    primer_nombre: string;
    segundo_nombre?: string;
    primer_apellido: string;
    segundo_apellido?: string;
    
    email?: string;
    telefono?: string;
    
    municipio_ciudad?: string;
    departamento?: string;
    direccion?: string;
    
    fecha_nacimiento?: string;
    genero?: 'Hombre' | 'Mujer' | 'Otro' | 'Prefiero no decir';
    grupo_etnico?: string;
    estado_civil?: string;
    
    nivel_academico?: string;
    tiene_tarjeta_prof?: boolean;
    numero_tarjeta_prof?: string;
    
    tiene_hijos?: boolean;
    cantidad_hijos?: number;
    es_cabeza_familia?: boolean;
    tiene_discapacidad?: boolean;
    tipo_discapacidad?: string;
    
    hoja_vida_pdf?: string;
    cedula_pdf?: string;
    
    fecha_registro?: string;
    fecha_actualizacion?: string;
    fuente?: string;
}

// =====================================================
// REQUISICIONES ERP
// =====================================================
export interface IRequisicionERP {
    id?: number;
    idu_requisicion: string;  // RP0014, RP0179, etc.
    nombre_solicitante: string;
    cedula_solicitante?: string;
    
    puesto_solicitado: string;
    numero_vacantes?: number;
    
    jornada_laboral?: string;
    lugar_trabajo?: string;
    tipo_contrato?: string;
    duracion_contrato?: string;
    
    nivel_academico_requerido?: string;
    experiencia_requerida?: string;
    requiere_vehiculo?: boolean;
    tipo_vehiculo?: string;
    requiere_licencia?: boolean;
    tipo_licencia?: string;
    requiere_celular?: boolean;
    
    salario_ofrecido?: number;
    bono_salarial?: boolean;
    
    area_proyecto?: string;
    motivo_solicitud?: string;
    requiere_padrino_acogida?: boolean;
    nombre_padrino?: string;
    cedula_padrino?: string;
    
    estatus_aprobacion?: 'Rechazado' | 'Aprobado' | 'No Aprobado' | 'Pendiente';
    
    requerimientos_adicionales?: string;
    observaciones?: string;
    
    fecha_requisicion?: string;
    fecha_creacion?: string;
    fecha_actualizacion?: string;
    paso_flujo?: string;
    enlace_detalle?: string;
    
    vacante_id?: number;
}

// =====================================================
// ASPIRANTES ERP
// =====================================================
export interface IAspiranteERP {
    id?: number;
    idu_aspirante: string;  // RA0007, RA0066, etc.
    
    idu_requisicion: string;
    numero_cedula: string;
    
    primer_nombre?: string;
    segundo_nombre?: string;
    primer_apellido?: string;
    segundo_apellido?: string;
    email?: string;
    telefono?: string;
    genero?: string;
    fecha_nacimiento?: string;
    
    cargo_aspirante?: string;
    area_proyecto?: string;
    
    experiencia_anos?: number;
    experiencia_requerida_rangos?: string;
    fuente_reclutamiento?: string;
    
    evaluacion_puntaje?: number;
    competencia_requerida?: number;
    competencia_sensibilidad?: string;
    competencia_enfoque?: string;
    competencia_orientacion?: string;
    resultado_evaluacion?: number;  // Final evaluation score
    experiencia_score?: number;
    academico_score?: number;
    
    decision_seleccion?: 'Seleccionado' | 'En proceso' | 'No apto' | 'Pendiente';
    concepto_final?: string;
    
    hoja_vida_pdf?: string;
    hoja_vida_filename?: string;
    entrevistador_nombre?: string;
    entrevistador_cedula?: string;
    documento_sarlaft?: string;
    
    // Documentation status
    tiene_moto_vehiculo?: boolean;
    documentos_al_dia?: boolean;
    licencia_vigente?: boolean;
    soat_vigente?: boolean;
    tecnicomecanica_vigente?: boolean;
    aprobacion_revision_vial?: boolean;
    
    // Health & Safety
    problema_salud_1?: string;
    problema_salud_2?: string;
    problema_salud_3?: string;
    problema_salud_4?: string;
    problema_salud_5?: string;
    restriccion_trabajo?: string;
    
    // Tools
    dispuesto_celular?: string;
    tiene_casco_moto?: string;
    ano_matricula_moto?: string;
    
    // DISCOL specific
    trabajo_previo_discol?: string;
    tiene_familiares_discol?: string;
    labora_empresas_vinculadas?: string;
    
    fecha_solicitud?: string;
    fecha_creacion?: string;
    fecha_actualizacion?: string;
    paso_flujo?: string;
    enlace_detalle?: string;
    
    candidato_erp_id?: number;
    requisicion_erp_id?: number;
}

// =====================================================
// CONTRATACIONES ERP
// =====================================================
export interface IContratacionERP {
    id?: number;
    idu_contrato: string;  // RC0001, RC0015, etc.
    
    idu_aspirante: string;
    numero_cedula?: string;
    
    primer_nombre?: string;
    segundo_nombre?: string;
    primer_apellido?: string;
    segundo_apellido?: string;
    
    cargo?: string;
    proyecto_asignado?: string;
    ciudad_municipio?: string;
    
    // PDF Documents
    examenes_medicos_pdf?: string;
    examenes_medicos_estado?: 'Pendiente' | 'Completo' | 'Rechazado';
    
    cedula_pdf?: string;
    cedula_estado?: 'Pendiente' | 'Recibido' | 'Validado';
    
    hoja_vida_pdf?: string;
    hoja_vida_estado?: 'Pendiente' | 'Recibido' | 'Validado';
    
    policia_antecedentes_pdf?: string;
    policia_estado?: 'Pendiente' | 'Completo' | 'Rechazado';
    
    certificacion_bancaria_pdf?: string;
    certificacion_estado?: 'Pendiente' | 'Completo';
    
    licencia_conducir_pdf?: string;
    licencia_estado?: 'Pendiente' | 'Validado';
    
    medidas_correctivas_pdf?: string;
    medidas_estado?: 'No aplica' | 'Completado';
    
    sarlaft_pdf?: string;
    sarlaft_estado?: 'Pendiente' | 'Completo' | 'Rechazado';
    
    aptitud_laboral_pdf?: string;
    aptitud_estado?: 'Pendiente' | 'Apto' | 'No apto';
    
    tipo_proceso?: 'Directo' | 'Regular' | 'Especial';
    evidencia_texto?: string;
    
    estado_vinculacion?: 'Regular' | 'Contractual' | 'Suspendido' | 'Finalizado' | 'En proceso';
    
    fecha_creacion?: string;
    fecha_actualizacion?: string;
    creado_por?: string;
    
    aspirante_erp_id?: number;
}

// =====================================================
// VISTA UNIFICADA - Estado del Proceso Completo
// =====================================================
export interface IEstadoProceso {
    candidato: ICanditatoERP | null;
    requisicion: IRequisicionERP | null;
    aspirante: IAspiranteERP | null;
    contrato: IContratacionERP | null;
    
    // Calculated fields
    num_cedula: string;
    nombre_completo: string;
    estado_actual: 'Candidato' | 'Aspirante' | 'Seleccionado' | 'Contratado' | 'No aplica';
    progreso: number;  // 0-100%
    documentacion_completa: boolean;
    puede_descargar_docs: boolean;
}

// =====================================================
// VINCULACION - Link between system candidate and ERP
// =====================================================
export interface IVinculacionERP {
    id?: number;
    candidate_account_id?: number;
    candidato_erp_id: number;
    vinculacion_type?: 'Manual' | 'Automática' | 'Sistema';
    fecha_vinculacion?: string;
    activa?: boolean;
    notas?: string;
}

// =====================================================
// BUSQUEDA Y FILTROS
// =====================================================
export interface IFiltrosAspirante {
    idu_aspirante?: string;
    numero_cedula?: string;
    idu_requisicion?: string;
    decision_seleccion?: string;
    estado_vinculacion?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    limit?: number;
    offset?: number;
}

// =====================================================
// RESPUESTA API - Historial Candidato
// =====================================================
export interface IMiAplicacionERP {
    id: number;
    idu_requisicion: string;
    puesto_solicitado: string;
    estado_requisicion: string;
    
    idu_aspirante?: string;
    estado_aspirante?: string;
    puntaje_evaluacion?: number;
    decisión?: string;
    fecha_aspiracion?: string;
    
    idu_contrato?: string;
    estado_vinculacion?: string;
    documentos_pendientes?: string[];
    puede_descargar?: boolean;
    fecha_contrato?: string;
    
    paso_actual: number;  // 1: Requisición activa, 2: Aspirante registrado, 3: Seleccionado, 4: Contratado
    progreso_texto: string;
}
