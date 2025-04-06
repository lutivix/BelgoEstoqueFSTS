// backend/src/stock-update/stock-update.service.ts
import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ProductsService } from "../products/products.service"; // Importe o ProductsService
import { ListMovementsRequestDto } from "../products/dto/list-movements-request.dto"; // Importe o DTO
import * as crypto from "crypto"; // Adicione esta importação

@Injectable()
export class StockUpdateService {
  constructor(private readonly productsService: ProductsService) {
    // Teste se o crypto está disponível
    console.log("Crypto disponível:", typeof crypto.randomUUID === "function");
  }

  @Cron("0 */1 * * * *", { name: "updateStockCron" }) // A cada 5 minutos
  // @Cron(CronExpression.EVERY_MINUTE) // Executa a cada minuto
  async updateStock() {
    if (this.productsService["isLoadingInitial"]) {
      // Acessa a flag diretamente (não ideal, mas funciona)
      console.log("updateStock pausado devido a loadInitial em andamento");
      return;
    }

    const dto = new ListMovementsRequestDto(); // Crie uma instância do DTO
    // Opcional: configure o DTO se precisar de parâmetros específicos, como cod_produto
    dto.pagina = 1;
    dto.registros_por_pagina = 1000;

    try {
      const processed = await this.productsService.listMovements(null, dto); // null para todas as empresas
      console.log(`Movimentos processados: ${processed}`); // Log simples no console
    } catch (error) {
      console.error(`Erro ao atualizar estoque: ${error.message}`);
    }
  }
}
