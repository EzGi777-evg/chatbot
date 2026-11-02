import Header from "@/components/Header";
import CategoryExplorer from "@/components/CategoryExplorer";
import ProductCard from "@/components/ProductCard";
import Chatbot from "@/components/Chatbot";
import { categorias, productos } from "@/lib/datos";
import type { Producto } from "@/lib/types";
import styles from "./page.module.css";

const destacados = categorias
  .map((c) => productos.find((p) => p.categoria === c.id))
  .filter((p): p is Producto => Boolean(p));

export default function Home() {
  return (
    <>
      <div className={styles.aviso}>
        Demostración independiente. No es la tienda oficial de BERPA ni está conectada a ella.
      </div>
      <Header />
      <CategoryExplorer categorias={categorias} />

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

      <footer className={styles.footer}>
        Prototipo con fines ilustrativos, sin afiliación con BERPA. Los productos, precios y existencias
        mostrados son ficticios y deben verificarse antes de cualquier uso comercial.
      </footer>

      <Chatbot />
    </>
  );
}