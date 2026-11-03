import Link from "next/link";
import styles from "./Migas.module.css";

export type Miga = { nombre: string; ruta?: string };

// Ruta de migas: el último elemento es la página actual y no es enlace.
export default function Migas({ migas }: { migas: Miga[] }) {
  return (
    <nav aria-label="Ruta de navegación" className={styles.migas}>
      <ol>
        {migas.map((m, i) => (
          <li key={m.nombre}>
            {m.ruta && i < migas.length - 1 ? (
              <Link href={m.ruta}>{m.nombre}</Link>
            ) : (
              <span aria-current="page">{m.nombre}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
