# 📊 Flujograma Maestro del Ecosistema GH-SCORE PRO

Este documento presenta la arquitectura de procesos del sistema diseñada para la Gerencia. Utiliza la notación Mermaid para visualizar el flujo de extremo a extremo, desde que nace una necesidad hasta el cierre administrativo.

---

## 🗺️ Visualización de Procesos (End-to-End)

```mermaid
graph TD
    %% Estilos
    classDef startEnd fill:#1a1a2e,stroke:#4ecca3,stroke-width:2px,color:#fff;
    classDef process fill:#162447,stroke:#30475e,stroke-width:1px,color:#fff;
    classDef ai fill:#30475e,stroke:#e94560,stroke-width:2px,color:#fff;
    classDef db fill:#0f3460,stroke:#533483,stroke-width:2px,color:#fff;
    classDef success fill:#1b4332,stroke:#2d6a4f,stroke-width:2px,color:#fff;

    subgraph "1. ORIGEN Y SOURCING (Captación)"
        A[Inicio: Vacante Creada] --> B{Tipo de Reclutamiento}
        B -->|Interno| C[Portal GH-SCORE Interno]
        B -->|Externo| D[AI Sourcing Hub]
        D -->|Sincronización| E[LinkedIn / Indeed / Portales]
        C --> F[Base de Datos de Candidatos]
        E --> F
    end

    subgraph "2. INTELIGENCIA ARTIFICIAL (Procesamiento)"
        F --> G[AIMatchingEngine]
        G -->|Análisis de CV| H[Scoring Automático 0-100%]
        H --> I{¿Cumple Perfil?}
        I -->|No| J[Reserva para Futuro]
        I -->|Si| K[Avance a Proceso de Selección]
    end

    subgraph "3. GESTIÓN DE CANDIDATOS (Tracking)"
        K --> L[Dashboard de Selección]
        L --> M[Entrevistas y Pruebas]
        M --> N[Actualización de Estado Real-Time]
        N --> O[Portal del Candidato: Seguimiento]
    end

    subgraph "4. FINANZAS Y CONTROL (Cierre)"
        P[Ingreso de Facturas/Pagos] --> Q[Módulo de Cash Management]
        Q --> R[Cálculo de Intereses y Descuentos]
        R --> S[Semáforo de Prioridad de Pago]
        S --> T[Aprobación de Gerencia]
    end

    subgraph "5. MÉTRICAS (Power BI & Dashboard)"
        T --> U[Repositiorio de Datos Central]
        F --> U
        N --> U
        U --> V[KPIs de Efectividad]
        U --> W[Métricas de Recaudo]
        U --> X[Métricas por Gestor/Zona]
    end

    %% Aplicación de clases
    class A,V,W,X startEnd;
    class B,C,D,E,L,M,N,O,P,Q,R,S,T process;
    class G,H,I ai;
    class F,U db;
    class K success;
```

---

## 💡 Guía de Lectura para Gerencia

### **1. Bloque de Sourcing (Entrada)**
*   **Innovación:** El sistema centraliza tanto el portal interno como la captación masiva vía IA. No hay procesos manuales de descarga de CVs.

### **2. Bloque IA (Filtro Inteligente)**
*   **Punto Clave:** El **AIMatchingEngine** actúa como un primer filtro automático. Esto ahorra cientos de horas de lectura de hojas de vida que no aplican al cargo.

### **3. Bloque de Tracking (Experiencia de Usuario)**
*   **Transparencia:** El candidato tiene su propio portal de seguimiento, reduciendo las llamadas y consultas al departamento de RRHH.

### **4. Bloque Financiero (Liquidación)**
*   **Control de Capital:** El sistema prioriza los pagos basándose en el costo del dinero (intereses) y las oportunidades de descuento, optimizando el flujo de caja.

### **5. Bloque de Métricas (Toma de Decisiones)**
*   **Visibilidad:** La gerencia puede ver en tiempo real el rendimiento de cada zona y gestor sin esperar reportes semanales manuales.

---

## 🛠️ Infraestructura Tecnológica

Para su tranquilidad, el sistema opera sobre:
*   **Seguridad:** Encriptación de datos de extremo a extremo.
*   **Escalabilidad:** Soporta miles de candidatos y transacciones sin pérdida de rendimiento.
*   **Acceso:** 100% Web, accesible desde PC o Dispositivos Móviles.

---

**¡GH-SCORE PRO: Transformando los datos en decisiones inteligentes!** 🚀📈
