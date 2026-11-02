"use client";

import { useState } from "react";
import type { Categoria } from "@/lib/types";
import styles from "./CategoryExplorer.module.css";

export default function CategoryExplorer({ categorias }: { categorias: Categoria[] }) {
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
          <div className={styles.grid}>
            {activa.subcategorias.map((s) => (
              <div key={s} className={styles.card}>{s}</div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}