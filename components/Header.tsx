import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <span className={styles.brandName}>Berpa</span>
          <span className={styles.brandTag}>Demostración independiente</span>
        </div>

        <div className={styles.search} role="search">
          <input type="search" placeholder="Buscar" aria-label="Buscar productos" />
          <button type="button" aria-label="Buscar">🔍</button>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.action}>👤 Ingresar</button>
          <button type="button" className={styles.action} aria-label="Ubicación">📍</button>
          <button type="button" className={styles.action} aria-label="Carrito">🛍️ 0</button>
        </div>
      </div>

      <nav className={styles.tabs} aria-label="Secciones">
        <button type="button" className={styles.tabActive}>Productos</button>
        <button type="button" className={styles.tab}>Domicilios</button>
        <button type="button" className={styles.tab}>Ofertas</button>
      </nav>
    </header>
  );
}