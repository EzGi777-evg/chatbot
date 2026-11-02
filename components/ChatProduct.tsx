import type { Producto } from "@/lib/types";
import { describirExistencias, formatearPrecio } from "@/lib/formato";
import styles from "./ChatProduct.module.css";

export default function ChatProduct({ producto }: { producto: Producto }) {
  const existencias = describirExistencias(producto.existencias);

  return (
    <div className={styles.card}>
      {producto.imagen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.img} src={producto.imagen} alt={producto.nombre} />
      ) : (
        <div className={styles.thumb} aria-hidden="true">📦</div>
      )}
      <div className={styles.info}>
        <strong className={styles.name}>{producto.nombre}</strong>
        <span className={styles.sub}>{producto.subcategoria}</span>
        <span className={styles.price}>{formatearPrecio(producto.precio)}</span>
        <span className={`${styles.stock} ${styles[existencias.nivel]}`}>{existencias.texto}</span>
      </div>
    </div>
  );
}