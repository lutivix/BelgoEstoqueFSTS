// src/products/dto/list-stock-position-request.dto.ts
export class ListStockPositionRequestDto {
  nPagina: number = 1;
  nRegPorPagina: number = 50;
  cExibirMovimentacao: string = "S"; // Sim, para incluir movimentação
  cExibirReserva: string = "S"; // Sim, para incluir reserva
}
