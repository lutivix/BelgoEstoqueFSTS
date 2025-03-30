import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DatabaseService } from "./database.service";
import { Product } from "../products/entities/product.entity"; // Importação explícita
import { Stock } from "../products/entities/stock.entity"; // Importação explícita
import { ScanMetadata } from "../products/entities/scan-metadata.entity"; // Adicione esta importação
import { DatabaseController } from "./database.controller";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "mssql",
      host: "localhost",
      port: 1433,
      username: "Lutivix",
      password: "lfsistemas",
      database: "BelgoEstoque",
      entities: [Product, Stock, ScanMetadata], // Substituir o caminho dinâmico por entidades explícitas
      migrations: [__dirname + "/migrations/*{.ts,.js}"],
      synchronize: false,
      options: {
        trustServerCertificate: true,
      },
      retryAttempts: 10, // Tenta 10 vezes
      retryDelay: 3000, // 3 segundos entre tentativas
      autoLoadEntities: true,
      // Adiciona hook pra fechar após falhas
      logger: {
        logQuery: (query) => console.log(query),
        logQueryError: (error) => console.error(error),
        logSchemaBuild: (message) => console.log(message),
        logMigration: (message) => console.log(message),
        log: (level, message) => console.log(`${level}: ${message}`),
        logQuerySlow: (time, query) => console.log(`Slow query (${time}ms): ${query}`),
      },
    }),
  ],
  providers: [DatabaseService],
  controllers: [DatabaseController],
  exports: [DatabaseService],
})
export class DatabaseModule {}
