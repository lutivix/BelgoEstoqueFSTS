// src/products/interfaces/omie-product-response.interface.ts
export interface ProdutoServicoCadastro {
  codigo_produto: number;
  codigo_produto_integracao?: string;
  codigo: string;
  descricao: string;
  unidade?: string;
  ncm?: string;
  ean?: string;
  valor_unitario?: number;
  codigo_familia?: number;
  tipoItem?: string;
  recomendacoes_fiscais?: RecomendacoesFiscais;
  peso_liq?: number;
  peso_bruto?: number;
  altura?: number;
  largura?: number;
  profundidade?: number;
  marca?: string;
  modelo?: string;
  dias_garantia?: number;
  dias_crossdocking?: number;
  descr_detalhada?: string;
  obs_internas?: string;
  imagens?: Imagens[];
  videos?: Videos[];
  caracteristicas?: Caracteristicas[];
  tabelas_preco?: TabelasPreco[];
  info?: Info;
  exibir_descricao_nfe?: string;
  exibir_descricao_pedido?: string;
  medicamento?: Medicamento;
  combustivel?: Combustivel;
  veiculo?: Veiculo;
  armamento?: Armamento;
  cst_icms?: string;
  modalidade_icms?: string;
  csosn_icms?: string;
  aliquota_icms?: number;
  red_base_icms?: number;
  motivo_deson_icms?: string;
  per_icms_fcp?: number;
  codigo_beneficio?: string;
  cst_pis?: string;
  aliquota_pis?: number;
  red_base_pis?: number;
  cst_cofins?: string;
  aliquota_cofins?: number;
  red_base_cofins?: number;
  cfop?: string;
  dadosIbpt?: DadosIbpt;
  codInt_familia?: string;
  descricao_familia?: string;
  bloqueado?: string;
  bloquear_exclusao?: string;
  importado_api?: string;
  inativo?: string;
  componentes_kit?: ComponentesKit[];
  lead_time?: number;
  aliquota_ibpt?: number;
  cest?: string;
  quantidade_estoque?: number;
  estoque_minimo?: number;
  origem_imposto?: string;
}

export interface ProdutoServicoListFullResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  produto_servico_cadastro: ProdutoServicoCadastro[];
}

// Interfaces auxiliares (simplificadas, podemos expandir se precisar)
export interface RecomendacoesFiscais {
  origem_mercadoria?: string;
  id_preco_tabelado?: number;
  id_cest?: string;
  cupom_fiscal?: string;
  market_place?: string;
  indicador_escala?: string;
  cnpj_fabricante?: string;
}

export interface Imagens {
  url_imagem?: string;
}

export interface Videos {
  url_video?: string;
}

export interface Caracteristicas {
  nCodCaract?: number;
  cCodIntCaract?: string;
  cNomeCaract?: string;
  cConteudo?: string;
  cExibirItemNF?: string;
  cExibirItemPedido?: string;
  cExibirOrdemProd?: string;
}

export interface TabelasPreco {
  nCodTabPreco?: number;
  cNomeTabPreco?: string;
  nValorTabPreco?: number;
}

export interface Info {
  dInc?: string;
  hInc?: string;
  uInc?: string;
  dAlt?: string;
  hAlt?: string;
  uAlt?: string;
  cImpAPI?: string;
}

export interface Medicamento {
  cod_anvisa?: string;
  preco_max_cons?: number;
}

export interface Combustivel {
  codigo_anp?: string;
  descr_anp?: string;
  percent_glp?: number;
  percent_gas_nac?: number;
  percent_gas_imp?: number;
  valor_part?: number;
}

export interface Veiculo {
  ano_fabr?: string;
  ano_modelo?: string;
  chassi?: string;
  // ... outros campos se precisar
}

export interface Armamento {
  serie_cano?: string;
  descr_arma?: string;
  serie_arma?: string;
  tipo_arma?: string;
}

export interface DadosIbpt {
  aliqFederal?: number;
  aliqEstadual?: number;
  aliqMunicipal?: string;
  fonte?: string;
  chave?: string;
  versao?: string;
  valido_de?: string;
  valido_ate?: string;
}

export interface ComponentesKit {
  codigo_componente?: number;
  codigo_produto_componente?: number;
  quantidade_componente?: number;
  valor_unitario_componente?: number;
  local_estoque_componente?: number;
}
