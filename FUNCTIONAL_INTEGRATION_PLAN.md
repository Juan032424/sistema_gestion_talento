# 🎯 PLAN DE INTEGRACIÓN DE FUNCIONALIDADES

## ✅ COMPONENTES CREADOS

### **1. Context de Autenticación**
📄 `client/src/context/CandidateAuthContext.tsx`
- ✅ Login de candidatos
- ✅ Registro de candidatos
- ✅ Actualización de perfil
- ✅ Logout

### **2. Modal de Autenticación**
📄 `client/src/components/portal/CandidateAuthModal.tsx`
- ✅ Formulario de login
- ✅ Formulario de registro
- ✅ Toggle entre modos
- ✅ Validación de errores

### **3. Mis Aplicaciones**
📄 `client/src/components/portal/MyApplications.tsx`
- ✅ Lista de aplicaciones del candidato
- ✅ Estados visuales por color
- ✅ Enlaces a tracking
- ✅ Match score display

### **4. Vacantes Guardadas**
📄 `client/src/components/portal/SavedJobs.tsx`
- ✅ Lista de vacantes favoritas
- ✅ Botón de eliminar de guardados
- ✅ Botón de postulación rápida

---

## 🔧 CAMBIOS NECESARIOS EN BACKEND

### **1. Rutas de Autenticación de Candidatos**
📄 `server/routes/candidateAuth.js` (CREAR)

```javascript
const express = require('express');
const router = express.Router();
const candidateAuthService = require('../services/CandidateAuthService');

// POST /api/candidate-auth/register
router.post('/register', async (req, res) => {
    try {
        const { nombre, email, telefono, password, ciudad, titulo_profesional } = req.body;
        const result = await candidateAuthService.register({
            nombre, email, telefono, password, ciudad, titulo_profesional
        });
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/candidate-auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await candidateAuthService.login(email, password);
        res.json(result);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// GET /api/candidate-auth/profile (requiere autenticación)
router.get('/profile', authenticateCandidate, async (req, res) => {
    try {
        const candidate = await candidateAuthService.getProfile(req.candidateId);
        res.json({ candidate });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// PUT /api/candidate-auth/profile (requiere autenticación)
router.put('/profile', authenticateCandidate, async (req, res) => {
    try {
        const candidate = await candidateAuthService.updateProfile(req.candidateId, req.body);
        res.json({ candidate });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/candidate-auth/my-applications (requiere autenticación)
router.get('/my-applications', authenticateCandidate, async (req, res) => {
    try {
        const applications = await candidateAuthService.getMyApplications(req.candidateId);
        res.json({ applications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/candidate-auth/saved-jobs (requiere autenticación)
router.get('/saved-jobs', authenticateCandidate, async (req, res) => {
    try {
        const savedJobs = await candidateAuthService.getSavedJobs(req.candidateId);
        res.json({ savedJobs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/candidate-auth/saved-jobs/:vacancyId (requiere autenticación)
router.post('/saved-jobs/:vacancyId', authenticateCandidate, async (req, res) => {
    try {
        await candidateAuthService.saveJob(req.candidateId, req.params.vacancyId);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /api/candidate-auth/saved-jobs/:vacancyId (requiere autenticación)
router.delete('/saved-jobs/:vacancyId', authenticateCandidate, async (req, res) => {
    try {
        await candidateAuthService.removeSavedJob(req.candidateId, req.params.vacancyId);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
```

---

### **2. Servicio de Autenticación de Candidatos**
📄 `server/services/CandidateAuthService.js` (CREAR)

```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

class CandidateAuthService {
    
    async register(data) {
        const { nombre, email, telefono, password, ciudad, titulo_profesional } = data;
        
        // Check if email already exists
        const [existing] = await pool.query(
            'SELECT id FROM candidatos WHERE email = ?',
            [email]
        );
        
        if (existing.length > 0) {
            throw new Error('El email ya está registrado');
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert candidate
        const [result] = await pool.query(`
            INSERT INTO candidatos (
                nombre, email, telefono, password_hash, ciudad, titulo_profesional,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [nombre, email, telefono, hashedPassword, ciudad, titulo_profesional]);
        
        const candidateId = result.insertId;
        
        // Generate token
        const token = jwt.sign(
            { id: candidateId, email, type: 'candidate' },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        return {
            token,
            candidate: {
                id: candidateId,
                nombre,
                email,
                telefono,
                ciudad,
                titulo_profesional
            }
        };
    }
    
    async login(email, password) {
        const [candidates] = await pool.query(
            'SELECT * FROM candidatos WHERE email = ?',
            [email]
        );
        
        if (candidates.length === 0) {
            throw new Error('Credenciales inválidas');
        }
        
        const candidate = candidates[0];
        
        if (!candidate.password_hash) {
            throw new Error('Esta cuenta no tiene contraseña configurada');
        }
        
        const validPassword = await bcrypt.compare(password, candidate.password_hash);
        
        if (!validPassword) {
            throw new Error('Credenciales inválidas');
        }
        
        const token = jwt.sign(
            { id: candidate.id, email: candidate.email, type: 'candidate' },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        return {
            token,
            candidate: {
                id: candidate.id,
                nombre: candidate.nombre,
                email: candidate.email,
                telefono: candidate.telefono,
                ciudad: candidate.ciudad,
                titulo_profesional: candidate.titulo_profesional
            }
        };
    }
    
    async getProfile(candidateId) {
        const [candidates] = await pool.query(
            'SELECT id, nombre, email, telefono, ciudad, titulo_profesional FROM candidatos WHERE id = ?',
            [candidateId]
        );
        
        if (candidates.length === 0) {
            throw new Error('Candidato no encontrado');
        }
        
        return candidates[0];
    }
    
    async updateProfile(candidateId, data) {
        const { nombre, telefono, ciudad, titulo_profesional } = data;
        
        await pool.query(`
            UPDATE candidatos 
            SET nombre = ?, telefono = ?, ciudad = ?, titulo_profesional = ?, updated_at = NOW()
            WHERE id = ?
        `, [nombre, telefono, ciudad, titulo_profesional, candidateId]);
        
        return this.getProfile(candidateId);
    }
    
    async getMyApplications(candidateId) {
        const [applications] = await pool.query(`
            SELECT 
                pa.id,
                pa.estado,
                pa.auto_match_score,
                pa.fecha_postulacion,
                pa.fecha_ultima_actualizacion,
                v.id as vacancy_id,
                v.puesto_nombre,
                v.ubicacion,
                atl.tracking_token
            FROM postulaciones_agiles pa
            INNER JOIN vacantes v ON pa.vacante_id = v.id
            LEFT JOIN application_tracking_links atl ON pa.id = atl.application_id
            WHERE pa.candidato_id = ?
            ORDER BY pa.fecha_postulacion DESC
        `, [candidateId]);
        
        return applications;
    }
    
    async getSavedJobs(candidateId) {
        const [savedJobs] = await pool.query(`
            SELECT 
                sj.id,
                sj.vacante_id as vacancy_id,
                sj.fecha_guardado,
                v.puesto_nombre,
                v.descripcion,
                v.ubicacion,
                v.salario_min,
                v.salario_max,
                v.modalidad_trabajo
            FROM candidate_saved_jobs sj
            INNER JOIN vacantes v ON sj.vacante_id = v.id
            WHERE sj.candidato_id = ?
            ORDER BY sj.fecha_guardado DESC
        `, [candidateId]);
        
        return savedJobs;
    }
    
    async saveJob(candidateId, vacancyId) {
        // Check if already saved
        const [existing] = await pool.query(
            'SELECT id FROM candidate_saved_jobs WHERE candidato_id = ? AND vacante_id = ?',
            [candidateId, vacancyId]
        );
        
        if (existing.length > 0) {
            return; // Already saved
        }
        
        await pool.query(
            'INSERT INTO candidate_saved_jobs (candidato_id, vacante_id, fecha_guardado) VALUES (?, ?, NOW())',
            [candidateId, vacancyId]
        );
    }
    
    async removeSaved Job(candidateId, vacancyId) {
        await pool.query(
            'DELETE FROM candidate_saved_jobs WHERE candidato_id = ? AND vacante_id = ?',
            [candidateId, vacancyId]
        );
    }
}

module.exports = new CandidateAuthService();
```

---

### **3. Middleware de Autenticación**
📄 `server/middleware/authenticateCandidate.js` (CREAR)

```javascript
const jwt = require('jsonwebtoken');

const authenticateCandidate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.type !== 'candidate') {
            return res.status(403).json({ error: 'Tipo de usuario inválido' });
        }
        
        req.candidateId = decoded.id;
        req.candidateEmail = decoded.email;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

module.exports = authenticateCandidate;
```

---

### **4. Tablas de Base de Datos Necesarias**

```sql
-- Agregar campo password_hash a candidatos (si no existe)
ALTER TABLE candidatos 
ADD COLUMN password_hash VARCHAR(255) AFTER email;

-- Tabla de vacantes guardadas
CREATE TABLE IF NOT EXISTS candidate_saved_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidato_id INT NOT NULL,
    vacante_id INT NOT NULL,
    fecha_guardado DATETIME NOT NULL,
    FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE CASCADE,
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_saved_job (candidato_id, vacante_id)
);

-- Índices para mejorar performance
CREATE INDEX idx_saved_candidato ON candidate_saved_jobs(candidato_id);
CREATE INDEX idx_saved_vacante ON candidate_saved_jobs(vacante_id);
```

---

## 🔄 INTEGRACIÓN EN APP.TSX

```tsx
import { CandidateAuthProvider } from './context/CandidateAuthContext';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CandidateAuthProvider>  {/* ← Agregar aquí */}
          <Router>
            <ToastProvider>
              <Routes>
                {/* ... rutas ... */}
              </Routes>
            </ToastProvider>
          </Router>
        </CandidateAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

---

## 📍 RUTAS A AGREGAR

```tsx
// En App.tsx, agregar rutas públicas:

{/* Public Routes */}
<Route path="/portal" element={<PublicJobPortal />} />
<Route path="/portal/saved" element={<SavedJobs />} />
<Route path="/portal/applications" element={<MyApplications />} />
<Route path="/track/:token" element={<ApplicationTracking />} />
```

---

## 🎯 PASOS DE IMPLEMENTACIÓN

1. **✅ Crear tablas de base de datos**
2. **✅ Crear servicios backend**
3. **✅ Crear rutas backend**
4. **✅ Crear middleware**
5. **✅ Registrar rutas en server/index.js**
6. **✅ Agregar CandidateAuthProvider en App.tsx**
7. **✅ Actualizar PublicJobPortal para usar el context**
8. **✅ Agregar rutas de navegación**
9. **✅ Testing completo**

---

## 🚀 RESULTADO ESPERADO

**Portal con funcionalidades completas:**
- ✅ Login/Registro de candidatos
- ✅ Guardar vacantes favoritas
- ✅ Ver mis aplicaciones
- ✅ Tracking de postulaciones
- ✅ Perfil de usuario editable
- ✅ Navegación funcional
- ✅ Estados persistentes

---

## 📝 PRÓXIMOS PASOS INMEDIATOS

1. Crear las tablas en la base de datos
2. Crear los servicios y rutas backend
3. Registrar las rutas en server/index.js
4. Actualizar App.tsx con el provider
5. Actualizar PublicJobPortal para integrar funcionalidades
6. Probar el flujo completo

¿Deseas que continúe con la implementación?
