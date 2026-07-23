# Tienda (web + bot de Discord)

## Estructura
- `web/` — Next.js: catalogo, checkout, webhook de pago.
- `bot/` — discord.js: tickets, entrega de producto, comandos de staff.
- `prisma/schema.prisma` — base de datos compartida (Postgres).

## Como funciona el flujo de compra
1. Cliente entra a la web, elige producto, pone su ID de Discord y paga con crypto (NOWPayments).
2. NOWPayments confirma el pago -> llama al webhook de la web (`/api/webhooks/nowpayments`).
3. La web marca el pedido como `PAID` y avisa al bot por HTTP interno.
4. El bot abre (o reutiliza) un ticket privado, entrega el producto ahi y por DM.

## Puesta en marcha
1. Crea una base de datos Postgres (gratis en Railway, Neon o Supabase).
2. Copia `.env.example` a `.env` en la raiz y rellena todo. `web/` y `bot/` leen las mismas variables si las copias a cada carpeta, o usa un gestor de procesos que las comparta.
3. Instala dependencias:
   ```
   cd prisma && npx prisma generate && npx prisma migrate dev --name init
   cd ../bot && npm install && npm run deploy-commands && npm start
   cd ../web && npm install && npm run dev
   ```
4. En el servidor de Discord: crea una categoria para tickets, copia su ID en `TICKET_CATEGORY_ID`, crea un rol de Staff y copia su ID en `STAFF_ROLE_ID`.
5. En NOWPayments: crea cuenta, saca tu API key y el IPN secret, configura la URL de callback como `https://tu-dominio.com/api/webhooks/nowpayments`.
6. Entra a `https://tu-dominio.com/admin`, pon la contraseña que definiste en `ADMIN_PASSWORD` y desde ahi crea, edita y borra productos, y mira los pedidos. No hace falta tocar la base de datos a mano.

## Panel de admin (`/admin`)
- Login con una sola contraseña (`ADMIN_PASSWORD`), guardada como cookie firmada (`ADMIN_SECRET`) — no hay usuarios ni roles, es para vos como dueño de la tienda.
- `/admin` — lista de productos (con boton editar/borrar) y ultimos 20 pedidos con su estado.
- `/admin/products/new` y `/admin/products/[id]` — alta y edicion de producto: nombre, descripcion, precio, stock (vacio = ilimitado) y el "contenido a entregar" (la key/link/texto que el bot manda automaticamente al confirmarse el pago).
- Si algun dia queres mas de una persona con acceso, hay que migrar esto a usuarios con contraseña propia (avisame y lo armamos).

## Pendiente / siguientes pasos sugeridos
- Reintentos si el webhook de NOWPayments falla.
- Rate limit en `/api/checkout` para evitar spam de pedidos.
- Decidir hosting: Railway es lo mas simple para no pelear con servidores (web + bot + Postgres en un mismo proyecto).
