// src/products/dto/list-products-request.dto.ts
export class ListProductsRequestDto {
  pagina: number = 1;
  registros_por_pagina: number = 1000;
  apenas_importado_api: string = "N";
  filtrar_apenas_omiepdv: string = "N";
}
