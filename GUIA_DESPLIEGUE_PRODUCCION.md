# 🚀 Guía Paso a Paso: Despliegue a Producción (La Manera Más Fácil)

Para subir el sistema de Gestión Humana (SHEYLA / GH-SCORE PRO) a producción de forma estable, segura y relativamente fácil, existen dos caminos principales. 

Dado que el sistema maneja **datos sensibles (Hojas de Vida, Ley 1581)**, la **Opción 1 (Servidor VPS con Panel de Control)** es la más recomendada para empresas, ya que mantiene la Base de Datos y el código en el mismo lugar de forma privada. La **Opción 2 (Servicios Cloud Separados)** es la más rápida de configurar si no quieres tocar ninguna consola de servidor.

---

## 🛠️ PASO 0: Preparación del Código (Obligatorio para cualquier opción)

Actualmente, el código Frontend está apuntando localmente al Backend. Debemos cambiar esto para que sea dinámico.

**1. Modificar `client/src/api.ts`**
Cambia la línea donde se define `baseURL` (línea 3-5 aprox):
```typescript
// Antes:
// baseURL: 'http://localhost:3001/api',

// Ahora:
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
```

**2. Modificar `client/src/components/public/PublicApplyPage.tsx`**
Cambia la variable `API_BASE` (aprox. línea 88):
```typescript
// Antes:
// const API_BASE = 'http://localhost:3001';

// Ahora:
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

---

## 🌟 OPCIÓN 1: La Más Profesional y Económica (Servidor VPS + CloudPanel)
*Recomendado para DISCOL S.A.S. por seguridad de datos y costos a largo plazo.*

1. **Adquirir un Servidor VPS:** Compra un VPS básico (con SO Ubuntu 22.04) en **Hostinger**, **DigitalOcean** o **Contabo** (Cuesta unos $5 a $7 USD al mes).
2. **Instalar CloudPanel (GRATIS):** 
   - Ingresa por SSH a tu servidor y ejecuta el comando de instalación de CloudPanel (búscalo en su web oficial). Es automático y tarda 2 minutos.
   - Esto te dará un panel visual web estilo cPanel muy moderno y fácil de usar.
3. **Paso a Paso en CloudPanel:**
   - **Base de Datos:** Entra al panel web, ve a *Databases*, crea una nueva base de datos (ej. `sistema_talento`) y su usuario.
   - Importa tu estructura usando phpMyAdmin (incluido en CloudPanel) copiando el contenido de tu archivo `.sql` actual o ejecutando tus scripts en Node.
   - **Subir el Backend (Node.js):**
     - Ve a *Sites* -> *Add Site* -> *Node.js Site*.
     - Pon tu subdominio del backend (ej. `api.tudominio.com`).
     - Sube los archivos de la carpeta `server/` (sin cargar `node_modules`).
     - Crea allí el archivo `.env` conectándolo a la nueva base de datos y puertos.
     - Haz clic en instalar dependencias (`npm install`) desde el manejador de Node del panel y reinicia la app.
   - **Subir el Frontend (React/Vite):**
     - En tu computadora, dentro de la carpeta `client`, crea un archivo llamado `.env.production` con:
       ```
       VITE_API_URL=https://api.tudominio.com/api
       ```
     - En tu terminal local, ejecuta: `npm run build` dentro de la carpeta `client`.
     - Esto creará una carpeta llamada `dist`.
     - En CloudPanel, ve a *Sites* -> *Add Site* -> *Static HTML Site* (ej. `app.tudominio.com`).
     - Sube TODO el contenido de la carpeta `dist` allí.
4. **¡Estás en Producción!** Puedes activar los certificados SSL (candado verde) con solo un clic en la pestaña *SSL* de CloudPanel usando Let's Encrypt.

---

## ☁️ OPCIÓN 2: La Más Rápida (Servicios en la Nube Vercel + Render + Railway)
*No requieres instalar un sistema operativo de servidor. Todo es administrado.*

#### 1. Base de Datos (Railway o Aiven - MySQL)
- Crea cuenta en **Railway.app** o **Aiven.io**.
- Despliega un servicio de base de datos MySQL.
- Te darán unas credenciales (Host, Puerto, Usuario, Contraseña). Úsalas en tu cliente local MySQL y ejecuta tus archivos de base de datos (`server/schema.sql`, etc) para construir las tablas.

#### 2. Backend (Render.com - Node.js)
- Sube TODO tu código (cliente y servidor) a un repositorio privado en **GitHub**.
- Entra a **Render.com**, haz clic en *New Web Service*, y conecta tu repositorio de GitHub.
- Configura así:
  - **Root Directory:** `server`
  - **Build Command:** `npm install`
  - **Start Command:** `npm start` (o `node index.js`)
- En la pestaña de *Environment Variables* en Render, agrega todas las variables de tu archivo `.env` local (`JWT_SECRET`, etc), pero con las credenciales de la Base de Datos en la Nube que creaste en el paso anterior.
- Render te dará un link: Ej. `https://mi-backend.onrender.com`.

#### 3. Frontend (Vercel.com - Vite/React)
- Entra a **Vercel.com** y vincula tu mismo repositorio de GitHub (crea un nuevo proyecto).
- Configura así:
  - **Framework Preset:** Vite
  - **Root Directory:** `client`
- En la sección *Environment Variables* de Vercel añade:
  - **VITE_API_URL** = `https://mi-backend.onrender.com/api`
- Dale a desplegar (Deploy). Vercel construirá la aplicación automáticamente y te dará un enlace listo para usar compartible.

---

### 💡 Observaciones Importantes antes de ir a Producción:
1. Asegúrate de cambiar `JWT_SECRET` en el archivo `.env` de producción por contraseñas aleatorias muy seguras.
2. Si usas la **Opción 2** con cuentas completamente gratuitas, el Backend de Render "se dormirá" tras la inactividad, tardando 30 a 50 segundos en cargar la primera vez al día. Para una empresa como DISCOL, sugerimos la **Opción 1**.
3. El archivo `.env` local nunca debe subirse a GitHub por seguridad.
