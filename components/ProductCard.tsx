import type { Producto } from "@/lib/types";
import { describirExistencias, formatearPrecio } from "@/lib/formato";
import styles from "./ProductCard.module.css";

export default function ProductCard({ producto }: { producto: Producto }) {
  const existencias = describirExistencias(producto.existencias);
  const agotado = existencias.nivel === "agotado";

  return (
    <article className={agotado ? `${styles.card} ${styles.cardAgotada}` : styles.card} data-tarjeta-producto={producto.id}>
      {producto.imagen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.image} src={producto.imagen} alt={producto.nombre} />
      ) : (
        <div className={styles.placeholder}>Imagen provisional</div>
      )}
      <div className={styles.body}>
        <h3 className={styles.name}>{producto.nombre}</h3>
        <p className={styles.desc}>{producto.descripcion}</p>
        <p className={styles.price}>{formatearPrecio(producto.precio)}</p>
        <p className={`${styles.stock} ${styles[existencias.nivel]}`}>{existencias.texto}</p>
        {!producto.verificado && <span className={styles.badge}>Dato de demostración</span>}
      </div>
    </article>
  );
}
