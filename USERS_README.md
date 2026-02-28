# 🔐 Credenciales de Acceso GH-SCORE PRO

Se han creado los siguientes usuarios con diferentes niveles de acceso para probar la plataforma SaaS.

## 🏢 Empresa: DISCOL SAS (Default Tenant)

| Rol | Email | Contraseña | Permisos Principales |
|-----|-------|------------|----------------------|
| **👑 Superadmin** | `superadmin@gh-score.com` | `password123` | ✅ Acceso Total<br>✅ Gestión de Tenants<br>✅ AI Hub Global |
| **🏢 Admin (Gerente)** | `admin@discol.com` | `password123` | ✅ Gestión completa de la empresa<br>✅ Usuarios, Sedes, Configuración<br>✅ Ver todas las vacantes |
| **👥 Líder (Jefe Área)** | `lider@discol.com` | `password123` | ⚠️ Vista restringida<br>✅ Solo vacantes asignadas<br>✅ Evaluar candidatos<br>❌ Sin acceso a Configuración |
| **🔎 Reclutador** | `reclutador@discol.com` | `password123` | ✅ Gestión de procesos<br>✅ Ver todos los candidatos<br>✅ Sourcing AI |

---

## 🧪 Cómo probar los roles

1. **Inicia sesión** con cada usuario para ver cómo cambia la interfaz.
2. **Superadmin**: Verás el menú completo incluyendo "AI Hub Agents".
3. **Líder**: Verás que el menú se reduce (sin "Candidatos" lista global, sin "Configuración").
4. **Admin**: Tienes control total sobre DISCOL pero no sobre el sistema global.

> **Nota de Seguridad**: En producción, las contraseñas están encriptadas. Este archivo es solo para desarrollo.
