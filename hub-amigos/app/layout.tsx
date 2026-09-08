import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "El Hub",
  description: "Cumpleaños, aniversarios y gastos compartidos del grupo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3f2f2",
};

// Applied before paint so a saved "oscuro" preference never flashes light first.
const themeBootstrap = `
try {
  var t = localStorage.getItem("hub-theme");
  if (t === "oscuro") document.documentElement.setAttribute("data-theme", "oscuro");
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={archivo.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
