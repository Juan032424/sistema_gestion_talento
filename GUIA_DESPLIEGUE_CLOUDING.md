# 🚀 Guía de Despliegue en Clouding.io (Docker + Full Stack)

Esta guía te explica cómo poner el sistema **SHEYLA / GH-SCORE PRO** en producción utilizando **Clouding.io**. Usaremos **Docker**, que es la forma más profesional y fácil de mantener el sistema.

---

## 🛠️ PASO 1: Crear el Servidor en Clouding.io

1. Inicia sesión en tu panel de **Clouding.io**.
2. Haz clic en **"Crear Servidor"**.
3. Configura lo siguiente:
   - **Imagen (SO):** Ubuntu 22.04 LTS.
   - **Recursos:** Mínimo 2 vCores y 2 GB de RAM (Recomendado 4GB para mejor fluidez con IA).
   - **Nombre:** `sheyla-server`.
4. Una vez creado, anota la **IP de tu servidor** (ej. `185.123.45.67`).

---

## 🔑 PASO 2: Acceder al Servidor

Abre una terminal en tu computadora y entra por SSH:

```bash
ssh root@79.143.91.200
```
*(Si usas Windows, puedes usar PowerShell o PuTTY)*.

---

## 📦 PASO 3: Instalar Docker y Herramientas

Copia y pega estos comandos uno por uno en la consola del servidor:

```bash
# 1. Actualizar el sistema
apt update && apt upgrade -y

# 2. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Instalar herramientas útiles
apt install git -y
```

---

## 📂 PASO 4: Subir el Código al Servidor

La forma más fácil es usar Git. Si tienes el código en GitHub (privado), haz un clone:

```bash
git clone https://github.com/Juan032424/sistema_gestion_talento /var/www/sheyla
cd /var/www/sheyla
```

**Si no tienes Git**, puedes subir la carpeta del proyecto comprimida en `.zip` usando un cliente FTP (como FileZilla) a la ruta `/var/www/sheyla`.

---

## ⚙️ PASO 5: Configurar el Entorno de Producción

He creado un archivo de ejemplo (`.env.production.example`). Crea el archivo `.env` real:

```bash
cp .env.production.example .env
nano .env
```
*(En el editor `nano`, rellena tus contraseñas y llaves de API. Guarda con **Ctrl+O**, Enter y sal con **Ctrl+X**)*.

**IMPORTANTE:** Cambia las contraseñas que dicen `YOUR_SECURE_...` por contraseñas reales.

---

## 🚀 PASO 6: ¡Lanzar el Sistema!

Gracias a **Docker Compose**, todo el sistema (Base de Datos, Backend y Frontend) se levantará con un solo comando:

```bash
docker compose up -d --build
```

Esto hará lo siguiente:
1. Descargará MySQL y configurará la base de datos automáticamente con el archivo `DATABASE_MASTER_V3.sql`.
2. Compilará el Backend de Node.js.
3. Compilará el Frontend (Vite) y lo servirá con Nginx.

---

## 🌐 PASO 7: Abrir los Puertos en Clouding.io

Por defecto, Clouding.io tiene un Firewall. Entra al panel web de Clouding y en la pestaña **Firewall** de tu servidor, asegúrate de tener abiertos:
- **Port 80 (HTTP):** Para entrar al sistema.
- **Port 443 (HTTPS):** Para seguridad (SSL).
- **Port 22 (SSH):** Para tu acceso.

---

## ✨ PASO 8: (Opcional) Activar Certificado SSL (HTTPS)

Para tener el candado verde, usa Let's Encrypt. Ejecuta esto en el servidor:

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d tu-dominio.com
```

---

## 📊 Monitoreo

Para ver los logs de lo que pasa en el sistema:
```bash
docker compose logs -f
```

Para detener el sistema:
```bash
docker compose down
```

---

¡Felicidades! Tu sistema ahora está corriendo en la nube de alta disponibilidad de **Clouding.io**. 🚀✨
