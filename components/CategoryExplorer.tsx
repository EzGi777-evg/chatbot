"use client";

import { useState } from "react";
import Link from "next/link";
import type { Categoria } from "@/lib/types";
import styles from "./CategoryExplorer.module.css";

export type CategoriaFranja = Categoria & {
  ruta: string;
  enlaces: { nombre: string; ruta: string }[];
};

export default function CategoryExplorer({ categorias }: { categorias: CategoriaFranja[] }) {
  const [activaId, setActivaId] = useState<string | null>(null);
  const activa = categorias.find((c) => c.id === activaId) ?? null;

  return (
    <section aria-label="Categorías de productos">
      <div className={styles.strip}>
        {categorias.map((c) => (
          <button
            key={c.id}
            type="button"
            className={c.id === activaId ? styles.itemActive : styles.item}
            aria-pressed={c.id === activaId}
            onClick={() => setActivaId(c.id === activaId ? null : c.id)}
          >
            <span className={styles.icon} aria-hidden="true">{c.icono}</span>
            <span>{c.nombre}</span>
          </button>
        ))}
      </div>

      {activa && (
        <div className={styles.panel}>
          <h2 className={styles.title}>{activa.nombre}</h2>
          <p className={styles.verTodo}>
            <Link href={activa.ruta} className={styles.enlaceTodo}>
              Ver toda la categoría →
            </Link>
          </p>
          <ul className={styles.grid}>
            {activa.enlaces.map((s) => (
              <li key={s.ruta}>
                <Link href={s.ruta} className={styles.card}>
                  {s.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
