import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "El Hub",
    short_name: "El Hub",
    description: "Cumpleaños, aniversarios y gastos compartidos del grupo.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f2f2",
    theme_color: "#f3f2f2",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
