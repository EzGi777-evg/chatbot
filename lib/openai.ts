import OpenAI from "openai";

let cliente: OpenAI | null = null;

export function claveConfigurada(): boolean {
  return Boolean(process.env.OPENAI_API_KEY) && Boolean(process.env.OPENAI_MODEL);
}

export function obtenerModelo(): string {
  return process.env.OPENAI_MODEL ?? "";
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