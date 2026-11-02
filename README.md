## Ejecutar con Docker

Requisitos: Docker con el plugin Compose y un archivo `.env.local` en la raíz con las variables de `.env.example`
(`OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL`). Ese archivo solo lo lee `docker compose` al crear el
contenedor: no se copia a la imagen.

```bash
docker compose up --build        # construye la imagen y levanta el chat en http://localhost:3000
docker compose up --build -d     # igual, en segundo plano
docker compose ps                # estado; debe decir (healthy)
docker compose logs -f chatbot   # ver el log (Ctrl+C para salir del log)
docker compose down              # detener y borrar el contenedor (la imagen se conserva)
```

Si `npm run dev` está corriendo, detenlo antes: los dos usan el puerto 3000. Si cambias `data/productos.json` o
`data/preguntas.json`, ejecuta `npm run indexar` antes de reconstruir la imagen.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
