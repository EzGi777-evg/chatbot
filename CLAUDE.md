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

- `app/layout.tsx`: estructura común a todas las páginas (aviso de no afiliación, `Header`, pie y `Chatbot`).
  El chat vive en el layout: su conversación y el panel abierto se conservan al navegar con enlaces (se pierden al
  recargar). `app/not-found.tsx`: 404 propia.
- `app/page.tsx`: inicio (franja de categorías con enlaces a subcategorías y "Ver toda la categoría", destacados).
- `app/categoria/[categoria]/page.tsx` y `app/categoria/[categoria]/[subcategoria]/page.tsx`: catálogo navegable,
  generado con `generateStaticParams` (7 + 60 páginas), `dynamicParams = false` (otro slug → 404), migas
  (`components/Migas.tsx`) y `generateMetadata`. La categoría usa su `id`; la subcategoría, `aSlug(nombre)`, y se
  identifica siempre por el par categoría + subcategoría ("Guantes, gorros y tapabocas" está en dos categorías).
- `lib/slug.mjs`: `aSlug`, única función de slug (JavaScript para que la usen también los scripts).
- `lib/privacidad.mjs`: `omitirDatosPersonales` (celulares y fijos de 10 dígitos con espacios, guiones, puntos o
  paréntesis; direcciones con abreviaturas, letra, bis, sur y complementos como apto o torre). Solo omite lo que el
  cliente escribió y nunca el WhatsApp de la tienda. JavaScript para probarla con `scripts/probar-privacidad.mjs`.
- `app/api/salud/route.ts`: healthcheck del contenedor; devuelve solo `{"ok": true}`.
- `app/api/chat/route.ts`: endpoint del chat. Valida mensajes, limita por IP, arma el contexto y ejecuta
  el ciclo de herramientas con la API Responses. Sin clave configurada responde en modo simulado
  con el buscador local. Si la respuesta trae productos y no dice "demostración", agrega la nota. Pasa al modelo los
  productos que el asistente ya nombró en turnos anteriores (el historial solo es texto) y reemplaza por
  "[dato omitido]" el teléfono o la dirección que el cliente haya escrito si el modelo los repite (`lib/privacidad.mjs`).
  Los errores de OpenAI se registran con `resumirError` (tipo, estado y código; nunca el mensaje, que en el 401 trae
  parte de la clave). Tarjetas: los
  productos de la línea `PRODUCTOS:` más los que el texto nombra exactamente, en orden de aparición, hasta 8
  (`MAX_TARJETAS`); el prompt limita a 3 solo las sugerencias no pedidas y las variantes de un mismo producto.
- `components/`: `Chatbot` (panel de chat), `ChatProduct` (tarjetas en el chat), `Header`, `CategoryExplorer`,
  `ProductCard` (precio, existencias con `describirExistencias`, agotados atenuados), `Migas`, cada uno con su
  `.module.css`.
- `lib/config.ts`: límites, WhatsApp y compra mínima ($80.000, sobre productos, sin domicilio).
- `lib/datos.ts`: carga de `data/*.json`, rutas del catálogo (`subcategorias`, `rutaCategoria`, `rutaSubcategoria`,
  `subcategoriaPorSlugs`, `productosDeSubcategoria`…) y buscador por palabras. Las páginas no leen los JSON.
- `lib/rag.ts`: búsqueda semántica sobre `data/indice-embeddings.json` por partes del mensaje (cada producto pedido
  y las partes del mensaje anterior del cliente, en paralelo e intercaladas; una parte sin resultados semánticos
  se busca por nombre con `buscarPorNombre`, p. ej. "ripio"; coseno en memoria, caché de consultas,
  pausa de 60 s tras una falla de la API). Si no hay índice válido o falla la API, usa el buscador por palabras.
  El índice se invalida solo si cambian productos o preguntas (hash) o el modelo.
- `lib/prompt.ts`: instrucciones del sistema y contexto por turno: solo los fragmentos recuperados, con su fuente y
  marca (VERIFICADO / SIN VERIFICAR / FICTICIO), más la lista de temas sin información.
- `lib/herramientas.ts`: herramientas del modelo (`buscar_productos`, `consultar_existencias` con alternativas,
  `cotizar_productos`, que solo informa y no guarda nada). Existencias y precios son por paquete;
  `unidades_por_paquete` sale del nombre (`xN`). `tipo_cantidad` "unidades" se convierte en el servidor con
  ceil(cantidad / unidades_por_paquete). Si una línea tiene problema, `total_productos_cop` y `cumple_compra_minima`
  son null (nunca 0/false) y hay `total_parcial_solo_lineas_validas_cop` y un motivo por línea. Protección de
  cantidades ambiguas: si el último mensaje del cliente no dice "paquete"/"unidad" ni la presentación (x12) y el
  modelo usa ese número como paquetes, o es una cantidad suelta ("quiero 2", "un quesito"), la herramienta
  devuelve un error que pide preguntar. `buscar_productos` cae a `buscarPorNombre` si el semántico no encuentra nada.
- `lib/openai.ts`: cliente, modelo (variables `OPENAI_API_KEY`, `OPENAI_MODEL`) y `resumirError` para los logs.
- `lib/limite.ts`: límite de solicitudes en memoria por IP.
- `lib/formato.ts`: precios en COP y nivel de existencias. `lib/types.ts`: tipos compartidos.
- `data/productos.json`: 300 productos ficticios (`verificado: false`), generados por
  `scripts/generar-productos.mjs`. `data/categorias.json`: categorías reales del sitio.
  `data/preguntas.json`: preguntas frecuentes con fuente, fecha y marca `verificado`, y temas sin información.
- `scripts/probar.sh`: envía mensajes sueltos a `/api/chat` (requiere `npm run dev`); código 1 si alguno falla.
- `scripts/probar-privacidad.mjs` (`npm run probar:privacidad`): 24 datos que se omiten y 6 textos que no se tocan.
- `scripts/seguridad.mjs` (`npm run seguridad`, con el servidor en marcha): validación (500/501 caracteres, roles,
  historial), límite de 30 solicitudes por minuto y 12 casos de manipulación del modelo.
- `scripts/humo.mjs` (`npm run test:humo`): privacidad, slugs, probar.sh, rutas, seguridad y evaluar, con resumen.
- `scripts/indexar.mjs` (`npm run indexar`): genera el índice con `OPENAI_EMBEDDING_MODEL` (512 dimensiones). Embebe solo
  nombre + subcategoría + categoría + frase de uso; la marca ficticio/verificado va como metadato. Repetir tras cambiar
  `data/productos.json` o `data/preguntas.json`.
- `scripts/probar-slugs.mjs` (`npm run probar:slugs`): los 60 pares sin colisiones y solo con `[a-z0-9-]`.
- `scripts/verificar-rutas.mjs` (`npm run verificar:rutas`, con el servidor en marcha): 67 rutas con HTTP 200,
  5 tarjetas por subcategoría (300), estructura común en cada página y 404 para rutas inventadas.
- `scripts/evaluar.mjs` (`npm run evaluar`): 17 casos de comportamiento contra el servidor en marcha, incluidos casos
  de varios turnos (`mensajes`, con `porTurno` y `enCadaTurno`). El modelo no es determinista: correr varias veces.

## Docker

- `Dockerfile` multi-etapa (`node:22-alpine`): deps → build (`output: "standalone"`) → runner con usuario `node`
  (uid 1000) y `HEALTHCHECK` contra `/api/salud`. `next.config.ts` incluye el índice con `outputFileTracingIncludes`.
- `docker-compose.yml`: servicio `chatbot`, imagen `chatbot-demo`, `env_file: .env.local` (nunca entra en la imagen),
  sistema de archivos de solo lectura, `cap_drop: ALL` y `no-new-privileges`.
- `.dockerignore` excluye `.env*`, `node_modules`, `.next` y `.git`.
- Levantar: `docker compose up --build`; detener: `docker compose down`. Detener antes `npm run dev` (puerto 3000).

## Comandos

- `npm run dev`, `npm run build`, `npm run lint`, `npx next typegen && npx tsc --noEmit` (los tipos `PageProps`
  se generan con typegen), `npm run indexar`, `npm run evaluar`, `npm run probar:slugs`, `npm run verificar:rutas`,
  `npm run probar:privacidad`, `npm run seguridad`, `npm run test:humo`.

Mantener esta sección de estructura al día al cerrar cada fase.
