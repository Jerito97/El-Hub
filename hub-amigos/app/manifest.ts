import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LinkUp",
    short_name: "LinkUp",
    description: "Cumpleaños, aniversarios y gastos compartidos del grupo.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf6f2",
    theme_color: "#faf6f2",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
