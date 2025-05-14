import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Permite acesso de qualquer IP na rede local
    port: 5173, // Porta padrão do Vite (pode alterar se quiser)
    allowedHosts: ["nitro5"],
  },
});
