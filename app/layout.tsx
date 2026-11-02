import type { Metadata } from "next";
import { Bebas_Neue, Poppins } from "next/font/google";
import "./globals.css";

const titulos = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--fuente-titulos" });
const texto = Poppins({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--fuente-texto" });

export const metadata: Metadata = {
  title: "Demostración de asistente virtual (independiente)",
  description: "Prototipo independiente de un chatbot para comercio electrónico. No es la tienda oficial de BERPA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <body className={`${titulos.variable} ${texto.variable}`}>{children}</body>
    </html>
  );
};