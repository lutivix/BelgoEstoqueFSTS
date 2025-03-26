import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { ProductsModule } from "./products/products.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [omieConfig],
      isGlobal: true,
    }),
    DatabaseModule,
    ProductsModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "public"), // Pasta public no backend
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

function omieConfig() {
  return require("../config/omie-keys.json");
}
