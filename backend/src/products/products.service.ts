// src/products/products.service.ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Connection } from "typeorm"; // Adicione Connection aqui
import { InjectConnection } from "@nestjs/typeorm"; // Adicione isso para injeção
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
import { ListMovementsResponse } from "./interfaces/omie-movement-response.interface";

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
    @InjectConnection() private connection: Connection, // Injete com @InjectConnection
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
    const empresasParaProcessar = empresa ? [empresa] : this.EMPRESAS;

    this.logger.log(
      `Listando produtos para ${empresasParaProcessar.join(", ")}, página ${dto.pagina}`,
      "L",
    );

    let allResults: OmieProductFromDb[] = [];
    let totalPaginas = 0;
    let totalRegistros = 0;

    for (const emp of empresasParaProcessar) {
      try {
        const { appKey, appSecret } = this.getOmieConfig(emp);
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
        await this.saveOrUpdateProducts(products, emp);
        const savedProducts = await this.productRepo.find({
          where: { primeira_loja: emp },
        });

        const mappedProducts = await Promise.all(
          savedProducts.map((p) => this.mapToOmieProductFromDb(p)),
        );

        allResults = [...allResults, ...mappedProducts];
        totalPaginas = Math.max(totalPaginas, response.data.total_de_paginas);
        totalRegistros += response.data.total_de_registros;

        this.logger.log(`Produtos retornados para ${emp}`, "O");
      } catch (error) {
        this.logger.error(`Erro na chamada à Omie: ${error.message}`);
        continue; // Pula para a próxima empresa se a chamada à API falhar
      }
    }

    return Object.assign(allResults, {
      total_de_paginas: totalPaginas,
      total_de_registros: totalRegistros,
    });
  }

  async loadInitialProducts(
    empresa: string | null,
  ): Promise<{ message: string; products: OmieProductFromDb[] }> {
    const empresasParaProcessar = empresa ? [empresa] : this.EMPRESAS; // Usa todas as empresas se null
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const d10 = tenDaysAgo.toLocaleDateString("pt-BR"); // Ex.: "16/03/2025"
    let totalPaginas = 0;
    const startTime = Date.now();

    this.logger.log(
      `Iniciando carga inicial para ${empresasParaProcessar.join(", ")} em ${d10}`,
      "L",
    );

    for (const emp of empresasParaProcessar) {
      let pagina = 1;
      do {
        const dto = new ListProductsRequestDto();
        dto.pagina = pagina;
        dto.registros_por_pagina = 500;
        const response = await this.listProducts(emp, dto);
        if (pagina === 1) {
          totalPaginas = response.total_de_paginas || 1;
        }
        this.logger.log(
          `Carregando página ${pagina} de ${totalPaginas} para ${emp}`,
          "L",
        );
        pagina++;
      } while (pagina <= totalPaginas);

      // Carregar estoque inicial para D-10
      const stockDto = new ListStockPositionRequestDto();
      stockDto.nPagina = 1;
      stockDto.nRegPorPagina = 500;
      await this.listStockPosition(emp, stockDto);
    }

    const allProducts = await this.productRepo.find({
      where: empresasParaProcessar.map((emp) => ({ primeira_loja: emp })),
    });
    const result = await Promise.all(
      allProducts.map((p) => this.mapToOmieProductFromDb(p)),
    );
    const duration = (Date.now() - startTime) / 1000;
    return {
      message: `Carga inicial concluída para ${empresasParaProcessar.join(", ")} em ${d10}, tempo: ${duration}s`,
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
    const empresasParaProcessar = empresa ? [empresa] : this.EMPRESAS;
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const d10 = tenDaysAgo.toLocaleDateString("pt-BR"); // Ex.: "16/03/2025"

    let allProductsWithStock: OmieProductFromDb[] = [];

    for (const emp of empresasParaProcessar) {
      try {
        const { appKey, appSecret } = this.getOmieConfig(emp);
        const url = "https://app.omie.com.br/api/v1/estoque/consulta/";
        const empresaUpper = emp.toUpperCase();
        const lojaMap: { [key: string]: number } = {
          VITORIA: 1,
          TELARAME: 2,
          SUPERTELAS: 3,
          UNIAO: 4,
          LINHARES: 5,
          ESTRUTURACO: 6,
        };
        const codigoLoja = lojaMap[empresaUpper];

        if (!codigoLoja) {
          throw new Error(`Loja ${emp} não reconhecida`);
        }

        const requestBody: ListarEstPosRequest = {
          call: "ListarPosEstoque",
          app_key: appKey,
          app_secret: appSecret,
          param: [
            {
              nPagina: dto.nPagina ?? 1,
              nRegPorPagina: dto.nRegPorPagina ?? 500,
              dDataPosicao: d10, // Usa D-10 fixo
              cExibeTodos: "N",
              codigo_local_estoque: 0,
            },
          ],
        };

        this.logger.log(`Chamando Omie para estoque de ${emp} em ${d10}`, "L");
        const response = await axios.post<ListarEstPosResponse>(
          url,
          requestBody,
          {
            headers: { "Content-Type": "application/json" },
          },
        );

        const stockData = response.data.produtos;
        this.logger.log(
          `Recebidos ${stockData.length} itens de estoque para ${emp}`,
          "L",
        );
        await this.saveStock(stockData, emp);

        const produtosDb = await this.productRepo.find({
          where: { primeira_loja: emp },
        });
        const produtosComEstoque = await Promise.all(
          produtosDb.map((p) => this.mapToOmieProductFromDb(p)),
        );
        allProductsWithStock = [...allProductsWithStock, ...produtosComEstoque];
      } catch (error) {
        this.logger.error(
          `Erro ao listar posição de estoque para ${emp}: ${error.message}`,
        );
        continue;
      }
    }

    this.logger.log(
      `Listagem concluída com ${allProductsWithStock.length} produtos`,
      "L",
    );
    return allProductsWithStock;
  }

  async listMovements(empresa: string | null, dto: ListMovementsRequestDto) {
    const empresasParaProcessar = empresa ? [empresa] : this.EMPRESAS;
    let processedMovements = 0;

    // Pegar a data máxima inicial de DHoje
    const maxDateResult = await this.stockRepo
      .createQueryBuilder("stock")
      .select("MAX(stock.DHoje)", "maxDate")
      .getRawOne();
    let movementDate = maxDateResult.maxDate
      ? new Date(maxDateResult.maxDate)
      : null;

    if (!movementDate) {
      this.logger.log("Sem estoque registrado. Usando D-10 como fallback", "L");
      movementDate = new Date();
      movementDate.setDate(movementDate.getDate() - 10);
    }

    const today = new Date(); // Data atual para limite
    let currentDateStr = movementDate.toLocaleDateString("pt-BR"); // Data inicial

    this.logger.log(
      `Iniciando listagem de movimentos a partir de ${currentDateStr}`,
      "L",
    );

    // Tipo para chaves numéricas de Stock
    type StockKey = keyof Pick<
      Stock,
      | "EST_VIX"
      | "EST_TEL"
      | "EST_SUP"
      | "EST_UNI"
      | "EST_LIN"
      | "EST_EST"
      | "EST_VIX_DM1"
      | "EST_TEL_DM1"
      | "EST_SUP_DM1"
      | "EST_UNI_DM1"
      | "EST_LIN_DM1"
      | "EST_EST_DM1"
      | "EST_TOTAL_HOJE"
      | "EST_TOTAL_DM1"
    >;

    // Mapa de campos de estoque por empresa
    const stockFields: { [key: string]: { today: StockKey; dm1: StockKey } } = {
      VITORIA: { today: "EST_VIX", dm1: "EST_VIX_DM1" },
      TELARAME: { today: "EST_TEL", dm1: "EST_TEL_DM1" },
      SUPERTELAS: { today: "EST_SUP", dm1: "EST_SUP_DM1" },
      UNIAO: { today: "EST_UNI", dm1: "EST_UNI_DM1" },
      LINHARES: { today: "EST_LIN", dm1: "EST_LIN_DM1" },
      ESTRUTURACO: { today: "EST_EST", dm1: "EST_EST_DM1" },
    };

    // Loop para avançar dias até encontrar movimentações ou chegar ao dia atual
    while (movementDate <= today && processedMovements === 0) {
      processedMovements = 0; // Resetar a cada tentativa de data
      currentDateStr = movementDate.toLocaleDateString("pt-BR");

      this.logger.log(`Processando movimentos para ${currentDateStr}`, "L");

      for (const emp of empresasParaProcessar) {
        try {
          const { appKey, appSecret } = this.getOmieConfig(emp);
          const url = "https://app.omie.com.br/api/v1/estoque/movestoque/";

          const params = {
            pagina: dto.pagina ?? 1,
            registros_por_pagina: dto.registros_por_pagina ?? 500,
            data_inicial: currentDateStr,
            data_final: currentDateStr,
            codigo_local_estoque: 0,
          };

          const requestBody = {
            call: "ListarMovimentos",
            app_key: appKey,
            app_secret: appSecret,
            param: [params],
          };

          this.logger.log(`Chamando Omie para movimentos de ${emp}`, "L");
          const response = await axios.post<ListMovementsResponse>(
            url,
            requestBody,
            {
              headers: { "Content-Type": "application/json" },
            },
          );

          const movements = response.data.cadastros || [];
          this.logger.log(
            `Recebidos ${movements.length} movimentos para ${emp}`,
            "O",
          );

          for (const item of movements) {
            try {
              const product = await this.productRepo.findOne({
                where: { codigo_omie: item.cCodProd },
              });

              if (!product) {
                this.logger.warn(
                  `Produto ${item.cCodProd} não encontrado para ${emp}`,
                  "P",
                );
                continue;
              }

              const stock = await this.stockRepo.findOne({
                where: { omiePrdId: product.codigo_omie },
              });

              if (!stock) {
                this.logger.warn(
                  `Estoque não encontrado para ${product.codigo_omie} em ${emp}`,
                  "P",
                );
                continue;
              }

              const movementDateItem = new Date(item.dDataMovimento);
              const aux = stock.DHoje;
              const auxm1 = stock.DMenos1;

              const fields = stockFields[emp.toUpperCase()];
              if (!fields) {
                this.logger.warn(`Loja ${emp} não reconhecida`, "P");
                continue;
              }

              const movementQty =
                (item.nQtdeEntradas || 0) - (item.nQtdeSaidas || 0);

              if (movementDateItem.getTime() > aux.getTime()) {
                stock.DMenos1 = aux;
                stock.DHoje = movementDateItem;

                stock.EST_VIX_DM1 = stock.EST_VIX || 0;
                stock.EST_TEL_DM1 = stock.EST_TEL || 0;
                stock.EST_SUP_DM1 = stock.EST_SUP || 0;
                stock.EST_UNI_DM1 = stock.EST_UNI || 0;
                stock.EST_LIN_DM1 = stock.EST_LIN || 0;
                stock.EST_EST_DM1 = stock.EST_EST || 0;
                stock.EST_TOTAL_DM1 = stock.EST_TOTAL_HOJE || 0;

                stock[fields.today] =
                  ((stock[fields.today] as number | undefined) ?? 0) +
                  movementQty;
                stock.EST_TOTAL_HOJE =
                  (stock.EST_VIX || 0) +
                  (stock.EST_TEL || 0) +
                  (stock.EST_SUP || 0) +
                  (stock.EST_UNI || 0) +
                  (stock.EST_LIN || 0) +
                  (stock.EST_EST || 0);

                this.logger.log(
                  `Novo dia: ${product.codigo_omie} em ${emp} - ` +
                    `D-1: ${auxm1.toLocaleString("pt-BR")}, D: ${movementDateItem.toLocaleString("pt-BR")}, ` +
                    `${fields.today}: ${stock[fields.today]}, ${fields.dm1}: ${stock[fields.dm1]}, ` +
                    `Total: ${stock.EST_TOTAL_HOJE}, Total D-1: ${stock.EST_TOTAL_DM1}`,
                  "P",
                );
              } else if (movementDateItem.getTime() === aux.getTime()) {
                stock.DHoje = movementDateItem;
                const oldStock =
                  (stock[fields.today] as number | undefined) ?? 0;
                stock[fields.today] = oldStock + movementQty;
                stock.EST_TOTAL_HOJE =
                  (stock.EST_TOTAL_HOJE || 0) -
                  oldStock +
                  ((stock[fields.today] as number | undefined) ?? 0);

                this.logger.log(
                  `Mesmo dia: ${product.codigo_omie} em ${emp} - ` +
                    `D-1: ${auxm1.toLocaleString("pt-BR")}, D: ${movementDateItem.toLocaleString("pt-BR")}, ` +
                    `${fields.today}: ${stock[fields.today]}, ${fields.dm1}: ${stock[fields.dm1]}, ` +
                    `Total: ${stock.EST_TOTAL_HOJE}, Total D-1: ${stock.EST_TOTAL_DM1}`,
                  "P",
                );
              } else {
                stock.DHoje = aux;
                this.logger.log(
                  `Movimento anterior ignorado: ${product.codigo_omie} em ${emp} - D: ${movementDateItem.toLocaleString("pt-BR")}`,
                  "P",
                );
                continue;
              }

              await this.stockRepo.save(stock);
              processedMovements++;
            } catch (error) {
              this.logger.error(
                `Erro ao processar movimento ${item.id || item.cCodProd} para ${emp}: ${error.message}`,
                error.stack,
              );
              continue;
            }
          }

          this.lastMovementScan = new Date();
        } catch (error) {
          this.logger.error(
            `Erro ao listar movimentos para ${emp}: ${error.message}`,
            error.stack,
          );
          continue;
        }
      }

      // Se não houve movimentações, avançar para o próximo dia
      if (processedMovements === 0 && movementDate < today) {
        movementDate.setDate(movementDate.getDate() + 1);
        this.logger.log(
          `Nenhuma movimentação em ${currentDateStr}. Avançando para ${movementDate.toLocaleDateString("pt-BR")}`,
          "L",
        );
      } else {
        break; // Sai do loop se houve movimentações ou chegou ao dia atual
      }
    }

    this.logger.log(
      `Total de ${processedMovements} movimentos processados`,
      "L",
    );
    return processedMovements;
  }

  private async saveOrUpdateProducts(
    products: ProdutoServicoCadastro[],
    empresa: string,
  ) {
    for (const prod of products) {
      try {
        this.logger.error(`Buscando produto existente: ${prod.codigo}`);
        const existingProduct = await this.productRepo.findOne({
          where: { codigo_omie: prod.codigo },
        });
        const product = existingProduct || new Product();

        this.logger.error(
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
        this.logger.error(`cod_integ antes do save: ${product.cod_integ}`);

        product.valor_un =
          prod.valor_unitario ?? existingProduct?.valor_un ?? 0;
        product.primeira_loja = empresa;

        await this.productRepo.save(product);
        this.logger.log(
          `Produto ${prod.codigo} ${existingProduct ? "atualizado" : "inserido"}`,
          "P",
        );
      } catch (error) {
        this.logger.error(
          `Erro ao processar produto ${prod.codigo}:`,
          error.message,
        );
        continue; // Pula para o próximo produto, não para a próxima empresa
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

  async clearDatabase() {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.query(`TRUNCATE TABLE stock RESTART IDENTITY CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE product RESTART IDENTITY CASCADE`);
    await queryRunner.release();
    this.logger.log("Tabelas product e stock limpas", "L");
  }
}
