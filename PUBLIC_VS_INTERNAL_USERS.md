# 🎯 Comparativa de Parámetros: Usuarios Públicos vs Usuarios Internos

## 📊 Tabla Comparativa Rápida

### USUARIOS PÚBLICOS (Candidatos)
| Parámetro | Requerido | Tipo | Uso |
|-----------|-----------|------|-----|
| `nombre` | ✅ SÍ | STRING | Identificación del candidato |
| `email` | ✅ SÍ | STRING (UNIQUE) | Identificador único, contacto |
| `telefono` | ✅ SÍ | STRING | Contacto directo |
| `cv_url` | ✅ SÍ | URL/FILE | Hoja de vida |
| `vacancyId` | ✅ SÍ | INT | Vacante a la que aplica |
| `titulo_profesional` | ⭕ Opcional | STRING | Match scoring |
| `experiencia_anos` | ⭕ Opcional | INT | Match scoring |
| `salario_esperado` | ⭕ Opcional | DECIMAL | Match scoring |
| `disponibilidad` | ⭕ Opcional | STRING | Match scoring |
| `carta_presentacion` | ⭕ Opcional | TEXT | Revisión del reclutador |

### USUARIOS INTERNOS (Staff/Administración)
| Parámetro | Requerido | Tipo | Uso |
|-----------|-----------|------|-----|
| `email` | ✅ SÍ | STRING (UNIQUE) | Login, identificación |
| `password` | ✅ SÍ | HASHED STRING | Autenticación |
| `fullName` | ✅ SÍ | STRING | Nombre del usuario |
| `role` | ✅ SÍ | ENUM | Permisos del sistema |
| `tenant_id` | ✅ SÍ | INT | Multi-tenancy |
| `token` | Auto-generado | JWT | Sesión activa |
| `is_active` | ✅ SÍ | BOOLEAN | Estado de la cuenta |
| `created_by` | Auto | INT | Auditoría |

---

## 🔄 Flujos de Usuario Visual

### FLUJO USUARIO PÚBLICO (Sin autenticación)

```
┌─────────────────────────────────────────────────────────────┐
│                    CANDIDATO EXTERNO                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  1. Entra a /portal (sin login)                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Ve lista de vacantes públicas                           │
│     - Filtrar por ubicación, modalidad                      │
│     - Buscar por palabras clave                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Hace clic en "Ver Detalles" de una vacante              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Hace clic en "Postularme"                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. FORMULARIO DE POSTULACIÓN                               │
│                                                             │
│  📝 Datos Obligatorios:                                     │
│    ├─ Nombre completo                                       │
│    ├─ Email                                                 │
│    ├─ Teléfono                                              │
│    └─ CV (archivo PDF/DOCX)                                 │
│                                                             │
│  ⭕ Datos Opcionales (mejoran match):                       │
│    ├─ Título profesional                                    │
│    ├─ Años de experiencia                                   │
│    ├─ Salario esperado                                      │
│    ├─ Disponibilidad                                        │
│    └─ Carta de presentación                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Sistema procesa:                                        │
│     ✓ Sube CV a storage                                     │
│     ✓ Busca email en external_candidates                    │
│     ✓ Si existe: actualiza datos                            │
│     ✓ Si NO existe: crea nuevo registro                     │
│     ✓ Calcula match_score con IA (0-100%)                   │
│     ✓ Crea postulación en 'applications'                    │
│     ✓ Envía notificación a reclutador                       │
│     ✓ Envía email de confirmación a candidato               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  7. Candidato recibe confirmación:                          │
│     "✅ Tu postulación ha sido recibida"                    │
│     Match Score: 85%                                        │
│     Estado: Nueva                                           │
└─────────────────────────────────────────────────────────────┘
```

### FLUJO USUARIO INTERNO (Con autenticación)

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO STAFF (Admin/Reclutador)         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  1. Entra a /login                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. FORMULARIO DE LOGIN                                     │
│     ├─ Email                                                │
│     └─ Password                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Backend valida:                                         │
│     ✓ Email existe en tabla 'usuarios'                      │
│     ✓ Password coincide (bcrypt)                            │
│     ✓ Usuario está activo                                   │
│     ✓ Obtiene tenant_id                                     │
│     ✓ Genera JWT token                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. AuthProvider guarda en localStorage:                    │
│     {                                                       │
│       token: "jwt_token_here",                              │
│       user: { id, email, fullName, role },                  │
│       tenant: { id, name, branding }                        │
│     }                                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Redirige a Dashboard (/)                                │
│     - Acceso basado en rol:                                 │
│       ├─ Superadmin: TODO                                   │
│       ├─ Admin: Todas las vacantes de su empresa            │
│       ├─ Reclutador: Sus vacantes asignadas                 │
│       └─ Lider: Vista de solo lectura                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Usuario interno puede:                                  │
│     ✓ Crear/editar vacantes                                 │
│     ✓ Ver candidatos/postulaciones                          │
│     ✓ Cambiar estados de postulaciones                      │
│     ✓ Enviar comunicaciones                                 │
│     ✓ Generar reportes                                      │
│     ✓ Usar AI Sourcing                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  7. Al hacer logout:                                        │
│     ✓ Limpia localStorage                                   │
│     ✓ Limpia headers Authorization                          │
│     ✓ Redirige a /login                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Estructura de Datos en Base de Datos

### Candidato Público (external_candidates)
```sql
INSERT INTO external_candidates (
    nombre,
    email,                      -- ← IDENTIFICADOR ÚNICO
    telefono,
    titulo_profesional,
    experiencia_total_anos,
    cv_url,
    fuente
) VALUES (
    'Juan Pérez',
    'juan.perez@gmail.com',     -- ← Email como ID
    '+57 300 123 4567',
    'Ingeniero de Sistemas',
    5,
    'https://storage.com/cv/juan_perez.pdf',
    'Portal DISCOL'
);
```

### Usuario Interno (usuarios)
```sql
INSERT INTO usuarios (
    email,                      -- ← IDENTIFICADOR ÚNICO
    password_hash,              -- ← Contraseña hasheada
    full_name,
    role,                       -- ← 'Superadmin', 'Admin', 'Reclutador', 'Lider'
    tenant_id,                  -- ← Empresa a la que pertenece
    is_active,
    created_by
) VALUES (
    'admin@discol.com',
    '$2b$10$encrypted_hash',
    'Admin Usuario',
    'Admin',
    1,
    TRUE,
    1
);
```

---

## 🎭 Casos de Uso Reales

### CASO 1: María busca empleo (Usuario Público)

```
María → Portal DISCOL → Ve "Contador Senior" → Le interesa →
Formulario:
  ✅ Nombre: María García
  ✅ Email: maria.garcia@hotmail.com
  ✅ Teléfono: +57 320 456 7890
  ✅ CV: contador_maria_garcia.pdf
  ⭕ Título: Contadora Pública
  ⭕ Experiencia: 3 años
  ⭕ Salario: $2,500,000
  ⭕ Disponibilidad: Inmediata
→ Enviar Postulación

Backend:
  → Busca email en external_candidates → No existe → Crea registro
  → Calcula match_score: 82%
  → Crea application ID #1234
  → Notifica reclutador: "Nueva postulación: María García (82%)"
  → Email a María: "¡Postulación exitosa! Te contactaremos pronto"

María → Recibe confirmación en email → Espera respuesta
```

**Parámetros usados:**
```javascript
{
    nombre: "María García",
    email: "maria.garcia@hotmail.com",
    telefono: "+57 320 456 7890",
    cv_url: "https://storage/cv_maria.pdf",
    titulo_profesional: "Contadora Pública",
    experiencia_anos: 3,
    salario_esperado: 2500000,
    disponibilidad: "Inmediata",
    vacancyId: 25,
    // ↓ Auto-generados
    auto_match_score: 82,
    estado: "Nueva",
    fuente: "Portal DISCOL"
}
```

### CASO 2: Carlos (Reclutador) revisa postulaciones (Usuario Interno)

```
Carlos → /login → 
  Email: carlos.recruiter@discol.com
  Password: ****
→ Login exitoso → Dashboard

Carlos → Ve notificación: "5 nuevas postulaciones"
Carlos → /vacantes → Selecciona "Contador Senior"
Carlos → Ve lista de postulaciones ordenadas por match_score:
  1. María García - 82% ⭐
  2. Pedro López - 75%
  3. Ana Martínez - 68%

Carlos → Hace clic en María García
Carlos → Ve perfil completo + CV
Carlos → Cambia estado: "Nueva" → "En Revisión"
Sistema → Envía email a María: "Tu postulación está en revisión"

Carlos → Hace clic en "Agendar Entrevista"
Carlos → Selecciona fecha/hora
Sistema → Email a María: "¡Felicitaciones! Has sido seleccionada para entrevista"
```

**Parámetros del session de Carlos:**
```javascript
{
    token: "eyJhbGciOiJIUzI1NiIs...",
    user: {
        id: 5,
        email: "carlos.recruiter@discol.com",
        fullName: "Carlos Rodríguez",
        role: "Reclutador",
        tenant_id: 1
    },
    tenant: {
        id: 1,
        name: "DISCOL SAS",
        branding: {
            primary_color: "#3a94cc",
            logo_url: "/logo_discol.jpg"
        }
    }
}
```

---

## 🔐 Seguridad y Privacidad

### Para Usuarios Públicos
```
✅ NO almacenamos contraseñas (no tienen cuenta)
✅ Email validado con formato correcto
✅ CV escaneado por antivirus antes de almacenar
✅ Rate limiting: máximo 5 postulaciones por hora por email
✅ Captcha para prevenir spam
✅ GDPR compliant: el candidato puede solicitar borrar sus datos
```

### Para Usuarios Internos
```
✅ Contraseña hasheada con bcrypt (10 rounds)
✅ JWT con expiración de 7 días
✅ Refresh token automático
✅ Logout limpia completamente la sesión
✅ RBAC: permisos basados en rol
✅ Audit log: todas las acciones registradas
```

---

## ✅ RESUMEN EJECUTIVO

### ¿Qué parámetros necesita un Usuario Público?

**MÍNIMO INDISPENSABLE:**
- Nombre
- Email (único)
- Teléfono
- CV

**RECOMENDADO (mejora matching):**
- Título profesional
- Años de experiencia
- Salario esperado
- Disponibilidad

### ¿Cuál es la diferencia clave?

| Aspecto | Usuario Público | Usuario Interno |
|---------|----------------|-----------------|
| **Login** | ❌ NO | ✅ SÍ |
| **Almacenamiento** | `external_candidates` | `usuarios` |
| **Identificador** | Email | Email + Password |
| **Sesión** | Sin sesión | JWT Token |
| **Acceso** | Solo portal | Dashboard completo |

---

**¿Necesitas que implemente algo específico?**
- Sistema de login para candidatos
- Link mágico para seguimiento de postulaciones
- Notificaciones automáticas por cambio de estado
- Otro feature
