import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Permite acesso de qualquer IP na rede local
    port: 5173,      // Porta padrão do Vite (pode alterar se quiser)
    // Adiciona o host público à lista de hosts permitidos (atualizado para porta 5174)
    allowedHosts: ["5174-ioddr9t3rxuufrr6fdaxk-b88f976f.manus.computer"],
  },
})

