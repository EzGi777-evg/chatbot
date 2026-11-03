import type { Metadata } from "next";
import Link from "next/link";
import styles from "./categoria/catalogo.module.css";

export const metadata: Metadata = { title: "Página no encontrada" };

export default function NoEncontrada() {
  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Página no encontrada</h1>
      <p className={styles.nota}>La dirección no corresponde a ninguna página de esta demostración.</p>
      <Link href="/" className={styles.volver}>
        ← Ir al inicio
      </Link>
    </main>
  );
}
