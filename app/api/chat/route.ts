import OpenAI from "openai";
import { NextResponse } from "next/server";
import { buscarPreguntas, buscarProductos, detectarTemasSinInformacion } from "@/lib/datos";
import { permitirSolicitud } from "@/lib/limite";
import { LIMITES, WHATSAPP } from "@/lib/config";
import { claveConfigurada, obtenerCliente, obtenerModelo } from "@/lib/openai";
import { INSTRUCCIONES, construirContexto, consultaDeBusqueda } from "@/lib/prompt";
import { recuperar } from "@/lib/rag";
import { HERRAMIENTAS, ejecutarHerramienta } from "@/lib/herramientas";
import type { Producto, RespuestaChat } from "@/lib/types";

const MAX_VUELTAS = 10;

type Entrada = { role: "user" | "assistant"; content: string };

function validarMensajes(cuerpo: unknown): Entrada[] | null {
  if (typeof cuerpo !== "object" || cuerpo === null) return null;

  const mensajes = (cuerpo as { messages?: unknown }).messages;
  if (!Array.isArray(mensajes) || mensajes.length === 0 || mensajes.length > LIMITES.maxMensajes) {
    return null;
  }

  const limpios: Entrada[] = [];
  for (const m of mensajes) {
    if (typeof m !== "object" || m === null) return null;

    const { role, content } = m as { role?: unknown; content?: unknown };
    const rol = role === "user" || role === "assistant" ? role : null;
    if (!rol || typeof content !== "string") return null;

    const texto = content.trim();
    const maximo = rol === "user" ? LIMITES.maxCaracteresUsuario : LIMITES.maxCaracteresAsistente;
    if (texto.length === 0 || texto.length > maximo) return null;

    limpios.push({ role: rol, content: texto });
  }

  if (limpios[limpios.length - 1].role !== "user") return null;
  return limpios;
}

// Modo de respaldo cuando no hay clave de OpenAI: respuesta simulada con el buscador local.
function responderSimulado(consulta: string): RespuestaChat {
  const preguntas = buscarPreguntas(consulta, 2);
  const temas = detectarTemasSinInformacion(consulta);
  const productos = buscarProductos(consulta, 3);
  const partes: string[] = [];

  for (const p of preguntas) partes.push(p.respuesta);

  if (temas.length > 0) {
    partes.push(
      `No tengo información verificada sobre: ${temas.join(", ")}. Te recomiendo consultarlo por el WhatsApp publicado de la tienda (${WHATSAPP}).`
    );
  }

  if (productos.length > 0) {
    partes.push("Encontré esto en el catálogo de demostración:");
  }

  if (partes.length === 0) {
    partes.push(
      `No encontré información sobre eso. Puedes preguntarme por productos, compra mínima, cobertura o domicilios, o consultar el WhatsApp publicado de la tienda (${WHATSAPP}).`
    );
  }

  return { respuesta: partes.join("\n\n"), productos, simulada: true };
}

// Quita Markdown que la interfaz no muestra y deja los precios con punto de miles ($28.000).
function limpiarTexto(texto: string): string {
  return texto
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/\$\s?(\d{1,3}(?:,\d{3})+)/g, (_m, n: string) => `$${n.replace(/,/g, ".")}`)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Quita la línea "PRODUCTOS: ..." y devuelve solo productos conocidos. Si el modelo la omite,
// detecta los nombres de producto escritos en el texto.
function separarProductos(bruto: string, permitidos: Producto[]) {
  const linea = bruto.match(/PRODUCTOS:[ \t]*([^\n]*)/);
  const ids = linea ? linea[1].split(/[\s,;]+/).filter(Boolean) : [];
  let elegidos = ids
    .map((id) => permitidos.find((p) => p.id === id))
    .filter((p): p is Producto => Boolean(p));

  const texto = limpiarTexto(bruto.replace(/[ \t]*PRODUCTOS:[^\n]*/g, ""));

  if (elegidos.length === 0) {
    const minusculas = texto.toLowerCase();
    elegidos = permitidos.filter((p) =>
      minusculas.includes(p.nombre.replace("[Demo] ", "").toLowerCase())
    );
  }

  const unicos = elegidos.filter((p, i, arr) => arr.indexOf(p) === i).slice(0, 3);
  return { texto, productos: unicos };
}

function describirError(e: unknown): { status: number; mensaje: string } {
  if (e instanceof OpenAI.APIError) {
    if (e.status === 401) return { status: 502, mensaje: "El servicio de IA no está configurado correctamente." };
    if (e.status === 404) return { status: 502, mensaje: "El modelo de IA configurado no está disponible." };
    if (e.status === 429) {
      return { status: 503, mensaje: "El servicio de IA está ocupado o sin cupo. Inténtalo más tarde." };
    }
  }
  if (e instanceof OpenAI.APIConnectionTimeoutError) {
    return { status: 504, mensaje: "El asistente tardó demasiado en responder. Inténtalo de nuevo." };
  }
  if (e instanceof OpenAI.APIConnectionError) {
    return { status: 502, mensaje: "No pude conectarme con el servicio de IA. Inténtalo de nuevo." };
  }
  return { status: 500, mensaje: "No pude responder en este momento. Inténtalo de nuevo." };
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

  if (!permitirSolicitud(ip)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo." },
      { status: 429 }
    );
  }

  const cuerpo: unknown = await request.json().catch(() => null);
  const mensajes = validarMensajes(cuerpo);

  if (!mensajes) {
    return NextResponse.json(
      { error: `Mensaje no válido. Máximo ${LIMITES.maxCaracteresUsuario} caracteres por mensaje.` },
      { status: 400 }
    );
  }

  const ultimo = mensajes[mensajes.length - 1];

  if (!claveConfigurada()) {
    return NextResponse.json(responderSimulado(ultimo.content));
  }

  const usuarios = mensajes.filter((m) => m.role === "user").map((m) => m.content);
  const recuperados = await recuperar(consultaDeBusqueda(usuarios));
  console.log(`[rag] modo: ${recuperados.modo}, ${recuperados.ms} ms`);

  const conocidos = new Map<string, Producto>();
  recuperados.productos.forEach((p) => conocidos.set(p.id, p));

  const input: OpenAI.Responses.ResponseInputItem[] = mensajes.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const cliente = obtenerCliente();
    const instrucciones = `${INSTRUCCIONES}\n\n${construirContexto(recuperados)}`;
    let bruto = "";

    for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
      const r = await cliente.responses.create({
        model: obtenerModelo(),
        instructions: instrucciones,
        input,
        tools: HERRAMIENTAS,
        parallel_tool_calls: false,
        max_output_tokens: 1500,
        store: false,
      });

      const llamadas = r.output.filter(
        (item): item is OpenAI.Responses.ResponseFunctionToolCall => item.type === "function_call"
      );

      if (llamadas.length === 0) {
        bruto = r.output_text?.trim() ?? "";
        break;
      }

      for (const llamada of llamadas) {
        console.log("[chat] herramienta:", llamada.name);
        input.push({
          type: "function_call",
          call_id: llamada.call_id,
          name: llamada.name,
          arguments: llamada.arguments,
        });

        const resultado = await ejecutarHerramienta(llamada.name, llamada.arguments);
        resultado.productos.forEach((p) => conocidos.set(p.id, p));

        input.push({
          type: "function_call_output",
          call_id: llamada.call_id,
          output: JSON.stringify(resultado.salida),
        });
      }
    }

    const { texto, productos } = separarProductos(bruto, Array.from(conocidos.values()));

    if (!texto) {
      return NextResponse.json(
        { error: "El asistente no pudo generar una respuesta. Inténtalo de nuevo." },
        { status: 502 }
      );
    }

    // Los datos del catálogo son ficticios: si el modelo no lo aclaró, se agrega la nota.
    const aviso =
      productos.length > 0 && !/demostraci[oó]n/i.test(texto)
        ? "\n\nProductos, precios y existencias de demostración (ficticios)."
        : "";

    const salida: RespuestaChat = {
      respuesta: texto + aviso,
      productos,
      simulada: false,
    };
    return NextResponse.json(salida, {
      headers: { "X-Recuperacion": `${recuperados.modo}; ${recuperados.ms}ms` },
    });
  } catch (e) {
    const { status, mensaje } = describirError(e);
    console.error(
      "[chat] Error de OpenAI:",
      e instanceof OpenAI.APIError ? `${e.status} ${e.message}` : e instanceof Error ? e.message : e
    );
    return NextResponse.json({ error: mensaje }, { status });
  }
}