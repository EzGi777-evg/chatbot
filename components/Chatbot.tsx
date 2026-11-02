"use client";

import { useEffect, useRef, useState } from "react";
import ChatProduct from "./ChatProduct";
import { LIMITES } from "@/lib/config";
import type { MensajeChat, RespuestaChat } from "@/lib/types";
import styles from "./Chatbot.module.css";

const BIENVENIDA =
  "¡Hola! Soy el asistente virtual de demostración. Puedo responder preguntas sobre la tienda: productos, precios y existencias de ejemplo, domicilios, cobertura, compra mínima y contacto. No tomo pedidos. Los productos, precios y existencias de esta demostración son ficticios.";

const SUGERENCIAS = [
  "¿Cuál es la compra mínima?",
  "¿Hay aceite vegetal?",
  "¿Cuánto cuesta el domicilio?",
  "Busco algo para limpiar la cocina",
];

export default function Chatbot() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, cargando, error, abierto]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function pedirRespuesta(historial: MensajeChat[]) {
    abortRef.current?.abort();
    const controlador = new AbortController();
    abortRef.current = controlador;
    setCargando(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historial.map(({ role, content }) => ({ role, content })),
        }),
        signal: controlador.signal,
      });

      const datos = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          typeof datos?.error === "string" ? datos.error : "No pude responder en este momento."
        );
      }
      if (!datos || typeof datos.respuesta !== "string") {
        throw new Error("Recibí una respuesta inesperada del servidor.");
      }

      const r = datos as RespuestaChat;
      setMensajes([
        ...historial,
        {
          role: "assistant",
          content: r.respuesta,
          productos: r.productos,
          simulada: r.simulada,
        },
      ]);
    } catch (e) {
      if (controlador.signal.aborted) return;
      setError(
        e instanceof Error && !(e instanceof TypeError)
          ? e.message
          : "No pude conectarme con el servidor. Revisa tu conexión e inténtalo de nuevo."
      );
    } finally {
      if (abortRef.current === controlador) setCargando(false);
    }
  }

  function enviar(contenido: string) {
    const limpio = contenido.trim();
    if (!limpio || cargando) return;

    if (mensajes.length >= LIMITES.maxMensajes - 1) {
      setError("La conversación llegó a su límite. Inicia una nueva conversación para continuar.");
      return;
    }

    const historial: MensajeChat[] = [...mensajes, { role: "user", content: limpio }];
    setMensajes(historial);
    setTexto("");
    void pedirRespuesta(historial);
  }

  function reintentar() {
    if (!cargando) void pedirRespuesta(mensajes);
  }

  function nuevaConversacion() {
    abortRef.current?.abort();
    abortRef.current = null;
    setMensajes([]);
    setTexto("");
    setError(null);
    setCargando(false);
  }

  const ultimoEsUsuario = mensajes.length > 0 && mensajes[mensajes.length - 1].role === "user";

  return (
    <>
      {abierto && (
        <section className={styles.panel} role="dialog" aria-label="Asistente virtual de demostración">
          <header className={styles.header}>
            <div className={styles.titulo}>
              <strong>Asistente virtual</strong>
              <span className={styles.demo}>Demostración independiente</span>
            </div>
            <button type="button" className={styles.nueva} onClick={nuevaConversacion}>
              Nueva conversación
            </button>
          </header>

          <div className={styles.mensajes} aria-live="polite">
            <div className={`${styles.fila} ${styles.filaBot}`}>
              <div className={`${styles.burbuja} ${styles.bot}`}>{BIENVENIDA}</div>
            </div>

            {mensajes.length === 0 && (
              <div className={styles.sugerencias}>
                {SUGERENCIAS.map((s) => (
                  <button key={s} type="button" className={styles.chip} onClick={() => enviar(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`${styles.fila} ${m.role === "user" ? styles.filaUsuario : styles.filaBot}`}
              >
                <div className={`${styles.burbuja} ${m.role === "user" ? styles.usuario : styles.bot}`}>
                  {m.content}
                </div>
                {m.productos && m.productos.length > 0 && (
                  <div className={styles.productos}>
                    {m.productos.map((p) => (
                      <ChatProduct key={p.id} producto={p} />
                    ))}
                  </div>
                )}
                {m.simulada && <span className={styles.nota}>Respuesta simulada, sin IA</span>}
              </div>
            ))}

            {cargando && (
              <div className={`${styles.fila} ${styles.filaBot}`}>
                <div
                  className={`${styles.burbuja} ${styles.bot}`}
                  role="status"
                  aria-label="El asistente está escribiendo"
                >
                  <span className={styles.puntos}>
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className={styles.error} role="alert">
                <span>{error}</span>
                {ultimoEsUsuario && !cargando && (
                  <button type="button" className={styles.reintentar} onClick={reintentar}>
                    Reintentar
                  </button>
                )}
              </div>
            )}

            <div ref={finRef} />
          </div>

          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              enviar(texto);
            }}
          >
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={LIMITES.maxCaracteresUsuario}
              placeholder="Escribe tu mensaje…"
              aria-label="Mensaje"
              autoComplete="off"
            />
            <button type="submit" disabled={cargando || texto.trim().length === 0}>
              Enviar
            </button>
          </form>
          <p className={styles.pie}>
            Información de demostración. Verifica precios y datos antes de usarlos comercialmente.
          </p>
        </section>
      )}

      <button
        type="button"
        className={styles.fab}
        onClick={() => setAbierto(!abierto)}
        aria-label={abierto ? "Cerrar asistente" : "Abrir asistente virtual"}
      >
        {abierto ? "✕" : "💬"}
      </button>
    </>
  );
}
