import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Migas from "@/components/Migas";
import ProductCard from "@/components/ProductCard";
import { productosDeSubcategoria, rutaCategoria, subcategoriaPorSlugs, subcategorias } from "@/lib/datos";
import styles from "../../catalogo.module.css";

// Solo existen los 60 pares categoría + subcategoría del catálogo; cualquier otro es 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return subcategorias.map((s) => ({ categoria: s.categoria.id, subcategoria: s.slug }));
}

export async function generateMetadata(
  props: PageProps<"/categoria/[categoria]/[subcategoria]">
): Promise<Metadata> {
  const { categoria, subcategoria } = await props.params;
  const sub = subcategoriaPorSlugs(categoria, subcategoria);
  if (!sub) return {};
  return {
    title: `${sub.nombre} · ${sub.categoria.nombre} · Catálogo de demostración`,
    description: `Productos ficticios de ${sub.nombre} (${sub.categoria.nombre}) en un catálogo de demostración. No es la tienda oficial de BERPA.`,
  };
}

export default async function PaginaSubcategoria(props: PageProps<"/categoria/[categoria]/[subcategoria]">) {
  const { categoria, subcategoria } = await props.params;
  const sub = subcategoriaPorSlugs(categoria, subcategoria);
  if (!sub) notFound();

  const lista = productosDeSubcategoria(sub);
  const ruta = rutaCategoria(sub.categoria);

  return (
    <main className={styles.main}>
      <Migas
        migas={[
          { nombre: "Inicio", ruta: "/" },
          { nombre: sub.categoria.nombre, ruta },
          { nombre: sub.nombre },
        ]}
      />
      <h1 className={styles.titulo}>{sub.nombre}</h1>
      <Link href={ruta} className={styles.volver}>
        ← Volver a {sub.categoria.nombre}
      </Link>
      <p className={styles.nota}>
        {lista.length} productos. Nombres, precios y existencias son ficticios, de demostración, y no reflejan el
        inventario real de la tienda.
      </p>

      <div className={styles.productos}>
        {lista.map((p) => (
          <ProductCard key={p.id} producto={p} />
        ))}
      </div>
    </main>
  );
}
