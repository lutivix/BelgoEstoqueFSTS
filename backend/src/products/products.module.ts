// src/products/products.module.ts
import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { Product } from "./entities/product.entity";
import { Stock } from "./entities/stock.entity";
import { ScanMetadata } from "./entities/scan-metadata.entity";
import { DatabaseModule } from "../database/database.module"; // Ajuste o caminho
import { LoggerService } from "../logger/logger.service";
import { StockUpdateService } from "../stock-update/stock-update.service"; // Importe o novo serviç
import { ListMovementsRequestDto } from "../products/dto/list-movements-request.dto"; // Importe o DTO

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Product, Stock, ScanMetadata])],
  controllers: [ProductsController],
  providers: [ProductsService, LoggerService, StockUpdateService],
})
export class ProductsModule implements OnModuleInit {
  constructor(private readonly productsService: ProductsService) {}

  async onModuleInit() {
    // Descomente para rodar na inicialização
    // await this.productsService.loadInitialProducts('VITORIA');
    const dto = new ListMovementsRequestDto(); // Crie uma instância do DTO
    // Opcional: configure o DTO se precisar de parâmetros específicos, como cod_produto
    dto.pagina = 1;
    dto.registros_por_pagina = 500;

    // await this.productsService.loadProductsFromDb();
    // await this.productsService.listMovements(null, dto);
  }
}
