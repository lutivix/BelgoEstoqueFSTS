// src/products/products.service.ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import axios from "axios";
import { ConfigService } from "@nestjs/config";
import { Product } from "./entities/product.entity";
import { Stock } from "./entities/stock.entity";
import { ListProductsRequestDto } from "./dto/list-products-request.dto";
import {
  ProdutoServicoListFullResponse,
  ProdutoServicoCadastro,
} from "./interfaces/omie-product-response.interface";
import { ListMovementsRequestDto } from "./dto/list-movements-request.dto";
import { OmieProductFromDb } from "./dto/omie-product-from-db.dto";
import { LoggerService } from "../logger/logger.service";
import { ListStockPositionRequestDto } from "./dto/list-stock-position-request.dto";
import {
  ListarEstPosRequest,
  ListarEstPosResponse,
} from "./interfaces/omie-estoque-response.interface";
import * as ExcelJS from "exceljs";

@Injectable()
export class ProductsService {
  private lastMovementScan: Date | null = null; // Movido para fora do construtor
  private readonly EMPRESAS = [
    "VITORIA",
    "TELARAME",
    "SUPERTELAS",
    "UNIAO",
    "LINHARES",
    "ESTRUTURACO",
  ];

  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Stock) private stockRepo: Repository<Stock>,
    private configService: ConfigService,
    private logger: LoggerService, // Injete o logger
  ) {
    this.logger.log("ProductsService inicializado", "O");
    console.log("productRepo injetado:", !!this.productRepo); // Deve ser true
  }

  private getOmieConfig(empresa: string) {
    const config = this.configService.get(empresa.toUpperCase());
    // const { appKey, appSecret } = config[empresa.toLowerCase()];
    if (!config || !config.appKey || !config.appSecret) {
      this.logger.error(`Configuração inválida para ${empresa}`);
      throw new Error(`Configuração inválida para ${empresa}`);
    }
    return config;
  }

  async listProducts(
    empresa: string | null,
    dto: ListProductsRequestDto,
  ): Promise<
    OmieProductFromDb[] & {
      total_de_paginas: number;
      total_de_registros: number;
    }
  > {
    if (!empresa) {
      throw new Error("Empresa não especificada");
    }
    this.logger.log(
      `Listando produtos para ${empresa}, página ${dto.pagina}`,
      "L",
    );
    try {
      const { appKey, appSecret } = this.getOmieConfig(empresa);
      const url = "https://app.omie.com.br/api/v1/geral/produtos/";
      const params = {
        ...dto,
        pagina: dto.pagina ?? 1,
        registros_por_pagina: dto.registros_por_pagina ?? 500,
      };
      const requestBody = {
        call: "ListarProdutos",
        app_key: appKey,
        app_secret: appSecret,
        param: [params],
      };
      const response = await axios.post<ProdutoServicoListFullResponse>(
        url,
        requestBody,
        { headers: { "Content-Type": "application/json" } },
      );
      const products = response.data.produto_servico_cadastro;
      await this.saveOrUpdateProducts(products, empresa);
      const savedProducts = await this.productRepo.find({
        where: { primeira_loja: empresa },
      });
      const result = await Promise.all(
        savedProducts.map((p) => this.mapToOmieProductFromDb(p)),
      );
      this.logger.log(`Produtos retornados para ${empresa}`, "O");

      return Object.assign(result, {
        total_de_paginas: response.data.total_de_paginas,
        total_de_registros: response.data.total_de_registros,
      });
    } catch (error) {
      this.logger.error(`Erro na chamada à Omie: ${error.message}`);
      throw new Error("Falha ao listar produtos da Omie");
    }
  }

  async loadInitialProducts(
    empresa: string | null,
  ): Promise<{ message: string; products: OmieProductFromDb[] }> {
    if (!empresa) {
      throw new Error("Empresa não especificada");
    }
    let pagina = 1;
    let totalPaginas = 0;
    const startTime = Date.now();

    do {
      const dto = new ListProductsRequestDto();
      dto.pagina = pagina;
      dto.registros_por_pagina = 500;
      const response = await this.listProducts(empresa, dto);

      // Define totalPaginas na primeira chamada
      if (pagina === 1) {
        totalPaginas = response.total_de_paginas || 1; // Agora TypeScript reconhece
      }

      this.logger.log(`Carregando página ${pagina} de ${totalPaginas}`, "L");
      pagina++;
    } while (pagina <= totalPaginas);

    const allProducts = await this.productRepo.find({
      where: { primeira_loja: empresa },
    });
    const result = await Promise.all(
      allProducts.map((p) => this.mapToOmieProductFromDb(p)),
    );
    const duration = (Date.now() - startTime) / 1000;
    return {
      message: `Carga inicial concluída para ${empresa}, total de páginas: ${totalPaginas}, tempo: ${duration}s`,
      products: result,
    };
  }

  // async listStockPosition(
  //   empresa: string | null,
  //   dto: ListStockPositionRequestDto,
  // ) {
  // if (!empresa) {
  //   throw new Error("Empresa não especificada");
  // }
  // try {
  //   const { appKey, appSecret } = this.getOmieConfig(empresa);
  //   const url = "https://app.omie.com.br/api/v1/estoque/posicao/";

  //   const params = {
  //     nPagina: dto.nPagina,
  //     nRegPorPagina: dto.nRegPorPagina,
  //     cExibirMovimentacao: dto.cExibirMovimentacao,
  //     cExibirReserva: dto.cExibirReserva,
  //   };

  //   const requestBody = {
  //     call: "ListarPosEstoque",
  //     app_key: appKey,
  //     app_secret: appSecret,
  //     param: [params],
  //   };

  //   console.log(
  //     "Corpo da requisição (estoque):",
  //     JSON.stringify(requestBody, null, 2),
  //   );

  //   const response = await axios.post(url, requestBody, {
  //     headers: { "Content-Type": "application/json" },
  //   });

  //   console.log("Resposta da Omie (estoque):", response.data);
  //   const stockData = response.data.posicao_estoque;
  //   await this.saveStock(stockData, empresa);
  //   return response.data;
  // } catch (error) {
  //   console.error(
  //     "Erro na chamada à Omie (estoque):",
  //     error.response?.data || error.message,
  //   );
  //   throw new Error("Falha ao listar posição de estoque da Omie");
  // }
  // }
  async listStockPosition(
    empresa: string | null,
    dto: ListStockPositionRequestDto,
  ): Promise<OmieProductFromDb[]> {
    this.logger.log("Iniciando listagem da posição de estoque", "L");
    if (!empresa) {
      throw new Error("Empresa não especificada");
    }
    try {
      const { appKey, appSecret } = this.getOmieConfig(empresa);
      const url = "https://app.omie.com.br/api/v1/estoque/consulta/";

      // Mapeamento de lojas para codigo_local_estoque (substitua pelos valores reais)
      const lojaMap: { [key: string]: number } = {
        VITORIA: 1, // Ajuste com os códigos reais da Omie
        TELARAME: 2,
        SUPERTELAS: 3,
        UNIAO: 4,
        LINHARES: 5,
        ESTRUTURACO: 6,
      };
      const empresaUpper = empresa.toUpperCase();
      const codigoLoja = lojaMap[empresaUpper];

      if (!codigoLoja) {
        throw new Error(`Loja ${empresa} não reconhecida`);
      }

      const requestBody: ListarEstPosRequest = {
        call: "ListarPosEstoque",
        app_key: appKey,
        app_secret: appSecret,
        param: [
          {
            nPagina: dto.nPagina ?? 1,
            nRegPorPagina: dto.nRegPorPagina ?? 500,
            dDataPosicao: new Date().toLocaleDateString("pt-BR"), // Hoje: DD/MM/YYYY
            cExibeTodos: "N",
            codigo_local_estoque: 0,
          },
        ],
      };

      this.logger.log(`Chamando Omie para estoque de ${empresa}`, "L");
      const response = await axios.post<ListarEstPosResponse>(
        url,
        requestBody,
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      const stockData = response.data.produtos;
      this.logger.log(`Recebidos ${stockData.length} itens de estoque`, "L");

      // Salva ou atualiza estoques
      await this.saveStock(stockData, empresa);

      // Retorna produtos com estoques associados
      const produtosDb = await this.productRepo.find();
      const produtosComEstoque = await Promise.all(
        produtosDb.map((p) => this.mapToOmieProductFromDb(p)),
      );

      this.logger.log(
        `Listagem concluída com ${produtosComEstoque.length} produtos`,
        "L",
      );
      return produtosComEstoque;
    } catch (error) {
      this.logger.error(`Erro ao listar posição de estoque: ${error.message}`);
      throw new Error("Falha ao listar posição de estoque da Omie");
    }

    // Método de busca de dados do banco.
    try {
      // 1️⃣ Buscar os produtos do banco
      this.logger.log("Buscando produtos no banco", "L");
      const produtos = await this.productRepo.find();

      // 2️⃣ Buscar os estoques no banco
      this.logger.log("Buscando estoques no banco", "L");
      const estoques = await this.stockRepo.find();

      // 3️⃣ Criar um mapa de estoque por OMIE_PRD_ID
      this.logger.log("Criando mapa de estoque por OMIE_PRD_ID", "L");
      const estoqueMap = new Map<string, Stock[]>();

      estoques.forEach((estoque) => {
        if (!estoqueMap.has(estoque.omiePrdId)) {
          estoqueMap.set(estoque.omiePrdId, []);
        }
        estoqueMap.get(estoque.omiePrdId)?.push(estoque);
      });

      // 4️⃣ Atualizar os produtos com os dados de estoque correspondentes
      this.logger.log("Associando estoque aos produtos", "L");
      const produtosComEstoque: OmieProductFromDb[] = produtos.map(
        (produto) => ({
          id: produto.ID, // ✅ Garante que o ID esteja presente
          codigo_omie: produto.codigo_omie,
          codigo_produto: produto.codigo_produto,
          name: produto.name,
          desc: produto.desc,
          type: produto.type,
          id_type: produto.id_type,
          cod_integ: produto.cod_integ,
          valor_un: produto.valor_un,
          primeira_loja: produto.primeira_loja,
          estId: produto.est_id,
          estoque: estoqueMap.get(produto.codigo_omie) || [], // ✅ Garante que estoque nunca seja undefined
        }),
      );

      this.logger.log(
        `Listagem de estoque concluída com ${produtosComEstoque.length} produtos`,
        "L",
      );
      return produtosComEstoque;
    } catch (error) {
      this.logger.error(
        `Falha ao listar posição de estoque: ${error.message}` + error.stack,
      );
      throw new Error("Falha ao listar posição de estoque");
    }
  }

  async listMovements(empresa: string | null, dto: ListMovementsRequestDto) {
    if (!empresa) {
      throw new Error("Empresa não especificada");
    }
    try {
      const { appKey, appSecret } = this.getOmieConfig(empresa);
      const url = "https://app.omie.com.br/api/v1/estoque/movimentos/";

      const params = {
        pagina: dto.pagina,
        registros_por_pagina: dto.registros_por_pagina,
        data_inicial: dto.data_inicial,
        data_final: dto.data_final,
        cod_produto: dto.cod_produto,
      };

      const requestBody = {
        call: "ListarMovimentos",
        app_key: appKey,
        app_secret: appSecret,
        param: [params],
      };

      const response = await axios.post(url, requestBody, {
        headers: { "Content-Type": "application/json" },
      });
      this.lastMovementScan = new Date();
      return response.data.movimentos;
    } catch (error) {
      console.error(
        "Erro na chamada à Omie (movimentos):",
        error.response?.data || error.message,
      );
      throw new Error("Falha ao listar movimentos da Omie");
    }
  }

  private async saveOrUpdateProducts(
    products: ProdutoServicoCadastro[],
    empresa: string,
  ) {
    for (const prod of products) {
      try {
        console.log(`Buscando produto existente: ${prod.codigo}`);
        const existingProduct = await this.productRepo.findOne({
          where: { codigo_omie: prod.codigo },
        });
        const product = existingProduct || new Product();

        console.log(
          `Produto: ${prod.codigo}, codigo_produto_integracao: ${prod.codigo_produto_integracao}`,
        );

        product.codigo_omie = prod.codigo || "";
        product.codigo_produto = prod.codigo_produto?.toString() || "";
        product.name = prod.descricao || product.name;
        product.desc = prod.descr_detalhada ?? product.desc;
        product.type = prod.descricao_familia || product.type;
        product.id_type = prod.codigo_familia || product.id_type;

        // Garantir que cod_integ seja um número válido
        const codigoIntegracao = prod.codigo_produto_integracao;
        product.cod_integ =
          codigoIntegracao && !isNaN(Number(codigoIntegracao))
            ? Number(codigoIntegracao)
            : (existingProduct?.cod_integ ?? 0);
        console.log(`cod_integ antes do save: ${product.cod_integ}`);

        product.valor_un =
          prod.valor_unitario ?? existingProduct?.valor_un ?? 0;
        product.primeira_loja = empresa;

        await this.productRepo.save(product);
        this.logger.log(
          `Produto ${prod.codigo} ${existingProduct ? "atualizado" : "inserido"}`,
          "P",
        );
      } catch (error) {
        console.error(
          `Erro ao processar produto ${prod.codigo}:`,
          error.message,
        );
        throw error;
      }
    }
  }

  private async saveStock(stockData: any[], empresa: string): Promise<void> {
    const empresaUpper = empresa.toUpperCase();
    const tenDaysAgo = 10 * 24 * 60 * 60 * 1000; // 10 dias em milissegundos

    for (const stock of stockData) {
      try {
        const product = await this.productRepo.findOne({
          where: { codigo_omie: stock.cCodigo },
        });

        if (product) {
          let stockEntity = await this.stockRepo.findOne({
            where: { omiePrdId: product.codigo_omie },
          });

          if (!stockEntity) {
            stockEntity = this.stockRepo.create({
              omiePrdId: product.codigo_omie, // Usa product.codigo_omie
              DHoje: new Date(Date.now() - tenDaysAgo), // D-10
              DMenos1: new Date(Date.now() - tenDaysAgo - 86400000), // D-11
            });
          }

          // Atualiza estoque da loja específica apenas pra D (D-1 fica 0 na carga inicial)
          switch (empresaUpper) {
            case "VITORIA":
              stockEntity.EST_VIX = stock.nSaldo;
              break;
            case "TELARAME":
              stockEntity.EST_TEL = stock.nSaldo;
              break;
            case "SUPERTELAS":
              stockEntity.EST_SUP = stock.nSaldo;
              break;
            case "UNIAO":
              stockEntity.EST_UNI = stock.nSaldo;
              break;
            case "LINHARES":
              stockEntity.EST_LIN = stock.nSaldo;
              break;
            case "ESTRUTURACO":
              stockEntity.EST_EST = stock.nSaldo;
              break;
            default:
              this.logger.warn(`Loja ${empresa} não reconhecida`, "P");
              continue;
          }

          // Datas pra carga inicial
          stockEntity.DHoje = new Date(Date.now() - tenDaysAgo); // D-10
          stockEntity.DMenos1 = new Date(Date.now() - tenDaysAgo - 86400000); // D-11

          // Zera estoques D-1 na carga inicial
          stockEntity.EST_VIX_DM1 = 0;
          stockEntity.EST_UNI_DM1 = 0;
          stockEntity.EST_LIN_DM1 = 0;
          stockEntity.EST_SUP_DM1 = 0;
          stockEntity.EST_TEL_DM1 = 0;
          stockEntity.EST_EST_DM1 = 0;

          // Calcula total apenas pra D (D-1 fica 0)
          stockEntity.EST_TOTAL_HOJE =
            [
              stockEntity.EST_VIX,
              stockEntity.EST_UNI,
              stockEntity.EST_LIN,
              stockEntity.EST_SUP,
              stockEntity.EST_TEL,
              stockEntity.EST_EST,
            ]
              .filter((val) => val !== undefined && val !== null)
              .reduce((sum, val) => sum + val, 0) || 0;
          stockEntity.EST_TOTAL_DM1 = 0;

          await this.stockRepo.save(stockEntity);
          this.logger.log(
            `Estoque inicial salvo para ${product.codigo_omie} em ${empresa}`,
            "P",
          );
        } else {
          this.logger.warn(
            `Produto ${stock.cCodigo} não cadastrado em ${empresa}`,
            "P",
          );
        }
      } catch (error) {
        this.logger.error(
          `Erro ao salvar estoque para ${stock.cCodigo} em ${empresa}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  async updateStockTotals(empresa: string) {
    // Lógica com listMoviment pra somar EST_VIX, EST_UNI, etc.
    // Salvar em EST_TOTAL_HOJE e EST_TOTAL_DM1
  }

  async loadProductsFromDb(): Promise<OmieProductFromDb[]> {
    this.logger.log("Carregando produtos do banco", "L");

    try {
      const products = await this.productRepo.find();
      const result = await Promise.all(
        products.map((p) => this.mapToOmieProductFromDb(p)),
      );
      this.logger.log("Produtos carregados do banco", "O");
      return result;
    } catch (error) {
      this.logger.error(`Erro ao carregar produtos do banco: ${error.message}`);
      throw new Error("Falha ao carregar produtos do banco");
    }
  }

  private async mapToOmieProductFromDb(
    product: Product,
  ): Promise<OmieProductFromDb> {
    const stock = await this.stockRepo.findOne({
      where: { omiePrdId: product.codigo_omie },
    });
    return {
      codigo_produto: product.codigo_produto,
      codigo_omie: product.codigo_omie,
      name: product.name,
      desc: product.desc,
      type: product.type,
      id_type: product.id_type,
      valor_un: product.valor_un,
      primeira_loja: product.primeira_loja,
      id: product.ID,
      cod_integ: product.cod_integ,
      estoque_vitoria: stock?.EST_VIX,
      estoque_uniao: stock?.EST_UNI,
      estoque_linhares: stock?.EST_LIN,
      estoque_supertela: stock?.EST_SUP,
      estoque_telarame: stock?.EST_TEL,
      estoque_estruturaco: stock?.EST_EST,
      estoque_vitoria_dm1: stock?.EST_VIX_DM1,
      estoque_uniao_dm1: stock?.EST_UNI_DM1,
      estoque_linhares_dm1: stock?.EST_LIN_DM1,
      estoque_supertela_dm1: stock?.EST_SUP_DM1,
      estoque_telarame_dm1: stock?.EST_TEL_DM1,
      estoque_estruturaco_dm1: stock?.EST_EST_DM1,
      estoque_total: stock?.EST_TOTAL_HOJE,
      estoque_total_dm1: stock?.EST_TOTAL_DM1,
      D: stock?.DHoje,
      DM1: stock?.DMenos1,
    };
  }

  async exportToExcel(empresa: string): Promise<Buffer> {
    const produtos = await this.listStockPosition(
      empresa,
      new ListStockPositionRequestDto(),
    );
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Produtos");

    // Definindo todas as colunas com base em OmieProductFromDb
    worksheet.columns = [
      { header: "Código Produto", key: "codigo_produto", width: 15 },
      { header: "Código Omie", key: "codigo_omie", width: 15 },
      { header: "Nome", key: "name", width: 20 },
      { header: "Descrição", key: "desc", width: 30 },
      { header: "Tipo", key: "type", width: 15 },
      { header: "ID Tipo", key: "id_type", width: 10 },
      { header: "Valor Unitário", key: "valor_un", width: 15 },
      { header: "Primeira Loja", key: "primeira_loja", width: 15 },
      { header: "ID", key: "id", width: 10 },
      { header: "Código Integração", key: "cod_integ", width: 15 },
      { header: "Estoque Vitória", key: "estoque_vitoria", width: 15 },
      { header: "Estoque União", key: "estoque_uniao", width: 15 },
      { header: "Estoque Linhares", key: "estoque_linhares", width: 15 },
      { header: "Estoque Supertela", key: "estoque_supertela", width: 15 },
      { header: "Estoque Telarame", key: "estoque_telarame", width: 15 },
      { header: "Estoque Estruturaco", key: "estoque_estruturaco", width: 15 },
      { header: "Estoque Vitória D-1", key: "estoque_vitoria_dm1", width: 15 },
      { header: "Estoque União D-1", key: "estoque_uniao_dm1", width: 15 },
      {
        header: "Estoque Linhares D-1",
        key: "estoque_linhares_dm1",
        width: 15,
      },
      {
        header: "Estoque Supertela D-1",
        key: "estoque_supertela_dm1",
        width: 15,
      },
      {
        header: "Estoque Telarame D-1",
        key: "estoque_telarame_dm1",
        width: 15,
      },
      {
        header: "Estoque Estruturaco D-1",
        key: "estoque_estruturaco_dm1",
        width: 15,
      },
      { header: "Estoque Total", key: "estoque_total", width: 15 },
      { header: "Estoque Total D-1", key: "estoque_total_dm1", width: 15 },
      { header: "Data D", key: "D", width: 20 },
      { header: "Data D-1", key: "DM1", width: 20 },
    ];

    // Adicionando os dados ao worksheet
    produtos.forEach((p) => {
      worksheet.addRow({
        codigo_produto: p.codigo_produto,
        codigo_omie: p.codigo_omie,
        name: p.name,
        desc: p.desc,
        type: p.type,
        id_type: p.id_type,
        valor_un: p.valor_un,
        primeira_loja: p.primeira_loja,
        id: p.id,
        cod_integ: p.cod_integ,
        estoque_vitoria: p.estoque_vitoria,
        estoque_uniao: p.estoque_uniao,
        estoque_linhares: p.estoque_linhares,
        estoque_supertela: p.estoque_supertela,
        estoque_telarame: p.estoque_telarame,
        estoque_estruturaco: p.estoque_estruturaco,
        estoque_vitoria_dm1: p.estoque_vitoria_dm1,
        estoque_uniao_dm1: p.estoque_uniao_dm1,
        estoque_linhares_dm1: p.estoque_linhares_dm1,
        estoque_supertela_dm1: p.estoque_supertela_dm1,
        estoque_telarame_dm1: p.estoque_telarame_dm1,
        estoque_estruturaco_dm1: p.estoque_estruturaco_dm1,
        estoque_total: p.estoque_total,
        estoque_total_dm1: p.estoque_total_dm1,
        D: p.D ? p.D.toLocaleDateString("pt-BR") : undefined, // Formata a data
        DM1: p.DM1 ? p.DM1.toLocaleDateString("pt-BR") : undefined, // Formata a data
      });
    });

    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  getLastMovementScan(): string {
    return this.lastMovementScan
      ? this.lastMovementScan.toLocaleString("pt-BR")
      : "00/00/00 00:00:00";
  }
}
