// Interface para os parâmetros da requisição (ListarMovimentos)
export interface ListMovementsRequest {
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

// Interface principal da resposta (ListarMovimentos)
export interface ListMovementsResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  cadastros: Cadastro[];
}

// Interface para cada cadastro na resposta
export interface Cadastro {
  nCodProd: number;
  cCodIntProd: string;
  cCodigo: string;
  cDescricao: string;
  movimentos: Movimento[];
}

// Interface para cada item de movimentação dentro de um cadastro
export interface Movimento {
  id: number;
  cCodProd: string;
  cDesProd: string;
  cLocal: string;
  cNumDoc: string;
  cOperacao: string;
  cTipo: string;
  dDataMovimento: string;
  nQtdeEntradas?: number;
  nQtdeSaidas?: number;
  nValorUnitario?: number;
  info: InfoMovimento;
  cObs?: string;
  nValorTotal?: number;
}

// Interface auxiliar para informações adicionais do movimento
export interface InfoMovimento {
  dInc?: string;
  hInc?: string;
  uInc?: string;
  dAlt?: string;
  hAlt?: string;
  uAlt?: string;
  cImpAPI?: string;
}
