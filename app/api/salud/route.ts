import { NextResponse } from "next/server";

// Healthcheck del contenedor: no llama a OpenAI ni expone datos internos.
export function GET() {
  return NextResponse.json({ ok: true });
}
