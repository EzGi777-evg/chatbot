import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Migas from "@/components/Migas";
import {
  categoriaPorSlug,
  categorias,
  productosDeSubcategoria,
  rutaSubcategoria,
  subcategoriasDe,
} from "@/lib/datos";
import styles from "../catalogo.module.css";

// Solo existen las 7 categorías del catálogo; cualquier otro slug es 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return categorias.map((c) => ({ categoria: c.id }));
}

export async function generateMetadata(props: PageProps<"/categoria/[categoria]">): Promise<Metadata> {
  const { categoria: slug } = await props.params;
  const categoria = categoriaPorSlug(slug);
  if (!categoria) return {};
  return {
    title: `${categoria.nombre} · Catálogo de demostración`,
    description: `Subcategorías de ${categoria.nombre} en un catálogo ficticio de demostración. No es la tienda oficial de BERPA.`,
  };
}

export default async function PaginaCategoria(props: PageProps<"/categoria/[categoria]">) {
  const { categoria: slug } = await props.params;
  const categoria = categoriaPorSlug(slug);
  if (!categoria) notFound();

  const subs = subcategoriasDe(categoria);

  return (
    <main className={styles.main}>
      <Migas migas={[{ nombre: "Inicio", ruta: "/" }, { nombre: categoria.nombre }]} />
      <h1 className={styles.titulo}>{categoria.nombre}</h1>
      <p className={styles.nota}>
        {subs.length} subcategorías. Los productos, precios y existencias son ficticios, de demostración.
      </p>

      <ul className={styles.subcategorias}>
        {subs.map((s) => {
          const total = productosDeSubcategoria(s).length;
          return (
            <li key={s.slug}>
              <Link href={rutaSubcategoria(s)} className={styles.subcategoria}>
                <span className={styles.subcategoriaNombre}>{s.nombre}</span>
                <span className={styles.conteo}>
                  {total} {total === 1 ? "producto" : "productos"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
