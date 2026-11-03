import CategoryExplorer from "@/components/CategoryExplorer";
import ProductCard from "@/components/ProductCard";
import { categorias, productos, rutaCategoria, rutaSubcategoria, subcategoriasDe } from "@/lib/datos";
import type { Producto } from "@/lib/types";
import styles from "./page.module.css";

const destacados = categorias
  .map((c) => productos.find((p) => p.categoria === c.id))
  .filter((p): p is Producto => Boolean(p));

// La franja recibe datos simples (sin funciones) porque es un componente de cliente.
const franja = categorias.map((c) => ({
  ...c,
  ruta: rutaCategoria(c),
  enlaces: subcategoriasDe(c).map((s) => ({ nombre: s.nombre, ruta: rutaSubcategoria(s) })),
}));

export default function Home() {
  return (
    <>
      <CategoryExplorer categorias={franja} />

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1>Asistente virtual de demostración</h1>
          <p>Pregunta por productos, categorías y más con el botón de chat.</p>
        </section>

        <section aria-labelledby="destacados">
          <h2 id="destacados" className={styles.sectionTitle}>Productos destacados</h2>
          <div className={styles.grid}>
            {destacados.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
