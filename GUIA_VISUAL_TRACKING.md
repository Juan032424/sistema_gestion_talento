# 🎯 GUÍA VISUAL - Sistema de Tracking de Candidatos

## 📋 Índice de Funcionalidades Implementadas

1. [Historial de Actividad del Candidato](#1-historial-de-actividad-del-candidato)
2. [Análisis de Comportamiento con IA (SHEYLA)](#2-análisis-de-comportamiento-con-ia)
3. [Alertas de Hot Leads](#3-alertas-de-hot-leads)
4. [Dashboard de Vacantes Hot](#4-dashboard-de-vacantes-hot)

---

## 1. Historial de Actividad del Candidato

### 📍 Ubicación en la Interfaz

```
Panel Administrativo
    └── Candidatos (menú lateral)
        └── [Clic en ✏️ Editar de un candidato]
            └── [Scroll HASTA EL FINAL de la página]
                └── ✅ Sección: "Actividad en Portal Público"
```

### 🎨 Aspecto Visual Esperado

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 HISTORIAL DE EVENTOS CRUDOS                    12 Eventos│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🔵  LOGIN                          06/02/2026 21:30       │
│      Inició sesión en el portal público                     │
│                                                              │
│  🔷  VIEW JOB                       06/02/2026 21:31       │
│      Visualizó los detalles de la vacante ID 5              │
│                                                              │
│  💼  START APPLICATION              06/02/2026 21:32       │
│      Inició el proceso de postulación para la vacante ID 5  │
│                                                              │
│  ❌  ABANDON APPLICATION            06/02/2026 21:33       │
│      Abandonó el formulario de postulación para vacante 5   │
│                                                              │
│  ⭐  SAVE JOB                       06/02/2026 21:35       │
│      Guardó la vacante ID 5                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 🔍 Tipos de Eventos que Verás

| Icono | Tipo de Evento | Descripción |
|-------|----------------|-------------|
| 🔵 | `LOGIN` | El candidato inició sesión |
| 🔷 | `VIEW_JOB` | Vio los detalles de una vacante |
| 💼 | `START_APPLICATION` | Abrió el formulario de postulación |
| ❌ | `ABANDON_APPLICATION` | Cerró el formulario sin enviar |
| ✅ | `APPLY` | Completó y envió una postulación |
| ⭐ | `SAVE_JOB` | Guardó la vacante como favorita |
| 👤 | `UPDATE_PROFILE` | Actualizó su perfil |

---

## 2. Análisis de Comportamiento con IA

### 📍 Ubicación en la Interfaz

```
Misma ubicación que el Historial (arriba del historial)
    └── Botón: "✨ Generar Análisis IA"
        └── Al hacer clic → Aparece sección de SHEYLA Behavior Insights
```

### 🎨 Aspecto Visual Esperado

```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 SHEYLA Behavior Insights                                 │
│ Análisis predictivo del perfil de interés                   │
│                                              [✨ RECALCULAR]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ RESUMEN DE COMPORTAMIENTO                                   │
│ El candidato muestra un patrón de búsqueda activo con      │
│ interés recurrente en cargos técnicos. Ingresa              │
│ principalmente en horario nocturno y ha visualizado 5       │
│ vacantes en los últimos 3 días.                             │
│                                                              │
│ #Búsqueda nocturna  #Interés en remoto  #Alta intención    │
│                                                              │
│ ┌────────────────┐  ┌──────────────────────────────────┐   │
│ │ ENGAGEMENT     │  │ 🚨 RECOMENDACIÓN IA              │   │
│ │                │  │                                   │   │
│ │    HIGH        │  │ Contactar de inmediato para      │   │
│ │   ███          │  │ entrevista técnica. El candidato │   │
│ │                │  │ muestra señales de búsqueda      │   │
│ │                │  │ activa.                          │   │
│ └────────────────┘  └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 📊 Niveles de Engagement

- **🟢 High:** Candidato muy activo, visita frecuentemente
- **🟡 Medium:** Interés moderado, visita ocasional
- **⚪ Low:** Poca interacción con el portal

---

## 3. Alertas de Hot Leads

### 📍 Ubicación en la Interfaz

```
Panel Administrativo
    └── Icono de 🔔 Notificaciones (arriba derecha)
        └── Lista de notificaciones
            └── Filtro: "hot_lead"
```

### 🎨 Aspecto Visual Esperado

```
┌─────────────────────────────────────────────────────────┐
│ 🔔 NOTIFICACIONES                                   (3) │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🔥 Hot Lead: Regreso de candidato                      │
│    El candidato de tu proceso para "Desarrollador      │
│    Senior" (Entrevista) acaba de tener actividad:      │
│    Inició sesión en el portal público                  │
│    📅 Hace 5 minutos                                   │
│    ───────────────────────────────────────────────────  │
│                                                         │
│ 🔥 Hot Lead: Interés activo                           │
│    El candidato de tu proceso para "Product Manager"   │
│    (Oferta) acaba de tener actividad: Visualizó los    │
│    detalles de la vacante ID 12                        │
│    📅 Hace 1 hora                                      │
│    ───────────────────────────────────────────────────  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### ⚡ Cuándo se Disparan las Alertas

Las alertas solo se activan si:
1. ✅ El candidato está en etapa **Entrevista**, **Oferta** o **Preseleccionado**
2. ✅ El candidato realiza alguna acción: `LOGIN`, `VIEW_JOB`, `START_APPLICATION`, `APPLY`
3. ✅ Hay un reclutador asignado a la vacante

---

## 4. Dashboard de Vacantes Hot

### 📍 Ubicación en la Interfaz

```
Panel Administrativo
    └── Analytics (menú lateral)
        └── [Scroll hacia ABAJO después de los gráficos]
            └── ✅ Sección: "🔥 Vacantes Hot (Mayor Engagement)"
```

### 🎨 Aspecto Visual Esperado

```
┌───────────────────────────────────────────────────────────────┐
│ 🔥 Vacantes "Hot" (Mayor Engagement)      Top 10 - Basado IA │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─────────────────────────┐  ┌─────────────────────────┐    │
│ │ Rank #1  REQ-045        │  │ Rank #2  REQ-032        │    │
│ │ Desarrollador Full Stack│  │ Product Manager         │    │
│ │ 👤 María González       │  │ 👤 Carlos Ruiz          │    │
│ │                         │  │                         │    │
│ │        📈 85%           │  │        📈 72%           │    │
│ │      Conv. Rate         │  │      Conv. Rate         │    │
│ │                         │  │                         │    │
│ │ Vistas  Únicos  Saves   │  │ Vistas  Únicos  Saves   │    │
│ │  👁️125   👥45    ⭐12  │  │  👁️89    👥28    ⭐8   │    │
│ │                         │  │                         │    │
│ │ Intents: 💼 8          │  │ Intents: 💼 5          │    │
│ └─────────────────────────┘  └─────────────────────────┘    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### 📊 Métricas Explicadas

| Métrica | Descripción |
|---------|-------------|
| **Vistas (👁️)** | Total de veces que se vio la vacante |
| **Únicos (👥)** | Candidatos diferentes que la vieron |
| **Saves (⭐)** | Veces que la guardaron como favorita |
| **Intents (💼)** | Veces que iniciaron postulación (aunque no la terminaran) |
| **Conv. Rate (📈)** | % de únicos respecto a vistas totales |

### 🔥 Fórmula de Ranking

```
Engagement Score = (Vistas × 1) + (Únicos × 2) + (Intents × 5)
```

Las vacantes se ordenan de mayor a menor puntaje.

---

## 🧪 CÓMO CREAR DATOS DE PRUEBA

### Paso 1: Crear Candidato de Prueba

1. Abre: `http://localhost:5173/portal`
2. Click en **"Registro"** (arriba derecha)
3. Llena el formulario:
   - Nombre: `Candidato Prueba`
   - Email: `test@ejemplo.com`
   - Contraseña: `123456`
4. Click en **"Registrarse"**

### Paso 2: Generar Actividad

Una vez registrado:

1. ✅ **Navega por 5 vacantes** (click en "Ver detalles")
2. ✅ **Abre el formulario de postulación** en 2 vacantes (pero NO lo envíes)
3. ✅ **Cierra el formulario** sin completar
4. ✅ **Guarda 1 vacante** como favorita
5. ✅ **Cierra sesión y vuelve a entrar** (genera otro LOGIN)

### Paso 3: Ver los Resultados

1. Ve al **Panel Admin**
2. **Candidatos** → Busca "Candidato Prueba" → **Editar**
3. **Scroll hasta el final** → Verás toda la actividad
4. Click en **"✨ Generar Análisis IA"**
5. Ve a **Analytics** → Scroll abajo → Verás el ranking de vacantes

---

## ❓ PROBLEMAS COMUNES

### "No veo la sección de Actividad"

**Posibles causas:**

1. ❌ El candidato no tiene cuenta en el portal público
   - **Solución:** Solo candidatos registrados en `/portal` tienen tracking
   
2. ❌ El candidato no ha tenido actividad
   - **Solución:** Sigue los pasos de "Crear Datos de Prueba"

3. ❌ La tabla `candidate_activity_logs` no existe
   - **Solución:** Ejecuta: `node server/migrations/create_activity_logs.js`

### "No veo Vacantes Hot en Analytics"

**Posibles causas:**

1. ❌ No hay vacantes publicadas en el portal público
   - **Solución:** Ve a Vacantes → Editar una → Marca como pública

2. ❌ No hay registro de vistas
   - **Solución:** Navega por el portal público como candidato

### "El botón de IA no hace nada"

**Posibles causas:**

1. ❌ No hay API Key de Gemini configurada
   - **Solución:** Verifica `.env` → `GEMINI_API_KEY=tu_clave`

2. ❌ No hay suficientes logs
   - **Solución:** Necesita al menos 3-5 eventos para análisis

---

## 🎬 RESUMEN RÁPIDO

### Para VER todo funcionando en 3 minutos:

1. **Portal Público** (`/portal`) → Regístrate como candidato
2. **Navega por 5 vacantes** → Abre y cierra formularios
3. **Panel Admin** → Candidatos → Editar ese candidato
4. **Scroll al final** → ¡Verás toda la magia! ✨

---

## 📞 SOPORTE

Si después de seguir esta guía no logras ver las funcionalidades:

1. Verifica que los servidores estén corriendo: `npm run dev` (en client y server)
2. Revisa la consola del navegador (F12) → Busca errores en "Console"
3. Revisa la terminal del servidor → Busca errores de base de datos

**Archivos clave modificados:**
- `client/src/components/ActivityLogViewer.tsx` (Visor de actividad)
- `client/src/components/HotVacanciesDashboard.tsx` (Dashboard hot)
- `server/services/ActivityLogService.js` (Servicio de logs)
- `server/services/HotLeadService.js` (Alertas hot leads)
- `server/routes/analytics.js` (Endpoint hot vacancies)
