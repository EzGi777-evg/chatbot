import OpenAI from "openai";

let cliente: OpenAI | null = null;

export function claveConfigurada(): boolean {
  return Boolean(process.env.OPENAI_API_KEY) && Boolean(process.env.OPENAI_MODEL);
}

export function obtenerModelo(): string {
  return process.env.OPENAI_MODEL ?? "";
}

// Para los logs: solo el estado y el código del error, nunca su mensaje (el de 401 incluye parte de la clave).
export function resumirError(e: unknown): string {
  if (e instanceof OpenAI.APIError) return `${e.constructor.name} ${e.status ?? ""} ${e.code ?? e.type ?? ""}`.trim();
  return e instanceof Error ? e.constructor.name : "error desconocido";
}

export function obtenerCliente(): OpenAI {
  if (!cliente) {
    cliente = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30_000,
      maxRetries: 1,
    });
  }
  return cliente;
}