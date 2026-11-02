import { NextResponse } from "next/server";
import { buscarProductos, buscarPreguntas, detectarTemasSinInformacion } from "@/lib/datos";
import { buscarSemantico } from "@/lib/rag";

// Endpoint temporal de depuración: compara el buscador por palabras con el semántico. Se elimina en la fase 4.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.slice(0, 200) ?? "";

  if (!q.trim()) {
    return NextResponse.json({ error: "Falta el parámetro q" }, { status: 400 });
  }

  const inicio = performance.now();
  const semantico = await buscarSemantico(q, 5, 3);
  const ms = Math.round(performance.now() - inicio);

  return NextResponse.json({
    consulta: q,
    palabras: {
      productos: buscarProductos(q).map((p) => p.nombre),
      preguntas: buscarPreguntas(q).map((p) => p.id),
    },
    semantico: semantico && {
      ms,
      productos: semantico.productos.map((x) => `${x.f.texto.split(".")[0]} (${x.puntaje.toFixed(3)})`),
      preguntas: semantico.preguntas.map((x) => `${x.f.id} (${x.puntaje.toFixed(3)})`),
    },
    temasSinInformacion: detectarTemasSinInformacion(q),
  });
}
