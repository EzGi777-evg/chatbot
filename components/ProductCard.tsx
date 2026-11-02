import type { Producto } from "@/lib/types";
import styles from "./ProductCard.module.css";

const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function ProductCard({ producto }: { producto: Producto }) {
  return (
    <article className={styles.card}>
      {producto.imagen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.image} src={producto.imagen} alt={producto.nombre} />
      ) : (
        <div className={styles.placeholder}>Imagen provisional</div>
      )}
      <div className={styles.body}>
        <h3 className={styles.name}>{producto.nombre}</h3>
        <p className={styles.desc}>{producto.descripcion}</p>
        <p className={styles.price}>
          {producto.precio !== null ? formatoCOP.format(producto.precio) : "Precio por verificar"}
        </p>
        {!producto.verificado && <span className={styles.badge}>Dato de demostración</span>}
      </div>
    </article>
  );
}