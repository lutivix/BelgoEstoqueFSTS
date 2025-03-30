export interface ListarEstPosRequest {
  call: string; // Sempre "ListarPosEstoque"
  app_key: string; // Chave da aplicação
  app_secret: string; // Segredo da aplicação
  param: {
    nPagina: number; // Página atual
    nRegPorPagina: number; // Quantidade de registros por página
    dDataPosicao: string; // Data da posição do estoque (formato "DD/MM/YYYY")
    cExibeTodos: string; // "S" ou "N" para exibir todos os registros
    codigo_local_estoque: number; // Código do local do estoque
  }[];
}

export interface Produtos {
  nCodProd: number; // Código do Produto (integer)
  cCodInt: string; // Código de Integração do Produto (string60)
  cCodigo: string; // Código do produto (string60)
  cDescricao: string; // Descrição do Produto (string120)
  nPrecoUnitario: number; // Preço Unitário de venda (decimal)
  nSaldo: number; // Saldo do produto (decimal)
  nCMC: number; // Custo Médio Contábil (decimal)
  nPendente: number; // Saldo pendente em pedidos de venda (decimal)
  estoque_minimo: number; // Estoque mínimo para o produto (decimal)
  codigo_local_estoque: number; // Código do local do estoque (integer)
  reservado: number; // Quantidade reservada do estoque (decimal)
  fisico: number; // Quantidade física em estoque (decimal)
}

export interface ListarEstPosResponse {
  dDataPosicao: string;
  nPagina: number; // Página atual
  nTotPaginas: number; // Total de páginas
  nRegistros: number; // Quantidade de registros na página
  nTotRegistros: number; // Total de registros encontrados
  produtos: Produtos[]; // Lista de produtos
}
