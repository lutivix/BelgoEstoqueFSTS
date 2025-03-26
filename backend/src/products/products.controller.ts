// src/products/products.controller.ts
import { Controller, Get, Query, Param, Res, Post } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ListProductsRequestDto } from "./dto/list-products-request.dto";
import { ListStockPositionRequestDto } from "./dto/list-stock-position-request.dto";
import { ListMovementsRequestDto } from "./dto/list-movements-request.dto";
import { OmieProductFromDb } from "./dto/omie-product-from-db.dto";
import { Response } from "express";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get("list/:empresa")
  async listProducts(
    @Param("empresa") empresa: string | null,
    @Query() dto: ListProductsRequestDto,
  ): Promise<OmieProductFromDb[]> {
    return this.productsService.listProducts(empresa, dto);
  }

  @Post("load-initial")
  async loadInitialProducts(): Promise<{
    message: string;
    products: OmieProductFromDb[];
  }> {
    return this.productsService.loadInitialProducts(null); // Processa todas as empresas
  }

  @Get("stock/:empresa")
  async listStockPosition(
    @Param("empresa") empresa: string | null,
    @Query() dto: ListStockPositionRequestDto,
  ) {
    return this.productsService.listStockPosition(empresa, dto);
  }

  @Get("movements/:empresa")
  async listMovements(
    @Param("empresa") empresa: string,
    @Query() dto: ListMovementsRequestDto,
  ) {
    return this.productsService.listMovements(empresa, dto);
  }

  @Get("db")
  async loadProductsFromDb(): Promise<OmieProductFromDb[]> {
    return this.productsService.loadProductsFromDb();
  }

  @Get("export-excel")
  async exportExcel(@Query("empresa") empresa: string, @Res() res: Response) {
    const buffer = await this.productsService.exportToExcel(
      empresa || "VITORIA",
    );
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="produtos.xlsx"',
    });
    res.send(buffer);
  }

  @Get("last-scan")
  getLastScan(): string {
    return this.productsService.getLastMovementScan();
  }

  @Get("clear-database")
  async clearDatabase() {
    await this.productsService.clearDatabase();
    return "Tabelas product e stock limpas";
  }
}
