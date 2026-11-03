@AGENTS.md

# Chatbot de demostración (BERPA, no oficial)

Prototipo independiente de un chatbot con IA para una tienda colombiana de distribución (BERPA).
Next.js 16 (App Router), TypeScript, CSS Modules y la API Responses de OpenAI.
NO es oficial de BERPA ni está conectado a sus sistemas.

## Alcance del chatbot

- SOLO responde sobre la tienda y su página: catálogo, categorías, precios y existencias de
  demostración, domicilios, cobertura, compra mínima, contacto y preguntas frecuentes.
- NO toma pedidos, no guarda solicitudes, no reserva inventario y no pide datos personales
  (nombre, teléfono, dirección, cédula, tarjetas).
- Si el cliente quiere comprar, lo orienta a la tienda en línea o al WhatsApp publicado (3023322766),
  sin prometer confirmaciones, contacto ni entrega.
- Si pregunta algo ajeno a la tienda, redirige con amabilidad y no responde.
- Respuestas en texto plano, precios con punto de miles ($28.000), máximo 3 productos por respuesta;
  si un producto tiene varias opciones, ofrece hasta 3 y pregunta cuál prefiere.

## Reglas inamovibles

- Nunca inventar datos comerciales (precios reales, inventario, promociones, políticas, medios de pago,
  horarios). Productos, precios y existencias del catálogo son FICTICIOS y se presentan como demostración.
  Lo verificado y lo ficticio no se mezclan.
- No afirmar ni insinuar que la demo es oficial de BERPA o que está conectada a sus sistemas.
  No usar su logo ni sus imágenes.
- La clave de OpenAI vive solo en `.env.local`. NO leer, imprimir ni copiar `.env.local` ni ningún `.env*`.
  Mantener `.env.example` con nombres de variables sin valores.
- No instalar dependencias ni servicios nuevos sin justificarlos y pedir confirmación. No usar sudo sin preguntar.
- Sin base de datos: lo que se guarde son archivos JSON locales.
- Next.js 16: no agregar Tailwind ni reglas de Turbopack para CSS en `next.config.ts`
  (ya rompieron CSS Modules una vez).
- Antes de borrar archivos, mostrar la lista y esperar OK.
- Trabajar en la rama actual, un commit por fase y detenerse al cerrar cada fase para aprobación.
- No afirmar que algo funciona sin ejecutarlo: al cerrar cada fase mostrar los comandos corridos
  (`npx tsc --noEmit`, `npm run lint`, pruebas) y sus resultados reales.

## Estructura

- `app/page.tsx`, `app/layout.tsx`: página de demostración (aviso de no afiliación, catálogo destacado, chat).
- `app/api/salud/route.ts`: healthcheck del contenedor; devuelve solo `{"ok": true}`.
- `app/api/chat/route.ts`: endpoint del chat. Valida mensajes, limita por IP, arma el contexto y ejecuta
  el ciclo de herramientas con la API Responses. Sin clave configurada responde en modo simulado
  con el buscador local. Si la respuesta trae productos y no dice "demostración", agrega la nota. Pasa al modelo los
  productos que el asistente ya nombró en turnos anteriores (el historial solo es texto) y reemplaza por
  "[dato omitido]" el celular o la dirección que el cliente haya escrito si el modelo los repite.
- `components/`: `Chatbot` (panel de chat), `ChatProduct` (tarjetas en el chat), `Header`,
  `CategoryExplorer`, `ProductCard`, cada uno con su `.module.css`.
- `lib/config.ts`: límites, WhatsApp y compra mínima ($80.000, sobre productos, sin domicilio).
- `lib/datos.ts`: carga de `data/*.json` y buscador por palabras (productos, preguntas, temas sin información).
- `lib/rag.ts`: búsqueda semántica sobre `data/indice-embeddings.json` por partes del mensaje (cada producto pedido
  y las partes del mensaje anterior del cliente, en paralelo e intercaladas; coseno en memoria, caché de consultas,
  pausa de 60 s tras una falla de la API). Si no hay índice válido o falla la API, usa el buscador por palabras.
  El índice se invalida solo si cambian productos o preguntas (hash) o el modelo.
- `lib/prompt.ts`: instrucciones del sistema y contexto por turno: solo los fragmentos recuperados, con su fuente y
  marca (VERIFICADO / SIN VERIFICAR / FICTICIO), más la lista de temas sin información.
- `lib/herramientas.ts`: herramientas del modelo (`buscar_productos`, `consultar_existencias` con alternativas,
  `cotizar_productos`, que solo informa y no guarda nada). Existencias y precios son por paquete;
  `unidades_por_paquete` sale del nombre (`xN`). `tipo_cantidad` "unidades" se convierte en el servidor con
  ceil(cantidad / unidades_por_paquete). Si una línea tiene problema, `total_productos_cop` y `cumple_compra_minima`
  son null (nunca 0/false) y hay `total_parcial_solo_lineas_validas_cop` y un motivo por línea.
- `lib/openai.ts`: cliente y modelo (variables `OPENAI_API_KEY`, `OPENAI_MODEL`).
- `lib/limite.ts`: límite de solicitudes en memoria por IP.
- `lib/formato.ts`: precios en COP y nivel de existencias. `lib/types.ts`: tipos compartidos.
- `data/productos.json`: 300 productos ficticios (`verificado: false`), generados por
  `scripts/generar-productos.mjs`. `data/categorias.json`: categorías reales del sitio.
  `data/preguntas.json`: preguntas frecuentes con fuente, fecha y marca `verificado`, y temas sin información.
- `scripts/probar.sh`: envía mensajes sueltos a `/api/chat` (requiere `npm run dev`).
- `scripts/indexar.mjs` (`npm run indexar`): genera el índice con `OPENAI_EMBEDDING_MODEL` (512 dimensiones). Embebe solo
  nombre + subcategoría + categoría + frase de uso; la marca ficticio/verificado va como metadato. Repetir tras cambiar
  `data/productos.json` o `data/preguntas.json`.
- `scripts/evaluar.mjs` (`npm run evaluar`): 15 casos de comportamiento contra el servidor en marcha, incluidos casos
  de varios turnos (`mensajes`, con `porTurno` y `enCadaTurno`). El modelo no es determinista: correr varias veces.

## Docker

- `Dockerfile` multi-etapa (`node:22-alpine`): deps → build (`output: "standalone"`) → runner con usuario `node`
  (uid 1000) y `HEALTHCHECK` contra `/api/salud`. `next.config.ts` incluye el índice con `outputFileTracingIncludes`.
- `docker-compose.yml`: servicio `chatbot`, imagen `chatbot-demo`, `env_file: .env.local` (nunca entra en la imagen),
  sistema de archivos de solo lectura, `cap_drop: ALL` y `no-new-privileges`.
- `.dockerignore` excluye `.env*`, `node_modules`, `.next` y `.git`.
- Levantar: `docker compose up --build`; detener: `docker compose down`. Detener antes `npm run dev` (puerto 3000).

## Comandos

- `npm run dev`, `npm run build`, `npm run lint`, `npx tsc --noEmit`, `npm run indexar`, `npm run evaluar`.

Mantener esta sección de estructura al día al cerrar cada fase.
