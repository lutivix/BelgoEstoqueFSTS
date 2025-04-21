// backend/src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DataSource } from "typeorm";
import * as crypto from "crypto";
import { LoggerService } from "./logger/logger.service";

// Forçar o crypto globalmente
global.crypto = crypto as Crypto;
const logger = new LoggerService();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  // Pegar a conexão do TypeORM via DataSource
  const dataSource = app.get(DataSource);
  let retryCount = 0;
  const maxRetries = 10;
  const retryDelay = 3000;

  const checkConnection = async (): Promise<void> => {
    try {
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }
      logger.log("Conexão com o banco estabelecida!");
      retryCount = 0; // Reseta se conectar
    } catch (error) {
      logger.error(`Tentativa ${retryCount + 1}: ${error.message}`);
      if (retryCount >= maxRetries) {
        logger.error(`Falha ao conectar após ${maxRetries} tentativas. Encerrando aplicação.`);
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
  logger.error("Erro no bootstrap:", err);
  process.exit(1);
});
