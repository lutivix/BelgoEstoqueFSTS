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
import { ScanMetadata } from "./entities/scan-metadata.entity";

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
  public isLoadingInitial = false; // Flag pra controlar o loadInitial

  // Rodar no startup da aplicação
  async onModuleInit() {
    this.logger.log("Inicializando aplicação: carregando produtos do banco", "L");
    const productsFromDb = await this.loadProductsFromDb();
    this.logger.log(`Carregados ${productsFromDb.length} produtos do banco`, "L");
    // Aqui você pode armazenar productsFromDb em uma variável global se precisar

    // const dto = new ListMovementsRequestDto(); // Crie uma instância do DTO
    // // Opcional: configure o DTO se precisar de parâmetros específicos, como cod_produto
    // dto.pagina = 1;
    // dto.registros_por_pagina = 1000;

    // const processed = await this.listMovements(null, dto); // null para todas as empresas
    // console.log(`Movimentos processados: ${processed}`); // Log simples no console
  }

  async loadProductsFromDb(): Promise<OmieProductFromDb[]> {
    const products = await this.productRepo.find();
    const stocks = await this.stockRepo.find();
    const omieProducts: OmieProductFromDb[] = [];

    for (const product of products) {
      const stock = stocks.find((s) => s.omiePrdId === product.codigo_omie);
      // Sempre gera o OmieProductFromDb, mesmo sem stock
      const omieProduct = await this.mapToOmieProductFromDb(product, stock);
      omieProducts.push(omieProduct);
    }

    return omieProducts;
  }

  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Stock) private stockRepo: Repository<Stock>,
    private configService: ConfigService,
    private logger: LoggerService, // Injete o logger
    @InjectConnection() private connection: Connection, // Injete com @InjectConnection
    @InjectRepository(ScanMetadata) private scanMetadataRepo: Repository<ScanMetadata>,
  ) {
    this.logger.log("ProductsService inicializado", "O");
  }

  // Função pra pegar ou inicializar a última data de varredura
  async getLastMovementScan(): Promise<Date> {
    let metadata = await this.scanMetadataRepo.findOne({ where: { id: 1 } });
    if (!metadata) {
      metadata = this.scanMetadataRepo.create({
        id: 1, // ID fixo pra simplificar
        lastMovementScan: new Date(0), // Data inicial bem antiga
      });
      await this.scanMetadataRepo.save(metadata);
    }
    return metadata.lastMovementScan;
  }

  // Função pra atualizar a última data de varredura
  private async updateLastMovementScan(date: Date): Promise<void> {
    let metadata = await this.scanMetadataRepo.findOne({ where: { id: 1 } });
    if (!metadata) {
      metadata = this.scanMetadataRepo.create({ id: 1, lastMovementScan: date });
    } else {
      metadata.lastMovementScan = date;
    }
    await this.scanMetadataRepo.save(metadata);
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

  async loadInitialProducts(
    empresa: string | null,
  ): Promise<{ message: string; products: OmieProductFromDb[] }> {
    const empresasParaProcessar = empresa ? [empresa] : this.EMPRESAS; // Usa todas as empresas se null
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const d10 = tenDaysAgo.toLocaleDateString("pt-BR"); // Ex.: "16/03/2025"
    let totalPaginas = 0;
    let totalRegistros = 0;
    const startTime = Date.now();

    this.isLoadingInitial = true;

    this.logger.log(
      `Carga inicial para ${empresasParaProcessar.join(", ")} em ${d10} iniciada!`,
      "L",
    );

    for (const emp of empresasParaProcessar) {
      let pagina = 1;
      do {
        const dto = new ListProductsRequestDto();
        dto.pagina = pagina;
        dto.registros_por_pagina = 1000;
        const response = await this.listProducts(emp, dto);
        if (pagina === 1) {
          totalPaginas = response.total_de_paginas || 1;
          totalRegistros = response.total_de_registros || 0;
        }
        this.logger.log(`${emp} - Página ${pagina} de ${totalPaginas} de Produtos carregada!`, "L");
        pagina++;
      } while (pagina <= totalPaginas);
      this.logger.log(`${emp} - ${totalRegistros} registros de produtos tratados!`, "L");

      pagina = 1;

      do {
        // Carregar estoque inicial para D-10
        const stockDto = new ListStockPositionRequestDto();
        stockDto.nPagina = pagina;
        stockDto.nRegPorPagina = 1000;
        const response = await this.listStockPosition(emp, stockDto, true);
        if (pagina === 1) {
          totalPaginas = response.total_de_paginas || 1;
          totalRegistros = response.total_de_registros || 0;
        }
        this.logger.log(`${emp} - Página ${pagina} de ${totalPaginas} de Estoque  carregada!`, "L");
        pagina++;
      } while (pagina <= totalPaginas);
      this.logger.log(`${emp} - ${totalRegistros} registros de estoques tratados!`, "L");
    }

    const allProducts = await this.productRepo.find({
      where: empresasParaProcessar.map((emp) => ({ primeira_loja: emp })),
    });
    const result = await Promise.all(allProducts.map((p) => this.mapToOmieProductFromDb(p)));
    const duration = (Date.now() - startTime) / 1000;
    this.logger.log(
      `Carga inicial para ${empresasParaProcessar.join(", ")} em ${d10} concluída, tempo: ${duration}s`,
      "O",
    );
    await this.updateLastMovementScan(tenDaysAgo); // Atualiza a última data processada

    this.isLoadingInitial = false;

    return {
      message: `Carga inicial para ${empresasParaProcessar.join(", ")} em ${d10} concluída, tempo: ${duration}s`,
      products: result,
    };
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
          registros_por_pagina: dto.registros_por_pagina ?? 1000,
        };

        const requestBody = {
          call: "ListarProdutos",
          app_key: appKey,
          app_secret: appSecret,
          param: [params],
        };

        const response = await axios.post<ProdutoServicoListFullResponse>(url, requestBody, {
          headers: { "Content-Type": "application/json" },
        });

        totalPaginas = Math.max(totalPaginas, response.data.total_de_paginas);
        totalRegistros += response.data.total_de_registros;

        this.logger.log(
          `${emp} - Carregando produtos, página ${dto.pagina} de ${totalPaginas}`,
          "L",
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

        this.logger.log(`${emp} - ${allResults.length} produtos retornados!`, "L");
      } catch (error) {
        this.logger.error(`${emp} - Erro na chamada à Omie: ${error.message}`, error.stack);
        continue; // Pula para a próxima empresa se a chamada à API falhar
      }
    }

    return Object.assign(allResults, {
      total_de_paginas: totalPaginas,
      total_de_registros: totalRegistros,
    });
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
    isInitialLoad: boolean = false, // Novo parâmetro pra carga inicial
  ): Promise<
    OmieProductFromDb[] & {
      total_de_paginas: number;
      total_de_registros: number;
    }
  > {
    const empresasParaProcessar = empresa ? [empresa] : this.EMPRESAS;
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const d10 = tenDaysAgo.toLocaleDateString("pt-BR"); // Ex.: "16/03/2025"

    let allProductsWithStock: OmieProductFromDb[] = [];
    let totalPaginas = 0;
    let totalRegistros = 0;

    for (const emp of empresasParaProcessar) {
      try {
        // this.logger.log(`${emp} - Carga de estoque em ${d10}`, "L");

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
              nRegPorPagina: dto.nRegPorPagina ?? 1000,
              dDataPosicao: d10, // Usa D-10 fixo
              cExibeTodos: "N",
              codigo_local_estoque: 0,
            },
          ],
        };

        // this.logger.log(`${emp} - Chamando Omie para estoque em ${d10}`, "L");
        const response = await axios.post<ListarEstPosResponse>(url, requestBody, {
          headers: { "Content-Type": "application/json" },
        });

        totalPaginas = Math.max(totalPaginas, response.data.nTotPaginas);
        totalRegistros += response.data.nTotRegistros;

        this.logger.log(
          `${emp} - Carregando estoque, página ${dto.nPagina} de ${totalPaginas}`,
          "L",
        );

        const stockData = response.data.produtos;
        if (isInitialLoad) {
          await this.saveStock(stockData, emp); // Carga inicial
        } else {
          await this.updateStock(stockData, emp); // Atualização normal
        }

        const produtosDb = await this.productRepo.find({
          where: { primeira_loja: emp },
        });
        const produtosComEstoque = await Promise.all(
          produtosDb.map((p) => this.mapToOmieProductFromDb(p)),
        );
        allProductsWithStock = [...allProductsWithStock, ...produtosComEstoque];

        // Corrigir o count
        const stockCount = await this.stockRepo.count();
        this.logger.log(`${emp} - Estoque de ${stockCount} produtos retornados!`, "L");
      } catch (error) {
        this.logger.error(
          `${emp} - Erro ao listar posição de estoque para: ${error.message}`,
          error.stack,
        );
        continue;
      }
    }

    // this.logger.log(`Estoque concluída para ${allProductsWithStock.length} produtos`, "L");
    return Object.assign(allProductsWithStock, {
      total_de_paginas: totalPaginas,
      total_de_registros: totalRegistros,
    });
  }

  async listMovements(empresa: string | null, dto: ListMovementsRequestDto) {
    const empresasParaProcessar = empresa ? [empresa] : this.EMPRESAS;
    let processedMovements = 0;
    const updatedProducts: OmieProductFromDb[] = []; // Lista pra armazenar produtos atualizados

    // Função auxiliar pra zerar o horário
    const getDateOnly = (date: Date): Date => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0); // Zera horas, minutos, segundos e milissegundos
      return d;
    };

    const lastScan = await this.getLastMovementScan();
    let movementDate = getDateOnly(lastScan);
    const today = getDateOnly(new Date());

    if (movementDate < today) {
      movementDate.setDate(movementDate.getDate() + 1);
    } else {
      movementDate = today;
    }

    this.logger.log(`Última varredura: ${lastScan.toLocaleDateString("pt-BR")}`, "L");

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

    // Set pra rastrear produtos já totalizados no dia atual
    const productsTotalized = new Set<string>();

    processedMovements = 0; // Resetar a cada processamento de um dia

    // Loop para avançar dias até encontrar movimentações ou chegar ao dia atual
    // mas só trata no máximo 2 dias de uma só vez. Só pra poder alterar a data maior!
    while (movementDate <= today && processedMovements < 3) {
      const currentDateStr = movementDate.toLocaleDateString("pt-BR");

      this.logger.log(`Processando movimentos para ${currentDateStr}`, "L");

      for (const emp of empresasParaProcessar) {
        try {
          const { appKey, appSecret } = this.getOmieConfig(emp);
          const url = "https://app.omie.com.br/api/v1/estoque/movestoque/";

          const params = {
            pagina: dto.pagina ?? 1,
            registros_por_pagina: dto.registros_por_pagina ?? 1000,
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

          // this.logger.log(`Chamando Omie para movimentos de ${emp}`, "L");
          const response = await axios.post<ListMovementsResponse>(url, requestBody, {
            headers: { "Content-Type": "application/json" },
          });

          const cadastros = response.data.cadastros || [];
          this.logger.log(`Recebidos ${cadastros.length} movimentos para ${emp}`, "O");

          for (const cadastro of cadastros) {
            const movements = cadastro.movimentos || [];

            for (const item of movements) {
              try {
                const product = await this.productRepo.findOne({
                  where: { codigo_omie: cadastro.cCodigo },
                });

                if (!product) {
                  this.logger.warn(`Produto ${item.cCodProd} não encontrado para ${emp}`, "P");
                  continue;
                }

                const stock = await this.stockRepo.findOne({
                  where: { omiePrdId: cadastro.cCodigo },
                });

                if (!stock) {
                  this.logger.warn(
                    `Estoque não encontrado para ${product.codigo_omie} em ${emp}`,
                    "P",
                  );
                  continue;
                }

                // Corrigir o parsing da data
                const [day, month, year] = item.dDataMovimento.split("/").map(Number);
                const movementDateItemRaw = new Date(year, month - 1, day); // -1 porque mês começa em 0
                if (isNaN(movementDateItemRaw.getTime())) {
                  this.logger.error(`Data inválida em dDataMovimento: ${item.dDataMovimento}`, "P");
                  continue; // Pula se a data for inválida
                }

                const movementDateItem = movementDateItemRaw > today ? today : movementDateItemRaw;
                if (movementDateItemRaw > today) {
                  this.logger.warn(
                    `Data de movimento (${movementDateItemRaw.toLocaleDateString("pt-BR")}) 
                    é futura. Limitada a ${today.toLocaleDateString("pt-BR")}`,
                    "P",
                  );
                }

                const aux = getDateOnly(stock.DHoje); // Normaliza DHoje pra meia-noite
                const auxm1 = stock.DMenos1 ? getDateOnly(stock.DMenos1) : null;

                const fields = stockFields[emp.toUpperCase()];
                if (!fields) {
                  this.logger.warn(`Loja ${emp} não reconhecida`, "P");
                  continue;
                }

                const movementQty = (item.nQtdeEntradas || 0) - (item.nQtdeSaidas || 0);

                const productKey = `${product.codigo_omie}-${currentDateStr}`;
                const isFirstPass = !productsTotalized.has(productKey);

                // Comparar só a data, sem horário
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
                    ((stock[fields.today] as number | undefined) ?? 0) + movementQty;

                  stock.EST_TOTAL_HOJE =
                    (stock.EST_VIX || 0) +
                    (stock.EST_TEL || 0) +
                    (stock.EST_SUP || 0) +
                    (stock.EST_UNI || 0) +
                    (stock.EST_LIN || 0) +
                    (stock.EST_EST || 0);

                  productsTotalized.add(productKey); // Marca como totalizado

                  this.logger.log(
                    `ND: ${product.codigo_omie} em ${emp} - ` +
                      `DM1: ${stock.DMenos1?.toLocaleDateString("pt-BR")}, D: ${stock.DHoje.toLocaleDateString("pt-BR")}, ` +
                      `Qt: ${movementQty.toFixed(3)}, EstDM1: ${stock[fields.dm1]?.toFixed(3)}, ` +
                      `EstD: ${stock[fields.today]?.toFixed(3)}, ` +
                      `TotDM1: ${stock.EST_TOTAL_DM1?.toFixed(3)}, TotD: ${stock.EST_TOTAL_HOJE?.toFixed(3)}`,
                    "P",
                  );
                } else if (movementDateItem.getTime() === aux.getTime()) {
                  stock.DHoje = movementDateItem;
                  const oldStock = (stock[fields.dm1] as number | undefined) ?? 0;
                  stock[fields.today] = oldStock + movementQty;

                  if (isFirstPass) {
                    // Só recalcula o total na primeira passagem
                    stock.EST_TOTAL_HOJE =
                      (stock.EST_TOTAL_DM1 || 0) -
                      oldStock +
                      ((stock[fields.today] as number | undefined) ?? 0);
                    productsTotalized.add(productKey); // Marca como totalizado
                    this.logger.log(
                      `MD Rcl: ${product.codigo_omie} em ${emp} - ` +
                        `DM1: ${stock.DMenos1?.toLocaleDateString("pt-BR")}, D: ${stock.DHoje.toLocaleDateString("pt-BR")}, ` +
                        `Qt: ${movementQty.toFixed(3)}, EstDM1: ${stock[fields.dm1]?.toFixed(3)}, ` +
                        `EstD: ${stock[fields.today]?.toFixed(3)}, ` +
                        `TotDM1: ${stock.EST_TOTAL_DM1?.toFixed(3)}, TotD: ${stock.EST_TOTAL_HOJE?.toFixed(3)}`,
                      "P",
                    );
                  } else {
                    //  Recalcular o total sem usar o Total DM1
                    stock.EST_TOTAL_HOJE =
                      (stock.EST_VIX || 0) +
                      (stock.EST_TEL || 0) +
                      (stock.EST_SUP || 0) +
                      (stock.EST_UNI || 0) +
                      (stock.EST_LIN || 0) +
                      (stock.EST_EST || 0);

                    this.logger.log(
                      `MD: ${product.codigo_omie} em ${emp} - ` +
                        `DM1: ${auxm1?.toLocaleDateString("pt-BR")}, D: ${movementDateItem.toLocaleDateString("pt-BR")}, ` +
                        `Qt: ${movementQty}, EstDM1: ${stock[fields.dm1]?.toFixed(3)}, EstD: ${stock[fields.today]?.toFixed(3)}, ` +
                        `TotDM1: ${stock.EST_TOTAL_DM1?.toFixed(3)}, TotD: ${stock.EST_TOTAL_HOJE?.toFixed(3)}`,
                      "P",
                    );
                  }
                } else {
                  stock.DHoje = aux;
                  this.logger.log(
                    `DA: ${product.codigo_omie} em ${emp} - D: ${movementDateItem.toLocaleDateString("pt-BR")}`,
                    "P",
                  );
                  continue;
                }

                await this.stockRepo.save(stock);

                // Gerar OmieProductFromDb atualizado e adicionar à lista
                const updatedProduct = await this.mapToOmieProductFromDb(product);
                updatedProducts.push(updatedProduct);
              } catch (error) {
                this.logger.error(
                  `Erro ao processar movimento ${item.id || item.cCodProd} do produto ${cadastro.cCodigo} para ${emp}: ${error.message}`,
                  error.stack,
                );
                continue;
              }
            }
          }

          if (this.isLoadingInitial || movementDate < today) {
            this.lastMovementScan = movementDate;
          } else {
            this.lastMovementScan = new Date();
          }

          await this.updateLastMovementScan(this.lastMovementScan); // Atualiza a última data processada
        } catch (error) {
          this.logger.error(`Erro ao listar movimentos para ${emp}: ${error.message}`, error.stack);
          continue;
        }
      }

      processedMovements++;

      // Se não tiver processado um dia anterior a hoje avançar para o próximo dia
      if (movementDate < today) {
        movementDate.setDate(movementDate.getDate() + 1);
        if (processedMovements < 3) {
          this.logger.log(
            `Movimentação para  ${currentDateStr} finalizada. Avançando para ${movementDate.toLocaleDateString("pt-BR")}`,
            "L",
          );
        } else {
          this.logger.log(`Movimentação para  ${currentDateStr} finalizada. `, "L");
        }
      } else {
        break; // Sai do loop se houve movimentações ou chegou ao dia atual
      }
    }

    // this.logger.log(`Total de ${processedMovements} movimentos processados`, "L");
    return processedMovements;
  }

  private async saveOrUpdateProducts(products: ProdutoServicoCadastro[], empresa: string) {
    for (const prod of products) {
      try {
        // this.logger.error(`Buscando produto existente: ${prod.codigo}`);
        const existingProduct = await this.productRepo.findOne({
          where: { codigo_omie: prod.codigo },
        });
        const product = existingProduct || new Product();

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
        // this.logger.error(`cod_integ antes do save: ${product.cod_integ}`);

        product.valor_un = prod.valor_unitario ?? existingProduct?.valor_un ?? 0;
        product.primeira_loja = empresa;

        await this.productRepo.save(product);
        this.logger.log(
          `${empresa} - Produto ${prod.codigo} ${existingProduct ? "atualizado" : "inserido"}`,
          "P",
        );
      } catch (error) {
        this.logger.error(
          `${empresa} - Erro ao processar produto ${prod.codigo}: ${error.message}`,
          error.stack,
        );
        continue; // Pula para o próximo produto, não para a próxima empresa
      }
    }
  }

  private async saveStock(stockData: any[], empresa: string): Promise<void> {
    const empresaUpper = empresa.toUpperCase();

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10); // D-10
    const elevenDaysAgo = new Date(tenDaysAgo);
    elevenDaysAgo.setDate(elevenDaysAgo.getDate() - 1); // D-11

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
              DHoje: tenDaysAgo,
              DMenos1: elevenDaysAgo,
            });
          } else {
            stockEntity.DHoje = tenDaysAgo;
            stockEntity.DMenos1 = elevenDaysAgo;
          }

          // Define o estoque atual (D) baseado na empresa
          const currentStock = stock.nSaldo || 0;
          switch (empresaUpper) {
            case "VITORIA":
              stockEntity.EST_VIX = currentStock;
              break;
            case "TELARAME":
              stockEntity.EST_TEL = currentStock;
              break;
            case "SUPERTELAS":
              stockEntity.EST_SUP = currentStock;
              break;
            case "UNIAO":
              stockEntity.EST_UNI = currentStock;
              break;
            case "LINHARES":
              stockEntity.EST_LIN = currentStock;
              break;
            case "ESTRUTURACO":
              stockEntity.EST_EST = currentStock;
              break;
            default:
              this.logger.warn(`Loja ${empresa} não reconhecida`, "P");
              continue;
          }

          // Replicar valores de D pra D-1 na carga inicial
          stockEntity.EST_VIX_DM1 = stockEntity.EST_VIX || 0;
          stockEntity.EST_TEL_DM1 = stockEntity.EST_TEL || 0;
          stockEntity.EST_SUP_DM1 = stockEntity.EST_SUP || 0;
          stockEntity.EST_UNI_DM1 = stockEntity.EST_UNI || 0;
          stockEntity.EST_LIN_DM1 = stockEntity.EST_LIN || 0;
          stockEntity.EST_EST_DM1 = stockEntity.EST_EST || 0;

          // Calcular totais
          stockEntity.EST_TOTAL_HOJE =
            [
              stockEntity.EST_VIX,
              stockEntity.EST_TEL,
              stockEntity.EST_SUP,
              stockEntity.EST_UNI,
              stockEntity.EST_LIN,
              stockEntity.EST_EST,
            ]
              .filter((val) => val !== undefined && val !== null)
              .reduce((sum, val) => sum + val, 0) || 0;

          stockEntity.EST_TOTAL_DM1 =
            [
              stockEntity.EST_VIX_DM1,
              stockEntity.EST_TEL_DM1,
              stockEntity.EST_SUP_DM1,
              stockEntity.EST_UNI_DM1,
              stockEntity.EST_LIN_DM1,
              stockEntity.EST_EST_DM1,
            ]
              .filter((val) => val !== undefined && val !== null)
              .reduce((sum, val) => sum + val, 0) || 0;

          await this.stockRepo.save(stockEntity);
          this.logger.log(`${empresa} - Estoque inicial para ${product.codigo_omie} salvo!`, "P");
        } else {
          this.logger.warn(`${empresa} - Produto ${stock.cCodigo} não cadastrado!`, "P");
        }
      } catch (error) {
        this.logger.error(
          `${empresa} - Erro ao salvar estoque para ${stock.cCodigo}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  private async updateStock(stockData: any[], empresa: string): Promise<void> {
    const empresaUpper = empresa.toUpperCase();

    for (const stock of stockData) {
      try {
        const product = await this.productRepo.findOne({
          where: { codigo_omie: stock.cCodigo },
        });

        if (!product) {
          this.logger.warn(`${empresa} - Produto ${stock.cCodigo} não cadastrado!`, "P");
          continue;
        }

        let stockEntity = await this.stockRepo.findOne({
          where: { omiePrdId: product.codigo_omie },
        });

        if (!stockEntity) {
          this.logger.warn(
            `${empresa} - Estoque não encontrado para ${product.codigo_omie}, criando novo!`,
            "P",
          );
          stockEntity = this.stockRepo.create({
            omiePrdId: product.codigo_omie,
            DHoje: new Date(), // Hoje como fallback
            DMenos1: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ontem
          });
        }

        // Atualiza apenas o estoque da empresa específica (D), sem sobrescrever D-1
        const currentStock = stock.nSaldo || 0;
        switch (empresaUpper) {
          case "VITORIA":
            stockEntity.EST_VIX = currentStock;
            break;
          case "TELARAME":
            stockEntity.EST_TEL = currentStock;
            break;
          case "SUPERTELAS":
            stockEntity.EST_SUP = currentStock;
            break;
          case "UNIAO":
            stockEntity.EST_UNI = currentStock;
            break;
          case "LINHARES":
            stockEntity.EST_LIN = currentStock;
            break;
          case "ESTRUTURACO":
            stockEntity.EST_EST = currentStock;
            break;
          default:
            this.logger.warn(`Loja ${empresa} não reconhecida`, "P");
            continue;
        }

        // Recalcula EST_TOTAL_HOJE sem tocar em D-1
        stockEntity.EST_TOTAL_HOJE =
          [
            stockEntity.EST_VIX,
            stockEntity.EST_TEL,
            stockEntity.EST_SUP,
            stockEntity.EST_UNI,
            stockEntity.EST_LIN,
            stockEntity.EST_EST,
          ]
            .filter((val) => val !== undefined && val !== null)
            .reduce((sum, val) => sum + val, 0) || 0;

        await this.stockRepo.save(stockEntity);
        this.logger.log(`${empresa} - Estoque atualizado para ${product.codigo_omie}!`, "P");
      } catch (error) {
        this.logger.error(
          `${empresa} - Erro ao atualizar estoque para ${stock.cCodigo}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  async mapToOmieProductFromDb(product: Product, stock?: Stock): Promise<OmieProductFromDb> {
    return {
      codigo_produto: product.codigo_produto, // Assumindo que existe em Product
      codigo_omie: product.codigo_omie,
      name: product.name, // Ou product.name, dependendo do nome real no Product
      desc: product.desc ?? undefined, // Opcional, usa undefined se não existir
      type: product.type ?? undefined, // Opcional
      id_type: product.id_type ?? undefined, // Opcional
      valor_un: product.valor_un ?? 0, // 0 se não existir
      primeira_loja: product.primeira_loja ?? "", // String vazia se não existir
      id: product.ID, // Assumindo que Product tem um campo id
      cod_integ: product.cod_integ ?? 0, // 0 se não existir
      estoque_vitoria: stock?.EST_VIX ?? 0,
      estoque_uniao: stock?.EST_UNI ?? 0,
      estoque_linhares: stock?.EST_LIN ?? 0,
      estoque_supertela: stock?.EST_SUP ?? 0,
      estoque_telarame: stock?.EST_TEL ?? 0,
      estoque_estruturaco: stock?.EST_EST ?? 0,
      estoque_vitoria_dm1: stock?.EST_VIX_DM1 ?? 0,
      estoque_uniao_dm1: stock?.EST_UNI_DM1 ?? 0,
      estoque_linhares_dm1: stock?.EST_LIN_DM1 ?? 0,
      estoque_supertela_dm1: stock?.EST_SUP_DM1 ?? 0,
      estoque_telarame_dm1: stock?.EST_TEL_DM1 ?? 0,
      estoque_estruturaco_dm1: stock?.EST_EST_DM1 ?? 0,
      estoque_total: stock?.EST_TOTAL_HOJE ?? 0,
      estoque_total_dm1: stock?.EST_TOTAL_DM1 ?? 0,
      D: stock?.DHoje ?? undefined, // Mantém como Date, sem conversão pra string
      DM1: stock?.DMenos1 ?? undefined, // Mantém como Date, sem conversão pra string
    };
  }

  async exportToExcel(empresa: string): Promise<Buffer> {
    const produtos = await this.listStockPosition(empresa, new ListStockPositionRequestDto());
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

  async clearDatabase() {
    try {
      // Primeiro, limpa EstoqueBelgo (tabela dependente)
      await this.stockRepo.query("DELETE FROM EstoqueBelgo");
      await this.stockRepo.query("DBCC CHECKIDENT ('EstoqueBelgo', RESEED, 0)");

      // Depois, limpa OmieProduto (tabela referenciada)
      await this.productRepo.query("DELETE FROM OmieProduto");
      await this.productRepo.query("DBCC CHECKIDENT ('OmieProduto', RESEED, 0)");

      this.logger.log("Base de dados zerada com sucesso", "L");
    } catch (error) {
      this.logger.error(`Erro ao zerar base: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getEstoquePorLoja(
    familia?: string,
    dataStr?: string,
  ): Promise<
    {
      name: string;
      type: string;
      estoque_total: number;
      estoque_minimo: number;
      emFalta: number;
      porLoja: {
        vitoria: number;
        uniao: number;
        linhares: number;
        supertela: number;
        telarame: number;
        estruturaco: number;
      };
    }[]
  > {
    const produtos = await this.loadProductsFromDb();

    return produtos
      .filter((p) => {
        const familiaOk = !familia || familia.toLowerCase() === (p.type || "").toLowerCase();
        const dataOk = !dataStr || (p.D && p.D.toISOString().startsWith(dataStr));
        return familiaOk && dataOk;
      })
      .map((p) => {
        const porLoja = {
          vitoria: p.estoque_vitoria ?? 0,
          uniao: p.estoque_uniao ?? 0,
          linhares: p.estoque_linhares ?? 0,
          supertela: p.estoque_supertela ?? 0,
          telarame: p.estoque_telarame ?? 0,
          estruturaco: p.estoque_estruturaco ?? 0,
        };

        const estoque_total = Object.values(porLoja).reduce((soma, val) => soma + val, 0);
        const estoque_minimo = 6 * 40; // 40 por loja
        const emFalta = Number(((estoque_total / estoque_minimo) * 100).toFixed(2));

        return {
          name: p.name,
          type: p.type ?? "", // Aqui está a família
          estoque_total,
          estoque_minimo,
          emFalta, // Percentual
          porLoja,
        };
      })
      .sort((a, b) => a.estoque_total - b.estoque_total); // Ordena do menor pro maior
  }

  async getEstoqueDetalhado(
    dataStr?: string,
    familia?: string,
    produto?: string,
    lojas?: string[],
  ): Promise<
    {
      name: string;
      type: string;
      D: string;
      estoque_total: number;
      estoque_minimo: number;
      emFalta: number;
      porLoja: Record<string, number>;
    }[]
  > {
    const produtos = await this.loadProductsFromDb();

    const todasAsLojas = ["vitoria", "uniao", "linhares", "supertela", "telarame", "estruturaco"];

    const lojasArray = Array.isArray(lojas) ? lojas : lojas ? [lojas] : [];
    const lojasFiltradas = lojasArray.length ? lojasArray : todasAsLojas;

    // this.logger.logFrontend("🔍 Lojas filtradas: " + lojasFiltradas);

    return produtos
      .filter((p) => {
        const dataOk = !dataStr || (p.D && p.D.toISOString().startsWith(dataStr));

        const normalize = (str: string) =>
          str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

        const familiaOk = !familia || (p.type && normalize(p.type).includes(normalize(familia)));
        const produtoOk = !produto || p.name?.toLowerCase().includes(produto.toLowerCase());

        const lojaOk =
          lojasArray.length === 0 ||
          lojasFiltradas.some((loja) => (p[`estoque_${loja}`] ?? 0) !== 0);

        return dataOk && familiaOk && produtoOk && lojaOk;
      })

      .map((p) => {
        const porLoja = Object.fromEntries(
          lojasFiltradas.map((loja) => [loja, p[`estoque_${loja}`] ?? 0]),
        ) as {
          vitoria: number;
          uniao: number;
          linhares: number;
          supertela: number;
          telarame: number;
          estruturaco: number;
        };
        const estoque_total = Object.values(porLoja).reduce((soma, val) => soma + val, 0);
        const estoque_minimo = 6 * 40;
        const emFalta = Number(((estoque_total / estoque_minimo) * 100).toFixed(2));

        return {
          name: p.name,
          type: p.type ?? "Sem Família",
          D: p.D?.toISOString().split("T")[0] ?? "",
          estoque_total,
          estoque_minimo,
          emFalta,
          porLoja,
        };
      })
      .sort((a, b) => a.emFalta - b.emFalta);
  }
}
