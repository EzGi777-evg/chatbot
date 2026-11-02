import { NextResponse } from "next/server";
import { buscarProductos, buscarPreguntas, detectarTemasSinInformacion } from "@/lib/datos";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.slice(0, 200) ?? "";

  if (!q.trim()) {
    return NextResponse.json({ error: "Falta el parámetro q" }, { status: 400 });
  }

  return NextResponse.json({
    consulta: q,
    productos: buscarProductos(q).map((p) => ({
      nombre: p.nombre,
      precio: p.precio,
      existencias: p.existencias,
    })),
    preguntas: buscarPreguntas(q).map((p) => p.id),
    temasSinInformacion: detectarTemasSinInformacion(q),
  });
}