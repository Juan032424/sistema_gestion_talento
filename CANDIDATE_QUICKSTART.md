# 🎯 SISTEMA DE CANDIDATOS - GUÍA RÁPIDA

## ✅ ¿Qué se implementó?

### 1. **Base de Datos** (8 tablas nuevas)
- `candidate_accounts` - Perfiles de candidatos
- `candidate_skills` - Habilidades
- `candidate_education` - Educación
- `candidate_experience` - Experiencia laboral
- `candidate_languages` - Idiomas
- `candidate_saved_jobs` - Vacantes guardadas
- `candidate_notifications` - Notificaciones
- `candidate_activity_log` - Log de actividad

### 2. **Backend** (Node.js/Express)
- ✅ `server/routes/candidates.js` - 20+ endpoints API
- ✅ `server/services/candidateAccountService.js` - Lógica de negocio
- ✅ `server/middleware/candidateAuth.js` - Autenticación JWT
- ✅ `server/utils/candidateAuth.js` - Hash, tokens, validaciones
- ✅ Integrado en `server/index.js` como `/api/candidates`

### 3. **Frontend** (React/TypeScript)
- ✅ `client/src/context/CandidateAuthContext.tsx` - State management
- ✅ `client/src/components/portal/CandidateAuthModal.tsx` - Login/Registro
- ✅ `client/src/components/portal/CandidateDashboard.tsx` - Dashboard completo

---

## 🚀 Cómo Usar

### Paso 1: Asegúrate que el servidor esté corriendo

```bash
# Si no está corriendo, iniciarlo:
cd server
npm run dev

# Debe mostrar: Server running on port 3001
```

### Paso 2: Probar el Sistema

```bash
# Ejecutar pruebas automatizadas
cd server
node test_candidate_system.js

# Deberías ver:
# ✅ Pruebas pasadas: 8/8
# 🎉 ¡TODAS LAS PRUEBAS PASARON!
```

### Paso 3: Probar desde el Frontend

1. Abrir navegador: `http://localhost:5173/portal`
2. Buscar botón "Crear Cuenta" o "Regístrate"
3. Llenar formulario de registro
4. ✅ Deberías ver el Dashboard del candidato

---

## 📚 Documentación Completa

Ver archivo: **`CANDIDATE_SYSTEM_COMPLETE.md`**

Contiene:
- Arquitectura completa del sistema
- Todos los endpoints API con ejemplos
- Guía de uso para desarrolladores
- Guía de uso para candidatos
- Próximos pasos y features pendientes
- Troubleshooting

---

## 🧪 Pruebas Manuales Rápidas

### Test 1: Registro con cURL

```bash
curl -X POST http://localhost:3001/api/candidates/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "nombre": "Juan Pérez",
    "telefono": "+57 300 123 4567"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "candidate": {
    "id": 1,
    "email": "test@example.com",
    "nombre": "Juan Pérez"
  }
}
```

### Test 2: Login

```bash
curl -X POST http://localhost:3001/api/candidates/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

### Test 3: Ver Perfil (con token)

```bash
TOKEN="<tu-token-aquí>"

curl -X GET http://localhost:3001/api/candidates/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎨 Componentes Frontend

### Usar el Context en cualquier componente:

```tsx
import { useCandidateAuth } from '../context/CandidateAuthContext';

function MiComponente() {
    const { user, isAuthenticated, login, logout } = useCandidateAuth();
    
    if (!isAuthenticated) {
        return <div>Por favor inicia sesión</div>;
    }
    
    return (
        <div>
            <h1>Hola, {user.nombre}!</h1>
            <button onClick={logout}>Cerrar Sesión</button>
        </div>
    );
}
```

### Mostrar Modal de Auth:

```tsx
import CandidateAuthModal from './components/portal/CandidateAuthModal';

function App() {
    const [showAuth, setShowAuth] = useState(false);
    
    return (
        <div>
            <button onClick={() => setShowAuth(true)}>
                Iniciar Sesión
            </button>
            
            <CandidateAuthModal
                isOpen={showAuth}
                onClose={() => setShowAuth(false)}
                initialMode="login" // o "register"
            />
        </div>
    );
}
```

### Usar el Dashboard:

```tsx
import CandidateDashboard from './components/portal/CandidateDashboard';
import { useCandidateAuth } from './context/CandidateAuthContext';

function PortalPage() {
    const { isAuthenticated } = useCandidateAuth();
    
    if (!isAuthenticated) {
        return <LoginPage />;
    }
    
    return <CandidateDashboard />;
}
```

---

## 🔑 Endpoints Principales

### Autenticación
- `POST /api/candidates/auth/register` - Registrar
- `POST /api/candidates/auth/login` - Login
- `GET /api/candidates/auth/verify-email/:token` - Verificar email
- `POST /api/candidates/auth/forgot-password` - Recuperar contraseña
- `POST /api/candidates/auth/reset-password` - Resetear contraseña

### Perfil (requiere token)
- `GET /api/candidates/profile` - Ver perfil
- `PUT /api/candidates/profile` - Actualizar perfil

### Skills, Educación, Experiencia
- `POST /api/candidates/skills` - Agregar skill
- `DELETE /api/candidates/skills/:id` - Eliminar skill
- `POST /api/candidates/education` - Agregar educación
- `POST /api/candidates/experience` - Agregar experiencia

### Aplicaciones
- `GET /api/candidates/applications` - Ver postulaciones
- `GET /api/candidates/applications/:id` - Ver detalle

### Vacantes Guardadas
- `GET /api/candidates/saved-jobs` - Ver guardadas
- `POST /api/candidates/saved-jobs/:vacanteId` - Guardar
- `DELETE /api/candidates/saved-jobs/:vacanteId` - Eliminar

### Notificaciones
- `GET /api/candidates/notifications` - Ver notificaciones
- `PUT /api/candidates/notifications/:id/read` - Marcar como leída

---

## 🛠️ Scripts Útiles

```bash
# Reinstalar tablas de candidatos
cd server
node install_candidate_schema.js

# Probar sistema completo
node test_candidate_system.js

# Ver datos en MySQL
mysql -u root -p sistema_gestion_talento
SELECT * FROM candidate_accounts;
SELECT * FROM candidate_skills WHERE candidate_account_id = 1;
```

---

## 🐛 Troubleshooting

### Problema: "Unknown database"
```bash
# Verificar nombre de DB en .env
cat server/.env | grep DB_NAME

# Debe ser: DB_NAME=sistema_gestion_talento
```

### Problema: "Token inválido"
- Verificar que el token esté en formato: `Bearer eyJhbGci...`
- Token expira en 30 días
- Revisar que `JWT_SECRET` esté en .env

### Problema: "Email ya existe"
- Es correcto, el sistema previene duplicados
- Usar otro email o hacer login

### Problema: No se ve el Dashboard
- Verificar que `CandidateAuthProvider` esté wrapeando la app
- Revisar que el token esté en localStorage
- Abrir DevTools → Application → Local Storage → `candidateToken`

---

## 📊 Estado del Proyecto

### ✅ Completado (Fase 1)
- [x] Schema de base de datos
- [x] Backend completo con autenticación
- [x] Frontend básico (Auth + Dashboard)
- [x] Integración API
- [x] Scripts de instalación y prueba
- [x] Documentación

### ⏳ Pendiente (Fase 2)
- [ ] Editar perfil completo (UI)
- [ ] Upload de CV y fotos
- [ ] Envío de emails (verificación, notificaciones)
- [ ] Formularios para agregar education/experience
- [ ] Integración con aplicaciones existentes

### 🚀 Futuro (Fase 3)
- [ ] Chat con reclutador
- [ ] Social login (Google, LinkedIn)
- [ ] Video entrevistas
- [ ] Recomendaciones de IA
- [ ] Mobile app

---

## 📞 Contacto y Soporte

**Implementado por:** Antigravity AI  
**Fecha:** 2026-02-04  
**Versión:** 1.0.0

**Archivos importantes:**
- `CANDIDATE_SYSTEM_COMPLETE.md` - Documentación completa
- `server/test_candidate_system.js` - Suite de pruebas
- `server/install_candidate_schema.js` - Instalador de DB

---

## 🎉 ¡Listo para usar!

El sistema está completamente funcional y listo para recibir candidatos.

**Próximo paso sugerido:**  
Ejecuta `node test_candidate_system.js` para verificar que todo funciona correctamente.

✨ **¡Happy coding!** ✨
