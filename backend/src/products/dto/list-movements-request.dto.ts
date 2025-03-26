// src/products/dto/list-movements-request.dto.ts
export class ListMovementsRequestDto {
  pagina: number = 1;
  registros_por_pagina: number = 50;
  data_inicial: string; // Ex.: "01/03/2025"
  data_final: string; // Ex.: "20/03/2025"
  cod_produto: string; // Opcional, para um produto específico
}
