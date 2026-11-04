import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Poppins } from "next/font/google";
import Header from "@/components/Header";
import Chatbot from "@/components/Chatbot";
import "./globals.css";
import styles from "./layout.module.css";

const titulos = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--fuente-titulos" });
const texto = Poppins({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--fuente-texto" });

export const metadata: Metadata = {
  title: {
    default: "Demostración de asistente virtual (independiente)",
    template: "%s · Demostración independiente, no oficial",
  },
  description: "Prototipo independiente de un chatbot para comercio electrónico. No es la tienda oficial de BERPA.",
};

// viewportFit "cover" activa env(safe-area-inset-*) en teléfonos con muesca; "resizes-content" hace que el teclado
// encoja el área visible (Chrome en Android), así el campo del chat queda encima del teclado.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

// Estructura común a todas las páginas. El chat vive aquí, así que su conversación se conserva al navegar.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <body className={`${titulos.variable} ${texto.variable}`}>
        <div className={styles.aviso}>
          Demostración independiente. No es la tienda oficial de BERPA ni está conectada a ella.
        </div>
        <Header />
        {children}
        <footer className={styles.footer}>
          Prototipo con fines ilustrativos, sin afiliación con BERPA. Los productos, precios y existencias
          mostrados son ficticios y deben verificarse antes de cualquier uso comercial.
        </footer>
        <Chatbot />
      </body>
    </html>
  );
}
