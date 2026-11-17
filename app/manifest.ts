import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ENVIS — DENR Region VII Data Portal",
    short_name: "ENVIS",
    description:
      "Catalog of environment and natural resources geospatial datasets for Central Visayas. Preview in the browser, request source files from DENR Region VII.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F5EE",
    theme_color: "#0B1F19",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/exported/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/exported/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
