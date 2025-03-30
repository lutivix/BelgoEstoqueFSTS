import { DataSource } from "typeorm";
import { Product } from "./src/products/entities/product.entity";
import { Stock } from "./src/products/entities/stock.entity";
import { ScanMetadata } from "./src/products/entities/scan-metadata.entity";

export const AppDataSource = new DataSource({
  type: "mssql",
  host: "localhost",
  port: 1433,
  username: "Lutivix",
  password: "lfsistemas",
  database: "BelgoEstoque",
  synchronize: false,
  logging: true,
  entities: [Product, Stock, ScanMetadata],
  migrations: ["src/database/migrations/*{.ts,.js}"],
  options: {
    trustServerCertificate: true,
  },
});
