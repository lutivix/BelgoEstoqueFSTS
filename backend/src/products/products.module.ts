// src/products/products.module.ts
import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { Product } from "./entities/product.entity";
import { Stock } from "./entities/stock.entity";
import { DatabaseModule } from "../database/database.module"; // Ajuste o caminho
import { LoggerService } from "../logger/logger.service";

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Product, Stock])],
  controllers: [ProductsController],
  providers: [ProductsService, LoggerService],
})
export class ProductsModule implements OnModuleInit {
  constructor(private readonly productsService: ProductsService) {}

  async onModuleInit() {
    // Descomente para rodar na inicialização
    // await this.productsService.loadInitialProducts('VITORIA');
  }
}
