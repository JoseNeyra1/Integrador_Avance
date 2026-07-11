# Integrador_Avance — TiendaFlics (rama front2)

Proyecto full stack: backend en **Spring Boot + MySQL** y frontend en **HTML/CSS/JS**.

## Estructura

```
FrontEnd/
  index.html            -> Tienda (catálogo + carrito)
  admin.html             -> Panel de administración
  pos.html                -> Punto de venta (caja)
  login-personal.html     -> Login de ADMIN/VENDEDOR
  login-cliente.html      -> Login/registro de clientes
  js/config.js             -> URL del backend (único lugar a editar por entorno)
  js/*.js                  -> Lógica de cada página
tiendaflics-backend/    -> API REST en Spring Boot (Maven)
docker-compose.yml      -> Levanta backend + MySQL juntos
.env.example            -> Plantilla de variables de entorno
```

## Cambios hechos para poder desplegarlo

1. Las credenciales de la base de datos ya no están fijas en el código: se leen de variables de entorno (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`).
2. CORS ya no acepta cualquier origen (`*`): se restringe con la variable `CORS_ALLOWED_ORIGINS`.
3. Las contraseñas se verifican y se guardan con **BCrypt** (tanto el login de personal en `AuthController` como el registro/login de clientes en `ClienteController`).
4. Ninguna página del frontend tiene ya la URL del backend fija: todas leen `window.BACKEND_API_URL` desde `FrontEnd/js/config.js`.
5. Se agregó `Dockerfile` (backend) y `docker-compose.yml` (backend + MySQL) para desplegar fácil.

⚠️ **Nota pendiente**: las rutas de la API (`/api/pedidos`, `/api/ventas`, `/api/clientes`, etc.) siguen sin exigir sesión iniciada a nivel de Spring Security (`permitAll()`). El login existe pero no protege esas rutas todavía — cualquiera que conozca la URL del backend podría, por ejemplo, llamar directamente a `/api/ventas` sin pasar por el login. Antes de manejar datos reales de clientes, lo ideal es migrar a JWT y restringir por rol (ADMIN/VENDEDOR/CLIENTE). Puedo ayudarte con eso cuando quieras avanzar.

⚠️ **Si ya tienes usuarios o clientes cargados en la base de datos con contraseñas en texto plano**, dejarán de poder iniciar sesión hasta que se regeneren como hash BCrypt (antes se comparaba texto contra texto, ahora se compara contra un hash). Avísame si es tu caso y preparamos la migración.

---

## Cómo correrlo en local con Docker (recomendado para probar)

1. Instala [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Copia `.env.example` a `.env` y pon una contraseña:
   ```bash
   cp .env.example .env
   ```
3. Levanta todo:
   ```bash
   docker compose up --build
   ```
4. El backend queda en `http://localhost:8080/api`.
5. Abre cualquier página de `FrontEnd/` con Live Server (VS Code) — ya apuntan a `localhost:8080` por defecto en `js/config.js`.

---

## Cómo desplegarlo en internet

### Backend + Base de datos → Railway

1. Crea cuenta en [railway.app](https://railway.app).
2. **New Project → Deploy from GitHub repo** y selecciona este repositorio, rama `front2` (Railway detecta el `Dockerfile` en `tiendaflics-backend/`; si pide la carpeta raíz del servicio, indica `tiendaflics-backend`).
3. Agrega un servicio **MySQL** desde el marketplace de Railway dentro del mismo proyecto.
4. En el servicio del backend, configura las variables de entorno:
   - `DB_URL` = `jdbc:mysql://<host-mysql-railway>:<puerto>/<db>?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true` (Railway te da estos datos en la pestaña "Connect" del servicio MySQL)
   - `DB_USERNAME`, `DB_PASSWORD` (los que te da Railway)
   - `CORS_ALLOWED_ORIGINS` = la URL donde publiques el frontend (ej. `https://tu-proyecto.vercel.app`)
5. Railway te da una URL pública tipo `https://tiendaflics-backend-production.up.railway.app`. Guárdala.

### Frontend → Vercel o Netlify

1. Antes de subir, edita `FrontEnd/js/config.js` y pon la URL real del backend:
   ```js
   window.BACKEND_API_URL = 'https://tiendaflics-backend-production.up.railway.app/api';
   ```
2. Sube el cambio a GitHub.
3. En [vercel.com](https://vercel.com) o [netlify.com](https://netlify.com): **New Project → importa el repo (rama `front2`) → Root Directory: `FrontEnd`** (sin build command, es HTML estático).
4. Despliega. Te dará una URL pública (ej. `https://tu-proyecto.vercel.app`). La página de entrada será `index.html`; las demás quedan accesibles como `/admin.html`, `/pos.html`, etc.
5. Vuelve a Railway y confirma que `CORS_ALLOWED_ORIGINS` tenga exactamente esa URL (sin `/` al final).

### Alternativa todo-en-uno: Render

Render también permite backend (Docker) + MySQL/PostgreSQL gestionado + sitio estático, todo desde el mismo dashboard, si prefieres no combinar dos plataformas.

---

## Variables de entorno (resumen)

| Variable | Dónde se usa | Ejemplo |
|---|---|---|
| `DB_URL` | Backend | `jdbc:mysql://host:3306/TiendaFlic_db?...` |
| `DB_USERNAME` | Backend | `root` |
| `DB_PASSWORD` | Backend | (tu contraseña real) |
| `CORS_ALLOWED_ORIGINS` | Backend | `https://tu-frontend.vercel.app` |
| `DDL_AUTO` | Backend (opcional) | `validate` en producción, `update` en desarrollo |
| `window.BACKEND_API_URL` | Frontend (`js/config.js`) | `https://tu-backend.up.railway.app/api` |
