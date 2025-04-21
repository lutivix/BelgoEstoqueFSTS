import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { ProductsModule } from "./products/products.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { ScheduleModule } from "@nestjs/schedule"; // Importe o ScheduleModule
import { LoggerService } from "./logger/logger.service";
import { LoggerController } from "./logger/logger.controller";

@Module({
  imports: [
    ScheduleModule.forRoot(), // Registre o ScheduleModule
    ConfigModule.forRoot({
      load: [
        () => {
          const configPath = join(process.cwd(), "config", "omie-keys.json");
          return require(configPath);
        },
      ],
      isGlobal: true,
    }),
    DatabaseModule,
    ProductsModule,
    ServeStaticModule.forRoot({
      // rootPath: join(__dirname, "..", "public"), // Pasta public no backend
      rootPath: join(process.cwd(), "public"),
      exclude: ["/logger*", "/products*", "/api*"], // ← API permanece funcional
    }),
  ],
  controllers: [AppController, LoggerController],
  providers: [AppService, LoggerService],
})
export class AppModule {}

function omieConfig() {
  return require("../config/omie-keys.json");
}
