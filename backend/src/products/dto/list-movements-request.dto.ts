// src/products/dto/list-movements-request.dto.ts
import { ListMovementsRequest } from "../interfaces/omie-movement-response.interface";

export class ListMovementsRequestDto implements ListMovementsRequest {
  pagina?: number;
  registros_por_pagina?: number;
  apenas_importado_api?: string;
  filtrar_por_data_de?: string;
  filtrar_por_data_ate?: string;
  filtrar_por_hora_de?: string;
  filtrar_por_hora_ate?: string;
  data_inicial?: string;
  data_final?: string;
  codigo_local_estoque?: number;
  tipo_movimento?: string;
}
