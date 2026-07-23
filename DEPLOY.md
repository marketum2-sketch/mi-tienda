# Guia de despliegue

Sigue estos pasos en orden. Cada uno te da algo (un token, una key, un ID) que despues
pegamos en las variables de entorno de Railway.

## 1. Bot de Discord (Developer Portal)

1. Entra a https://discord.com/developers/applications -> "New Application" -> ponle nombre a tu tienda.
2. En "Bot" -> "Reset Token" -> copia el token. Eso es `DISCORD_TOKEN`. **No lo compartas nunca en publico.**
3. En la misma pagina de "Bot", activa el intent "Server Members" si lo pide (no es obligatorio para lo que hicimos, pero no molesta tenerlo activo).
4. En "OAuth2" -> "URL Generator": marca el scope `bot` y `applications.commands`. En permisos marca: Manage Channels, Send Messages, Embed Links, Read Message History, View Channels.
5. Copia la URL generada, abrela en el navegador y agrega el bot a tu servidor.
6. En "General Information" copia el "Application ID". Eso es `CLIENT_ID`.
7. En Discord (con el modo desarrollador activado: Ajustes de usuario -> Avanzado -> Modo desarrollador):
   - Click derecho sobre el nombre de tu servidor -> "Copiar ID". Eso es `GUILD_ID`.
   - Crea una categoria llamada "Tickets", click derecho -> "Copiar ID". Eso es `TICKET_CATEGORY_ID`.
   - Crea un rol "Staff" y asignatelo a vos mismo, click derecho sobre el rol en Ajustes del servidor -> Roles -> "Copiar ID". Eso es `STAFF_ROLE_ID`.

## 2. NOWPayments (pagos con crypto)

1. Crea cuenta en https://nowpayments.io
2. En el dashboard, seccion API Keys, genera una key. Eso es `NOWPAYMENTS_API_KEY`.
3. En Settings -> IPN, activa notificaciones y copia el IPN secret. Eso es `NOWPAYMENTS_IPN_SECRET`.
   (La URL de callback la vas a poner despues, cuando tengas el dominio de Railway).

## 3. Subir el codigo a GitHub

Necesitas una cuenta en https://github.com (gratis).

1. Crea un repositorio nuevo, vacio, por ejemplo `mi-tienda`.
2. En tu computadora, dentro de la carpeta `tienda/` que te pase, corre:
   ```
   git init
   git add .
   git commit -m "primer commit"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/mi-tienda.git
   git push -u origin main
   ```

## 4. Railway

1. Crea cuenta en https://railway.app (podes entrar con GitHub).
2. "New Project" -> "Deploy from GitHub repo" -> elegi `mi-tienda`.
3. Agrega una base de datos: "New" -> "Database" -> "PostgreSQL". Railway te da un `DATABASE_URL` automatico.
4. Vas a necesitar 2 servicios corriendo desde el mismo repo (web y bot):
   - Servicio 1 ("web"): en Settings -> "Root Directory" pone `web`. Build command: `npm install && npx prisma generate && npm run build`. Start command: `npm start`.
   - Servicio 2 ("bot"): "New" -> "GitHub repo" (el mismo repo otra vez) -> Root Directory `bot`. Build command: `npm install`. Start command: `npm start`.
5. En cada servicio, pestaña "Variables", pega las del `.env.example` con tus valores reales. El `DATABASE_URL` de Postgres se lo podes "linkear" desde Railway (boton de referencia a otra variable) en vez de copiarlo a mano, para que si cambia se actualice solo.
6. En el servicio "web", Railway te da un dominio publico (Settings -> Networking -> "Generate Domain"). Ese es tu `PUBLIC_URL`. Actualiza esa variable con el dominio real.
7. Volve a NOWPayments y pone la URL de IPN: `https://TU-DOMINIO-RAILWAY/api/webhooks/nowpayments`.
8. En el servicio "bot", Railway tambien necesita exponer el puerto interno (`BOT_INTERNAL_PORT`) para que "web" le pueda avisar los pagos. La forma mas simple: activa "Private Networking" en el proyecto (Railway lo activa solo si los servicios estan en el mismo proyecto) y en la variable `BOT_INTERNAL_URL` del servicio web pone `http://<nombre-del-servicio-bot>.railway.internal:4001`.

## 5. Preparar la base de datos y los comandos del bot

Desde tu computadora, con Railway CLI (`npm i -g @railway/cli`, despues `railway login` y `railway link` dentro de la carpeta del proyecto):

```
railway run --service web npx prisma migrate deploy
railway run --service bot npm run deploy-commands
```

## 6. Probar

1. Entra a `https://TU-DOMINIO-RAILWAY/admin`, logueate con `ADMIN_PASSWORD` y crea un producto de prueba.
2. Abrí la tienda, comprá ese producto con un monto chico, y fijate que se cree el ticket en Discord y te llegue la entrega.
3. Si algo falla, mira los logs en Railway (cada servicio tiene su pestaña "Deployments" -> "View Logs").
