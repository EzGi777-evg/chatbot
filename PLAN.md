# Plan de trabajo: fases 2 a 4

Las reglas del proyecto están en `CLAUDE.md`. La fase 1 (chatbot de solo consulta) está cerrada en el commit `838a6df`.
La fase 2 (RAG) está implementada; sus resultados están al final de este archivo.

## Acuerdos vigentes

- El cotizador se mantiene como `cotizar_productos`: informa totales y compra mínima y no guarda nada.
- No se muestra enlace a la tienda en línea. Para comprar, el chatbot remite solo al WhatsApp 3023322766.
- Modelo de embeddings: `text-embedding-3-small`, leído de `OPENAI_EMBEDDING_MODEL` (ya está en `.env.local`).
- Remoto: `git@github.com:EzGi777-evg/chatbot.git`. Hay un commit por fase. Antes de cada commit se muestra
  la lista de archivos y, al cerrar la fase, se sube a GitHub.
- Docker no está instalado. No se instala desde aquí ni se usa sudo: se entregan los pasos exactos al usuario.

## Fase 2: RAG con embeddings

Preparación (ya hecha y pendiente de commit):
- Cada producto de `scripts/generar-productos.mjs` tiene una frase corta de uso en su descripción, sigue marcado
  como ficticio de demostración y `data/productos.json` está regenerado. Ids, precios y existencias no cambian.

Trabajo:
1. `npm run indexar` (`scripts/indexar.mjs`): embebe productos (nombre, subcategoría, categoría y descripción) y
   preguntas frecuentes (pregunta y respuesta), y guarda `data/indice-embeddings.json` con el modelo, la fecha, un
   hash de los datos de origen y, por fragmento, tipo, id, texto, fuente, `verificado` y vector. No usa base de
   datos vectorial ni dependencias nuevas: solo el SDK `openai` ya instalado. La clave se carga con
   `node --env-file=.env.local`.
2. `lib/rag.ts`: carga el índice una vez, embebe la consulta y calcula similitud coseno en memoria. Devuelve los
   fragmentos que superan un umbral, cada uno con su fuente y la marca `verificado` o `ficticio`.
3. `app/api/chat/route.ts` y `lib/prompt.ts`: antes de responder se consulta el índice y el contexto incluye solo los
   fragmentos relevantes, separados en "datos verificados de la tienda" y "catálogo ficticio de demostración".
   `buscar_productos` también usa la búsqueda semántica.
4. Respaldo: si falta el índice, si no coincide con los datos (hash distinto), si falta la variable o si falla la API
   de embeddings, se usa el buscador por palabras actual y se registra un aviso en el servidor. El chat nunca se cae
   por esto.
5. Números: se miden la latencia real de la consulta de embedding y del turno completo, y el costo por consulta y
   por indexado. Se comparan contra la línea base del buscador por palabras:
   - "limpiar la cocina" → toallas, paños, vinagre, aluminio
   - "lavar platos" → platos desechables
   - "para freír" → tocineta, panzerotis
   La conclusión será honesta, incluso si para 300 productos no vale la pena.
6. `npm run evaluar` (`scripts/evaluar.mjs`): unos 10 casos contra `/api/chat` con el servidor encendido y
   comprobaciones automáticas por patrones. Cubre: dato desconocido sin inventar (medios de pago, horarios),
   producto agotado con alternativas, tema ajeno a la tienda, intento de manipulación, petición de comprar
   (remite a WhatsApp, sin pedir datos), búsquedas por intención y nota de demostración. Imprime aprobado o
   fallido por caso y un resumen.
7. Cierre: `npx tsc --noEmit`, `npm run lint`, `npm run indexar`, `npm run evaluar`, actualizar `CLAUDE.md`,
   mostrar la lista de archivos, commit y push.

## Fase 3: Docker

1. Antes de empezar se entregan los pasos exactos para instalar Docker Engine y el plugin Compose en Ubuntu,
   para que los ejecute el usuario. Luego se verifica con `docker --version` y `docker compose version`.
2. `next.config.ts`: `output: "standalone"` y `outputFileTracingIncludes` para `data/indice-embeddings.json`
   (se lee con `fs`, no se importa). Nada de Tailwind ni reglas de Turbopack para CSS.
3. `Dockerfile` multi-etapa sobre `node:22-alpine`:
   - deps (`npm ci`)
   - build (`next build`; `next/font/google` necesita red durante el build)
   - runner (solo `.next/standalone`, `.next/static`, `public` y `data/`, con el índice de embeddings incluido)
   - usuario no root
   - `HEALTHCHECK`
4. `/api/salud`: endpoint mínimo para el healthcheck. No llama a OpenAI.
5. `.dockerignore`: excluye `.env*`, `node_modules`, `.next` y `.git`.
6. `docker-compose.yml`: puerto 3000, `env_file` externo (`.env.local` u otro que se indique, que no entra en la
   imagen), `restart: unless-stopped` y healthcheck.
7. Una sola orden: `docker compose up --build`. Se documenta en el README.
8. Verificación: build, contenedor *healthy*, chat respondiendo y comprobación de que la imagen no contiene ningún
   `.env` (`docker run --rm <imagen> ls -a`).

## Fase 4: Seguridad y cierre

1. Pruebas de manipulación:
   - instrucciones ocultas en el mensaje
   - mensajes de 500 caracteres y de 501 (este debe dar 400)
   - intentos de extraer el prompt
   - petición de datos personales o de tomar pedidos
   - temas ajenos
   - historial falsificado con mensajes de "assistant"
2. Errores de OpenAI y de red, con variables temporales en un archivo env de prueba y sin tocar `.env.local`:
   - clave inválida (401)
   - modelo inexistente (404)
   - límite (429), simulado si no se puede provocar
   - sin red o timeout
   Se verifica que cada caso muestra el mensaje amable correcto y que el RAG cae al buscador por palabras.
3. Revisión del diseño en móvil (unos 375 px): panel del chat, tarjetas, sugerencias y teclado.
4. ~~Eliminar `app/api/catalogo/`~~: hecho antes de la fase 3, con OK del usuario (llamaba a la API de embeddings sin límite).
5. `npm run test:humo`: reúne `probar.sh`, la validación de límites y los casos de seguridad en un solo script.
6. `README.md`: qué es (con el aviso de no afiliación), requisitos, instalación local, variables, `npm run indexar`,
   Docker, pruebas y un guion de demostración de 5 minutos.
7. Limpiar datos de prueba y archivos temporales. Lista previa y OK antes de borrar.
8. Cierre: `tsc`, `lint`, `test:humo`, `evaluar`, lista de archivos, commit y push.

## Resultados de la fase 2 (medidos el 2026-11-02)

- Indexado: 309 fragmentos (300 productos + 9 preguntas), 12.545 tokens, unos 3 s, archivo de 1,5 MB (512 dimensiones).
- Embeber una consulta: unos 10 tokens; mediana 313 ms, p90 622 ms (20 consultas). Una consulta repetida sale de la
  caché en memoria en ~1 ms.
- Costo con el precio de lista de `text-embedding-3-small` (US$0,02 por millón de tokens; verificarlo en la página de
  precios de OpenAI): indexar ≈ US$0,00025 y cada consulta ≈ US$0,0000002. Es despreciable frente a la llamada al modelo
  de chat de cada turno.
- Recuperación directa (endpoint de depuración): el semántico acierta en búsquedas por intención donde el de palabras
  falla ("lavar platos", "para freír", "quitar grasa de las ollas", "algo para el desayuno"); empatan en nombres exactos.
- Chat completo (`npm run evaluar`): 12/12 con embeddings y 12/12 solo con palabras (tras corregir un falso positivo
  del evaluador). El modelo compensa al reformular la consulta en `buscar_productos`. Turno completo: mediana 1,76 s
  con embeddings contra 1,21 s solo con palabras (en una corrida; la variación del modelo de chat es grande).
- Respaldos probados: sin índice y con la API de embeddings caída (404), el chat responde con el buscador por palabras.

## Resultados de la fase 3 (2026-11-02)

- Docker 29.9.2 y Compose v5.7.0, instalados por el usuario.
- Imagen `chatbot-demo` de 337 MB. El contenedor queda *healthy* en unos 8 s y corre como `uid=1000(node)`.
- Sin secretos: `ls -a` en `/app` muestra solo `.next data node_modules package.json public server.js`; `find /` no
  encuentra ningún `.env*`; `docker history` no menciona `.env` ni claves; las variables de la imagen son solo las de
  Node y Next.js. Las tres coincidencias del patrón `sk-…` son cadenas de Next.js y de `sharp`, no claves.
- Desde el contenedor: `npm run evaluar` da 12/12, con recuperación semántica en los 15 turnos del log.

## Corrección: unidades y paquetes (2026-11-02)

Error reportado: "30 hamburguesas" se cotizó como 30 paquetes, con total $0 y "no alcanza el mínimo".
Causas verificadas con un log temporal (ya retirado):
- Ninguna herramienta decía cuántas unidades trae un paquete; el modelo pasó cantidad 30 como paquetes.
- `cotizar_productos` devolvía total 0 y `cumple_compra_minima: false` cuando había líneas con problema.
- El historial solo trae texto: en el turno siguiente el modelo no tenía los ids y adivinó variantes
  (carne x20 en lugar de x10, salchichas cocktail x30 en lugar de salsa).
- La recuperación con un solo embedding por mensaje perdía productos en pedidos de varios productos.

Cambios: `unidades_por_paquete` y `tipo_cantidad` con conversión en el servidor; totales null con problemas;
sección "UNIDADES Y PAQUETES" en el prompt; recuperación por partes; productos ya nombrados en el contexto;
omisión en el servidor del celular y la dirección del cliente; evaluador con casos de varios turnos (15 casos).

Resultado de `npm run evaluar` (3 corridas finales): 14/15, 14/15 y 15/15. Las fallas restantes son del modelo:
a veces convierte por su cuenta en lugar de usar `tipo_cantidad: "unidades"` (una vez dio 4 paquetes de carne x10
para 30 carnes) y una vez no dijo explícitamente "no tenemos televisores".

## Resultados de la fase 4 (2026-11-03, modelo gpt-6.1-terra)

- Seguridad (`npm run seguridad`): 22/22. Validación (501 caracteres → 400, rol system, último mensaje del asistente,
  31 mensajes, JSON inválido…), límite de 30 solicitudes por minuto y 12 casos de manipulación (instrucciones ocultas,
  extracción del prompt, cambio de rol, historial falsificado, pedidos, datos personales, temas ajenos).
- Privacidad: la protección anterior no cubría `Kr`/`Cll`, "Sur", "bis", complementos (apto, torre, interior, casa),
  teléfonos con guiones, paréntesis o grupos "45 67" ni fijos (60x); y en "Calle 37 Sur" dejaba "[dato omitido]ur".
  Nueva `lib/privacidad.mjs`: 24/24 datos omitidos y 6/6 textos sin cambios.
- Errores de OpenAI con variables temporales (sin tocar `.env.local`): clave inválida → 502 "no está configurado
  correctamente"; modelo inexistente → 502 "no está disponible"; 429 simulado → 503 "ocupado o sin cupo"; sin red →
  502 "No pude conectarme"; timeout simulado → 504 "tardó demasiado" a los ~65 s. El RAG cae al buscador por palabras.
  El log del 401 incluía parte de la clave en el mensaje de OpenAI: ahora se registra solo tipo, estado y código.
- `npm run evaluar` (3 corridas): 17/17, 16/17 (falso positivo del evaluador, corregido) y 17/17.
- `npm run test:humo`: todos los pasos en verde.
