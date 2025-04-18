// backend/src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DataSource } from "typeorm";
import * as crypto from "crypto";
// Redireciona "/" ou "/index" para o index.html manual da pasta public

// Forçar o crypto globalmente
global.crypto = crypto as any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  // Pegar a conexão do TypeORM via DataSource
  const dataSource = app.get(DataSource);
  let retryCount = 0;
  const maxRetries = 10;
  const retryDelay = 3000;

  const checkConnection = async () => {
    try {
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }
      console.log("Conexão com o banco estabelecida!");
      retryCount = 0; // Reseta se conectar
    } catch (error) {
      console.error(`Tentativa ${retryCount + 1}: ${error.message}`);
      if (retryCount >= maxRetries) {
        console.error(`Falha ao conectar após ${maxRetries} tentativas. Encerrando aplicação.`);
        await app.close();
        process.exit(1);
      }
      retryCount++;
      setTimeout(checkConnection, retryDelay);
    }
  };

  await checkConnection();

  app.enableCors({
    // origin: "http://localhost:5173", // Permite apenas o frontend em dev
    origin: "*", // Permite apenas o frontend em dev
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Métodos permitidos
    credentials: true, // Se precisar de cookies ou autenticação
  });

  app.setGlobalPrefix("api");

  await app.listen(3000);
}

bootstrap().catch((err) => {
  console.error("Erro no bootstrap:", err);
  process.exit(1);
});
