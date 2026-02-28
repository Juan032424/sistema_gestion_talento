export interface Vacante {
    id: number;
    codigo_requisicion: string;
    puesto_nombre: string;
    proceso_id: number;
    sede_id: number;
    proyecto_id?: number;
    centro_costo_id?: number;
    subcentro_id?: number;
    tipo_trabajo_id?: number;
    tipo_proyecto_id?: number;
    fecha_apertura: string;
    fecha_cierre_estimada: string;
    fecha_cierre_real?: string;
    estado: 'Abierta' | 'En Proceso' | 'Cubierta' | 'Cancelada' | 'Suspendida';
    prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
    responsable_rh: string;
    presupuesto_aprobado: number;
    salario_base?: number;
    costo_vacante: number;
    observaciones: string;
    dias_sla_meta?: number;
    salario_base_ofrecido?: number;
    costo_final_contratacion?: number;
    sede_nombre?: string;
    proceso_nombre?: string;
    proyecto_nombre?: string;
    centro_nombre?: string;
    subcentro_nombre?: string;
}

export interface Candidato {
    id: number;
    vacante_id: number;
    nombre_candidato: string;
    etapa_actual: string;
    fuente_reclutamiento: string;
    salario_pretendido: number;
    cv_url?: string;
    fecha_postulacion?: string;
    fecha_entrevista?: string;
    fecha_contratacion?: string;
    estado_entrevista: 'Pendiente' | 'En Curso' | 'Realizada' | 'No Asistió';
    resultado_candidato?: 'Apto' | 'No Apto' | 'En Reserva';
    motivo_no_apto?: string;
    estatus_90_dias?: 'Continúa' | 'Retiro Voluntario' | 'Retiro por Desempeño';
    calificacion_tecnica?: number;
    resultado_final?: 'Apto' | 'No Apto' | 'En Reserva';
}

export interface Empresa {
    id: number;
    nombre: string;
    nit?: string;
    sector?: string;
    caracteristicas?: any;
}

export interface Sede {
    id: number;
    nombre: string;
    empresa_id: number;
    direccion?: string;
    contacto?: string;
    empresa_nombre?: string;
}

export interface Stats {
    avgLeadTime: number;
    efficiency: number;
    openCount: number;
    closedCount: number;
    expiredCount: number;
    totalFinancialImpact: string;
    geoDistribution: Array<{ sede: string, count: number }>;
}
