# 🌐 Estrategia para Usuarios Públicos (Candidatos)

## 📋 Tabla de Contenidos
1. [¿Qué son los Usuarios Públicos?](#qué-son-los-usuarios-públicos)
2. [Parámetros para Usuarios Públicos](#parámetros-para-usuarios-públicos)
3. [Flujo de Postulación sin Autenticación](#flujo-de-postulación-sin-autenticación)
4. [Sistema de Tracking de Candidatos Externos](#sistema-de-tracking-de-candidatos-externos)
5. [Diferencias con Usuarios Internos](#diferencias-con-usuarios-internos)
6. [Estrategia de Autenticación Opcional](#estrategia-de-autenticación-opcional)

---

## 🎯 ¿Qué son los Usuarios Públicos?

Los **usuarios públicos** son **candidatos externos** que acceden al **Portal Público de Empleos** (`/portal`) sin necesidad de autenticarse. Son personas que:

- ✅ Buscan oportunidades laborales en DISCOL
- ✅ Pueden ver vacantes públicas
- ✅ Se postulan a vacantes sin necesidad de crear cuenta
- ✅ Proporcionan sus datos personales y CV en cada postulación
- ❌ NO tienen acceso al sistema administrativo
- ❌ NO necesitan login/password para postularse

---

## 📊 Parámetros para Usuarios Públicos

### 1️⃣ **Parámetros Mínimos Obligatorios**

Para que un usuario público pueda postularse, **DEBE** proporcionar:

```javascript
{
    // OBLIGATORIOS
    "nombre": "Juan Pérez García",           // Nombre completo
    "email": "juan.perez@gmail.com",         // Email (usado como identificador único)
    "telefono": "+57 300 123 4567",          // Teléfono de contacto
    "cv_url": "https://...",                 // URL del CV cargado
    "vacancyId": 123                         // ID de la vacante a la que aplica
}
```

### 2️⃣ **Parámetros Opcionales (Mejoran el Match Score)**

Estos parámetros **mejoran el porcentaje de compatibilidad** con la vacante:

```javascript
{
    // OPCIONALES (pero recomendados)
    "titulo_profesional": "Ingeniero de Sistemas",
    "experiencia_anos": 5,
    "salario_esperado": 3500000,
    "disponibilidad": "Inmediata",          // "Inmediata", "15 días", "30 días"
    "carta_presentacion": "Me interesa..."
}
```

### 3️⃣ **Parámetros Calculados Automáticamente**

El sistema genera estos parámetros automáticamente:

```javascript
{
    "auto_match_score": 85,                 // 0-100% calculado con IA
    "estado": "Nueva",                      // Estado inicial de la postulación
    "fecha_postulacion": "2026-02-03",
    "fuente": "Portal DISCOL",              // De dónde vino el candidato
    "external_candidate_id": 456            // ID de candidato externo creado
}
```

---

## 🔄 Flujo de Postulación sin Autenticación

### **Paso 1: Candidato Encuentra Vacante**
```
Usuario → Ingresa a /portal → Ve lista de vacantes → Hace clic en "Ver Detalles"
```

### **Paso 2: Candidato Completa Formulario**
```javascript
// Datos que llena el candidato
FormularioPostulacion {
    nombre: "María García"
    email: "maria.garcia@hotmail.com"
    telefono: "+57 320 456 7890"
    titulo_profesional: "Contadora Pública"
    experiencia_anos: 3
    cv_file: <archivo PDF>
    carta_presentacion: "Tengo experiencia en..."
    disponibilidad: "Inmediata"
    salario_esperado: 2500000
}
```

### **Paso 3: Sistema Procesa la Postulación**

```javascript
// Backend: ApplicationService.applyToJob()
1. ✅ Validar datos obligatorios
2. ✅ Subir CV a almacenamiento
3. ✅ Buscar si el email ya existe en external_candidates
   - Si existe: Actualizar datos
   - Si NO existe: Crear nuevo registro
4. ✅ Calcular auto_match_score con IA
5. ✅ Crear registro en tabla 'applications'
6. ✅ Incrementar contador de postulaciones
7. ✅ Enviar notificación al reclutador
8. ✅ Enviar email de confirmación al candidato
```

### **Paso 4: Candidato Recibe Confirmación**
```
Email: "✅ Tu postulación ha sido recibida"
- Número de postulación: #12345
- Vacante: Contador Senior
- Match Score: 85%
- Estado: En revisión
```

---

## 🗄️ Sistema de Tracking de Candidatos Externos

### **Tabla: `external_candidates`**
Almacena perfiles de candidatos que vinieron del portal público:

```sql
CREATE TABLE external_candidates (
    id INT PRIMARY KEY,
    nombre VARCHAR(255),
    email VARCHAR(255) UNIQUE,              -- Identificador único
    telefono VARCHAR(50),
    titulo_profesional VARCHAR(255),
    experiencia_total_anos INT,
    cv_url TEXT,
    linkedin_url VARCHAR(255),
    fuente VARCHAR(100),                     -- 'Portal DISCOL', 'LinkedIn', etc.
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### **Tabla: `applications`**
Registra cada postulación a una vacante:

```sql
CREATE TABLE applications (
    id INT PRIMARY KEY,
    vacante_id INT,                         -- Vacante a la que aplica
    candidato_id INT NULL,                  -- NULL si es candidato externo
    external_candidate_id INT NULL,         -- Referencia a external_candidates
    
    -- Datos de la postulación
    nombre VARCHAR(255),
    email VARCHAR(255),
    telefono VARCHAR(50),
    cv_url TEXT,
    carta_presentacion TEXT,
    experiencia_anos INT,
    salario_esperado DECIMAL(10,2),
    disponibilidad VARCHAR(50),
    
    -- Match y tracking
    auto_match_score INT,                   -- 0-100
    estado VARCHAR(50),                     -- 'Nueva', 'En Revisión', 'Entrevista', etc.
    notas_reclutador TEXT,
    fecha_postulacion TIMESTAMP,
    fecha_ultima_actualizacion TIMESTAMP
);
```

---

## ⚖️ Diferencias con Usuarios Internos

| Característica | Usuario Público (Candidato) | Usuario Interno (Staff) |
|----------------|----------------------------|-------------------------|
| **Autenticación** | ❌ NO requiere login | ✅ Requiere login (email/password) |
| **Acceso al sistema** | ❌ Solo portal público | ✅ Acceso completo al dashboard |
| **Crear vacantes** | ❌ NO | ✅ Sí (Admin/Reclutador) |
| **Ver candidatos** | ❌ NO | ✅ Sí (depende del rol) |
| **Postularse** | ✅ Sí, sin límite | ❌ NO (es staff) |
| **Tracking** | ✅ Email único | ✅ Usuario en BD |
| **Rol asignado** | `public_candidate` | `Superadmin`, `Admin`, `Reclutador`, `Lider` |
| **Tabla en BD** | `external_candidates` | `usuarios` |
| **Sesión** | ❌ Sin sesión | ✅ JWT Token en localStorage |

---

## 🔐 Estrategia de Autenticación Opcional

### **Opción 1: Portal Público Anónimo (ACTUAL)**

**✅ Ventajas:**
- Menor fricción para postularse
- Más postulaciones (no requiere registro)
- Experiencia rápida tipo "LinkedIn Easy Apply"

**❌ Desventajas:**
- Candidatos no pueden ver el estado de sus postulaciones
- No hay "perfil" reutilizable
- El candidato debe llenar datos en cada postulación

### **Opción 2: Portal Público + Registro Opcional (RECOMENDADO)**

**Crear un sistema híbrido:**

```javascript
// Dos flujos posibles:

// FLUJO A: Sin registro (Quick Apply)
Usuario → Ver vacante → Llenar formulario → Postularse (FIN)

// FLUJO B: Con registro (Account)
Usuario → Crear cuenta → Guardar perfil → Ver vacantes → 
Postularse con 1 clic (datos pre-llenados) → 
Seguimiento de postulaciones
```

**Parámetros para Candidatos Registrados:**

```javascript
{
    // Autenticación
    "email": "maria@gmail.com",
    "password": "hashed_password",
    "token": "jwt_token",
    
    // Perfil completo
    "profile": {
        "nombre": "María García",
        "telefono": "+57 320 123 4567",
        "titulo_profesional": "Contadora",
        "cv_url": "https://...",
        "linkedin": "https://linkedin.com/in/maria",
        "experiencia_anos": 5,
        "salario_esperado": 3000000,
        "habilidades": ["Excel", "SAP", "Auditoría"],
        "idiomas": ["Español", "Inglés"],
        "disponibilidad": "Inmediata"
    },
    
    // Tracking
    "postulaciones": [
        {
            "vacante_id": 123,
            "fecha": "2026-02-01",
            "estado": "En Revisión",
            "match_score": 85
        }
    ]
}
```

### **Opción 3: Social Login (AVANZADO)**

Permitir login con redes sociales:

```javascript
// Login con Google/LinkedIn
{
    "provider": "google",
    "social_id": "123456789",
    "email": "maria@gmail.com",
    "nombre": "María García",
    "foto": "https://lh3.googleusercontent.com/...",
    "linkedin_profile": "auto-imported"  // Si usa LinkedIn
}
```

---

## 🎯 Recomendaciones para Implementar

### **Fase 1: Portal Público Anónimo (YA FUNCIONA)**
```
✅ ACTUAL - Ya implementado
- Cualquiera puede postularse sin cuenta
- Sistema de external_candidates funcional
- Match scoring automático
```

### **Fase 2: Área de Candidatos con Login (PRÓXIMO)**
```
🔄 SIGUIENTE PASO
1. Crear página de registro: /registro-candidato
2. Crear página de login: /candidato-login
3. Crear dashboard de candidato: /mi-perfil
   - Ver mis postulaciones
   - Estado de cada una
   - Actualizar CV
   - Editar perfil
4. Implementar JWT para candidatos
5. Email con link mágico para tracking
```

### **Fase 3: Features Avanzadas (FUTURO)**
```
🚀 OPCIONAL
- Social login (Google, LinkedIn)
- Notificaciones push de cambio de estado
- Chat con reclutador
- Video-entrevistas integradas
- Recomendaciones de vacantes personalizadas
```

---

## 📱 Ejemplo de Implementación

### **Backend: Endpoint de Postulación Pública**

```javascript
// /api/applications/apply
router.post('/apply', async (req, res) => {
    const { vacancyId, candidateData } = req.body;
    
    // VALIDAR PARÁMETROS MÍNIMOS
    if (!candidateData.nombre || !candidateData.email || !candidateData.telefono) {
        return res.status(400).json({ 
            error: 'Faltan datos obligatorios' 
        });
    }
    
    // PROCESAR POSTULACIÓN
    const result = await applicationService.applyToJob(vacancyId, candidateData);
    
    res.json(result);
});
```

### **Frontend: Formulario de Postulación**

```tsx
// JobApplicationForm.tsx
const handleSubmit = async (e) => {
    e.preventDefault();
    
    const candidateData = {
        // OBLIGATORIOS
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        cv_url: uploadedCvUrl,
        
        // OPCIONALES
        titulo_profesional: form.titulo,
        experiencia_anos: form.experiencia,
        salario_esperado: form.salario,
        disponibilidad: form.disponibilidad,
        carta_presentacion: form.carta
    };
    
    const response = await api.post('/applications/apply', {
        vacancyId: selectedVacancy.id,
        candidateData
    });
    
    if (response.data.success) {
        // Mostrar confirmación
        alert(`¡Postulación exitosa! Tu match score es ${response.data.matchScore}%`);
    }
};
```

---

## 🔑 Parámetros Clave - Resumen Final

### **Para Portal Público (Sin Autenticación)**
```javascript
PARÁMETROS_MÍNIMOS = {
    nombre: STRING,
    email: STRING (UNIQUE),
    telefono: STRING,
    cv_url: STRING,
    vacancyId: INT
}

PARÁMETROS_OPCIONALES = {
    titulo_profesional: STRING,
    experiencia_anos: INT,
    salario_esperado: DECIMAL,
    disponibilidad: STRING,
    carta_presentacion: TEXT
}
```

### **Para Candidatos con Cuenta (Futuro)**
```javascript
AUTENTICACIÓN = {
    email: STRING,
    password: HASHED_STRING,
    token: JWT_TOKEN
}

PERFIL_COMPLETO = {
    ...PARÁMETROS_MÍNIMOS,
    ...PARÁMETROS_OPCIONALES,
    habilidades: ARRAY,
    idiomas: ARRAY,
    educacion: ARRAY,
    experiencia_laboral: ARRAY
}
```

---

## 📞 Próximos Pasos Sugeridos

1. **¿Quieres que implemente el sistema de registro de candidatos?**
   - Portal de login para candidatos
   - Dashboard para ver estado de postulaciones
   - Perfil reutilizable

2. **¿Mejoramos el tracking actual?**
   - Sistema de notificaciones por email
   - Links mágicos para ver estado sin login
   - Auto-save de perfil en cookies

3. **¿Agregamos validaciones?**
   - Validación de formato de email
   - Validación de tamaño de CV
   - Prevención de postulaciones duplicadas

---

**Estado Actual**: ✅ **PORTAL PÚBLICO FUNCIONAL**
- Los candidatos pueden postularse sin autenticación
- Sistema de tracking con `external_candidates`
- Match scoring automático funcionando
- Notificaciones a reclutadores implementadas

**Próximo Nivel**: 🚀 **ÁREA DE CANDIDATOS CON LOGIN**
- Candidatos pueden crear cuenta
- Ver estado de sus postulaciones
- Perfil reutilizable para múltiples postulaciones
