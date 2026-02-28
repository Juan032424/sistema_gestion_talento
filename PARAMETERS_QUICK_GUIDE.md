# 🎯 PARÁMETROS CLAVE - GUÍA RÁPIDA

## Para Usuarios Públicos (Candidatos del Portal)

### Endpoint: `POST /api/applications/apply`

```javascript
// REQUEST BODY
{
    "vacancyId": 123,
    "candidateData": {
        // ✅ OBLIGATORIOS
        "nombre": "Juan Pérez García",
        "email": "juan.perez@gmail.com",
        "telefono": "+57 300 123 4567",
        "cv_url": "https://storage.com/cv.pdf",
        
        // ⭕ OPCIONALES (mejoran el match_score)
        "titulo_profesional": "Ingeniero de Sistemas",
        "experiencia_anos": 5,
        "salario_esperado": 3500000,
        "disponibilidad": "Inmediata",
        "carta_presentacion": "Me encantaría trabajar con ustedes..."
    }
}

// RESPONSE
{
    "success": true,
    "applicationId": 456,
    "matchScore": 85,
    "message": "¡Tu postulación ha sido enviada exitosamente!"
}
```

---

## Para Usuarios Internos (Staff/Admin)

### Endpoint: `POST /api/auth/login`

```javascript
// REQUEST
{
    "email": "admin@discol.com",
    "password": "SecurePassword123"
}

// RESPONSE
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "id": 1,
        "email": "admin@discol.com",
        "fullName": "Admin Usuario",
        "role": "Superadmin"
    },
    "tenant": {
        "id": 1,
        "name": "DISCOL SAS",
        "branding": {
            "primary_color": "#3a94cc",
            "logo_url": "/logo_discol.jpg"
        }
    }
}
```

---

## 📊 Comparación Rápida

| Característica | Usuario Público | Usuario Interno |
|----------------|----------------|-----------------|
| **Requiere login** | ❌ NO | ✅ SÍ |
| **Parámetro principal** | `email` | `email` + `password` |
| **Tabla en BD** | `external_candidates` + `applications` | `usuarios` |
| **Tiene sesión** | ❌ NO | ✅ SÍ (JWT) |
| **Puede postularse** | ✅ SÍ | ❌ NO |
| **Puede ver dashboard** | ❌ NO | ✅ SÍ |
| **Roles** | `public_candidate` | `Superadmin`, `Admin`, `Reclutador`, `Lider` |

---

## 🔑 Parámetros Técnicos Detallados

### Usuario Público - Campos Completos

```typescript
interface PublicCandidateData {
    // IDENTIFICACIÓN (obligatorios)
    nombre: string;                    // Máx 255 caracteres
    email: string;                     // Único, formato email válido
    telefono: string;                  // Formato: +57 300 123 4567
    cv_url: string;                    // URL o FILE, PDF/DOCX, max 5MB
    
    // PERFIL PROFESIONAL (opcionales)
    titulo_profesional?: string;       // Ej: "Ingeniero de Sistemas"
    experiencia_anos?: number;         // INT, 0-50
    salario_esperado?: number;         // DECIMAL, en pesos colombianos
    disponibilidad?: string;           // "Inmediata", "15 días", "30 días"
    carta_presentacion?: string;       // TEXT, max 2000 caracteres
    
    // ADICIONALES (opcionales)
    linkedin_url?: string;             // URL de LinkedIn
    ciudad?: string;                   // Ciudad de residencia
    nivel_estudios?: string;           // "Técnico", "Profesional", "Posgrado"
}
```

### Usuario Interno - Campos Completos

```typescript
interface InternalUserData {
    // AUTENTICACIÓN (obligatorios)
    email: string;                     // Único, formato email válido
    password: string;                  // Min 8 caracteres, hasheado en BD
    
    // IDENTIFICACIÓN (obligatorios)
    full_name: string;                 // Nombre completo
    role: UserRole;                    // 'Superadmin' | 'Admin' | 'Reclutador' | 'Lider'
    tenant_id: number;                 // ID de la empresa
    
    // CONFIGURACIÓN (opcionales)
    is_active?: boolean;               // Default: true
    avatar_url?: string;               // URL de foto de perfil
    department?: string;               // Departamento/área
    phone?: string;                    // Teléfono laboral
    
    // AUDITORÍA (auto-generado)
    created_at?: Date;                 // Timestamp
    created_by?: number;               // ID del usuario que lo creó
    last_login?: Date;                 // Último inicio de sesión
}
```

---

## 🎯 Casos de Uso por Parámetro

### `email` (Ambos tipos de usuario)
- **Usuario Público**: Identificador único, NO requiere confirmación previa
- **Usuario Interno**: Username para login, debe estar registrado previamente

### `password`
- **Usuario Público**: ❌ NO tiene (no requiere autenticación)
- **Usuario Interno**: ✅ SÍ (hasheado con bcrypt)

### `auto_match_score` (Solo público)
- Calculado automáticamente (0-100%)
- Basado en: experiencia, título, disponibilidad, salario
- Usado para ordenar postulaciones

### `role` (Solo interno)
- Define permisos en el sistema
- Valores: `Superadmin`, `Admin`, `Reclutador`, `Lider`

### `tenant_id` (Solo interno)
- Identifica a qué empresa pertenece
- Usado para multi-tenancy

---

## 🚀 Implementación Recomendada

### Frontend: Formulario Público

```tsx
// JobApplicationForm.tsx
const [formData, setFormData] = useState({
    // Obligatorios
    nombre: '',
    email: '',
    telefono: '',
    cv: null,
    
    // Opcionales
    titulo_profesional: '',
    experiencia_anos: 0,
    salario_esperado: 0,
    disponibilidad: 'Inmediata',
    carta_presentacion: ''
});

const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Validar campos obligatorios
    if (!formData.nombre || !formData.email || !formData.telefono || !formData.cv) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }
    
    // 2. Subir CV
    const cvUrl = await uploadCV(formData.cv);
    
    // 3. Enviar postulación
    const response = await api.post('/applications/apply', {
        vacancyId: selectedVacancy.id,
        candidateData: {
            nombre: formData.nombre,
            email: formData.email,
            telefono: formData.telefono,
            cv_url: cvUrl,
            titulo_profesional: formData.titulo_profesional,
            experiencia_anos: parseInt(formData.experiencia_anos),
            salario_esperado: parseFloat(formData.salario_esperado),
            disponibilidad: formData.disponibilidad,
            carta_presentacion: formData.carta_presentacion
        }
    });
    
    // 4. Mostrar resultado
    if (response.data.success) {
        alert(`¡Éxito! Tu match score es ${response.data.matchScore}%`);
    }
};
```

### Frontend: Formulario Login Interno

```tsx
// LoginPage.tsx
const [credentials, setCredentials] = useState({
    email: '',
    password: ''
});

const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
        const response = await api.post('/auth/login', {
            email: credentials.email,
            password: credentials.password
        });
        
        if (response.data.success) {
            // Guardar en contexto
            login(
                response.data.token,
                response.data.user,
                response.data.tenant
            );
            
            // Redirigir
            navigate('/');
        }
    } catch (error) {
        alert('Credenciales incorrectas');
    }
};
```

---

## 📋 Validaciones Recomendadas

### Usuario Público
```javascript
// Backend: routes/applications.js
router.post('/apply', async (req, res) => {
    const { vacancyId, candidateData } = req.body;
    
    // Validar obligatorios
    if (!candidateData.nombre) {
        return res.status(400).json({ error: 'Nombre requerido' });
    }
    
    if (!candidateData.email || !isValidEmail(candidateData.email)) {
        return res.status(400).json({ error: 'Email válido requerido' });
    }
    
    if (!candidateData.telefono) {
        return res.status(400).json({ error: 'Teléfono requerido' });
    }
    
    if (!candidateData.cv_url) {
        return res.status(400).json({ error: 'CV requerido' });
    }
    
    // Validar opcionales (si se envían)
    if (candidateData.experiencia_anos && candidateData.experiencia_anos < 0) {
        return res.status(400).json({ error: 'Experiencia debe ser positiva' });
    }
    
    // Procesar
    const result = await applicationService.applyToJob(vacancyId, candidateData);
    res.json(result);
});
```

### Usuario Interno
```javascript
// Backend: routes/auth.js
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Validar campos
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }
    
    // Buscar usuario
    const [users] = await pool.query(
        'SELECT * FROM usuarios WHERE email = ? AND is_active = TRUE',
        [email]
    );
    
    if (users.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const user = users[0];
    
    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Generar token
    const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    
    res.json({
        success: true,
        token,
        user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role
        }
    });
});
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Para Sistema Público
- [ ] ✅ Formulario de postulación sin autenticación
- [ ] ✅ Validación de email único
- [ ] ✅ Upload de CV
- [ ] ✅ Cálculo automático de match_score
- [ ] ✅ Email de confirmación
- [ ] ⭐ Captcha anti-spam (recomendado)
- [ ] ⭐ Rate limiting (recomendado)

### Para Sistema Interno
- [ ] ✅ Página de login
- [ ] ✅ Validación de credenciales
- [ ] ✅ Generación de JWT
- [ ] ✅ Almacenamiento en localStorage
- [ ] ✅ RBAC basado en roles
- [ ] ✅ Logout funcional
- [ ] ⭐ Refresh token automático (recomendado)
- [ ] ⭐ 2FA (opcional)

---

## 🎯 CONCLUSIÓN

**Parámetros Mínimos:**

**Usuario Público (Candidato):**
```
OBLIGATORIO: nombre, email, telefono, cv_url
OPCIONAL: titulo_profesional, experiencia_anos, salario_esperado, disponibilidad
```

**Usuario Interno (Staff):**
```
OBLIGATORIO: email, password, full_name, role, tenant_id
OPCIONAL: avatar_url, department, phone
```

**Diferencia Clave:** 
- Usuarios públicos NO se autentican (sin password/sesión)
- Usuarios internos SÍ se autentican (con password + JWT)

---

**Documentos relacionados:**
- `PUBLIC_USERS_STRATEGY.md` - Estrategia completa
- `PUBLIC_VS_INTERNAL_USERS.md` - Comparativa visual
- `LOGOUT_IMPLEMENTATION.md` - Sistema de logout
