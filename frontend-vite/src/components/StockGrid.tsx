import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { OmieProductFromDb } from "../types/omie-product-from-db";
import "./StockGrid.css";
import Layout from "../components/Layout";

const formatDate = (value: string | undefined): string => {
  if (!value) return "-";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
};

const getStockTooltip = (row: OmieProductFromDb): string => {
  const date = formatDate(row.D);
  return `
    Estoques em ${date}:
    - Vitória: ${row.estoque_vitoria ?? "-"}
    - União: ${row.estoque_uniao ?? "-"}
    - Linhares: ${row.estoque_linhares ?? "-"}
    - Supertela: ${row.estoque_supertela ?? "-"}
    - Telarame: ${row.estoque_telarame ?? "-"}
    - Estruturaco: ${row.estoque_estruturaco ?? "-"}
  `.trim();
};

const StockGrid = () => {
  const [products, setProducts] = useState<OmieProductFromDb[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<OmieProductFromDb[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Estado pra sidebar retrátil
  //const isSmallScreen = useMediaQuery("(max-width: 800px)");
  const [page, setPage] = useState(1);
  const itemsPerPage = 15; // Fixo em 10, ou ajuste conforme necessário
  const maxPagesToShow = 3; // Mostra apenas 3 números por vez

  // Detecta tela pequena com window.matchMedia
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 768);

  //Abrindo visualização de estoque
  const [expandedRow, setExpandedRow] = useState<string | null>(null); // Tipagem explícita

  const handleEditClick = (productId: string) => {
    setExpandedRow(expandedRow === productId ? null : productId); // Alterna expansão
  };

  //Atualizando os estoques
  const [editStocks, setEditStocks] = useState<Record<string, Partial<OmieProductFromDb>>>({});
  const handleStockChange = (productId: string, store: keyof OmieProductFromDb, value: string) => {
    setEditStocks((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [store]: value,
      },
    }));
  };

  const handleSaveStocks = (productId: string) => {
    const updatedStocks = editStocks[productId] || {};
    console.log(`Salvando estoques do produto ${productId}:`, updatedStocks);
    // Aqui você pode adicionar uma chamada pra API pra salvar os dados, ex.:
    // await axios.patch(`${backendUrl}/${productId}`, updatedStocks);
    setExpandedRow(null); // Fecha a linha após salvar
  };

  const backendUrl = "http://192.168.7.216:3000/products/db";

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(backendUrl);
        const validProducts = response.data.map((item: any, index: number) => ({
          ...item,
          id: String(item.id ?? index), // Converte id pra string
        }));
        setProducts(validProducts);
        setFilteredProducts(validProducts);
        setLoading(false);
      } catch (error) {
        setErrorMsg(`Erro: ${error.message}`);
        console.error("Erro ao buscar produtos:", error);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter((product) =>
      [product.codigo_omie, product.name, product.type, product.primeira_loja]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  useEffect(() => {
    if (isSmallScreen) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [isSmallScreen]);

  //const layoutWidth = useLayoutWidth(); // Acessa a largura do layout
  //const layoutHeight = useLayoutHeigth();

  //console.log(alturaGrid + " " + largura);

  // No início do StockGrid.tsx, adiciona estados (já tinha sugerido antes, só mantendo)
  const [isFilterTooltipOpen, setIsFilterTooltipOpen] = useState(false);
  const [isAddTooltipOpen, setIsAddTooltipOpen] = useState(false);

  // Estado pra controlar edição nos cartões do celular
  const [editingCard, setEditingCard] = useState<string | null>(null);

  // Função pra toggle da edição no celular
  const handleCardEditClick = (productId: string) => {
    setEditingCard(editingCard === productId ? null : productId);
  };

  // Dentro do return, ajustando o layout
  return (
    <Layout>
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      <div className="grid">
        <div className="actions">
          <div className="actions__searchbox-wrapper">
            <div className="actions__searchbox">
              <img className="actions__search-icon" alt="Pesquisar" src="/images/Search.svg" />
              <input
                className="actions__search-input"
                placeholder="Pesquisar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="actions__select">
              <div
                className="actions__button"
                onClick={() => setIsFilterTooltipOpen(!isFilterTooltipOpen)}
              >
                <img className="icon" alt="Filtro" src="/images/Filter.svg" />
              </div>
            </div>
            {isFilterTooltipOpen && (
              <div className="actions__custom-tooltip actions__filter-tooltip">
                Filtrar categorias (em desenvolvimento)
              </div>
            )}
          </div>
          <div
            className="actions__categoria"
            onClick={() => setIsAddTooltipOpen(!isAddTooltipOpen)}
          >
            <img className="actions_cat-icon" alt="Adicionar" src="/images/Plus.svg" />
            <span className="label">Adicionar</span>
          </div>
          {isAddTooltipOpen && (
            <div className="actions__custom-tooltip actions__add-tooltip">
              Adicionar produto (em desenvolvimento)
            </div>
          )}
        </div>
        <div className="wrapper-grid">
          {isSmallScreen ? (
            <div className="grid__list">
              {paginatedProducts.map((product) => (
                <div key={product.id} className="grid__card">
                  <div className="grid__card-header">
                    <span className="grid__card-code">{product.codigo_omie}</span>
                    <span className="grid__card-name">{product.name}</span>
                    <div className="grid__stock-total-wrapper">
                      <button
                        className="grid__edit-button"
                        onClick={() => handleCardEditClick(product.id)}
                      >
                        <img
                          src={
                            editingCard === product.id
                              ? "/images/Chevron Up.svg"
                              : "/images/Edit.svg"
                          }
                          alt={editingCard === product.id ? "Fechar" : "Editar"}
                        />
                      </button>
                      <span className="grid__stock-total">
                        Total: <strong>{product.estoque_total}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="grid__card-stocks">
                    <div className="grid__stock-tags">
                      {["vitoria", "uniao", "linhares", "supertela", "telarame", "estruturaco"].map(
                        (store) => {
                          const storeKey = `estoque_${store}` as keyof OmieProductFromDb;
                          const storeInitial = store.charAt(0).toUpperCase();
                          return editingCard === product.id ? (
                            <input
                              key={store}
                              type="number"
                              className="grid__stock-input"
                              value={editStocks[product.id]?.[storeKey] ?? product[storeKey] ?? ""}
                              onChange={(e) =>
                                handleStockChange(product.id, storeKey, e.target.value)
                              }
                            />
                          ) : (
                            <span
                              key={store}
                              className={`grid__stock-tag grid__stock-tag--${store}`}
                              title={store.charAt(0).toUpperCase() + store.slice(1)}
                            >
                              {storeInitial}:{product[storeKey] ?? "-"}
                            </span>
                          );
                        },
                      )}
                      {editingCard === product.id && (
                        <button
                          className="grid__save-button"
                          onClick={() => handleSaveStocks(product.id)}
                        >
                          Salvar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className="grid__table">
              <thead>
                <tr>
                  <th>Cód. Omie</th>
                  <th>Nome</th>
                  <th>Família</th>
                  <th>Loja</th>
                  <th>Estoque Total</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <>
                    <tr key={product.id}>
                      <td>{product.codigo_omie}</td>
                      <td>{product.name}</td>
                      <td>{product.type}</td>
                      <td>{product.primeira_loja}</td>
                      <td>
                        <div className="grid__stock-total-container">
                          <div className="grid__stock-mini-table">
                            <span>V:{product.estoque_vitoria ?? "-"}</span>
                            <span>U:{product.estoque_uniao ?? "-"}</span>
                          </div>
                          <div className="grid__stock-mini-table">
                            <span>L:{product.estoque_linhares ?? "-"}</span>
                            <span>S:{product.estoque_supertela ?? "-"}</span>
                          </div>
                          <div className="grid__stock-mini-table">
                            <span>T:{product.estoque_telarame ?? "-"}</span>
                            <span>E:{product.estoque_estruturaco ?? "-"}</span>
                          </div>
                          <span className="grid__stock-total-value">
                            Tot: {product.estoque_total}
                          </span>
                          <button
                            className="grid__edit-button"
                            onClick={() => handleEditClick(product.id)}
                          >
                            <img
                              src={
                                expandedRow === product.id
                                  ? "/images/Chevron Up.svg"
                                  : "/images/Edit.svg"
                              }
                              alt={expandedRow === product.id ? "Fechar" : "Editar"}
                            />
                          </button>
                        </div>
                      </td>
                      <td>{formatDate(product.D)}</td>
                    </tr>
                    {expandedRow === product.id && !isSmallScreen && (
                      <tr className="grid__expanded-row">
                        <td colSpan={7}>
                          <div className="grid__expanded-content">
                            <label>
                              Vitória:
                              <input
                                type="number"
                                value={
                                  editStocks[product.id]?.estoque_vitoria ??
                                  product.estoque_vitoria ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleStockChange(product.id, "estoque_vitoria", e.target.value)
                                }
                                className="grid__stock-input"
                              />
                            </label>
                            <label>
                              União:
                              <input
                                type="number"
                                value={
                                  editStocks[product.id]?.estoque_uniao ??
                                  product.estoque_uniao ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleStockChange(product.id, "estoque_uniao", e.target.value)
                                }
                                className="grid__stock-input"
                              />
                            </label>
                            <label>
                              Linhares:
                              <input
                                type="number"
                                value={
                                  editStocks[product.id]?.estoque_linhares ??
                                  product.estoque_linhares ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleStockChange(product.id, "estoque_linhares", e.target.value)
                                }
                                className="grid__stock-input"
                              />
                            </label>
                            <label>
                              Supertela:
                              <input
                                type="number"
                                value={
                                  editStocks[product.id]?.estoque_supertela ??
                                  product.estoque_supertela ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleStockChange(product.id, "estoque_supertela", e.target.value)
                                }
                                className="grid__stock-input"
                              />
                            </label>
                            <label>
                              Telarame:
                              <input
                                type="number"
                                value={
                                  editStocks[product.id]?.estoque_telarame ??
                                  product.estoque_telarame ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleStockChange(product.id, "estoque_telarame", e.target.value)
                                }
                                className="grid__stock-input"
                              />
                            </label>
                            <label>
                              Estruturaco:
                              <input
                                type="number"
                                value={
                                  editStocks[product.id]?.estoque_estruturaco ??
                                  product.estoque_estruturaco ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleStockChange(
                                    product.id,
                                    "estoque_estruturaco",
                                    e.target.value,
                                  )
                                }
                                className="grid__stock-input"
                              />
                            </label>
                            <button
                              className="grid__save-button"
                              onClick={() => handleSaveStocks(product.id)}
                            >
                              Salvar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="wrapper-pagination">
          <div className="pagination">
            <div className="wrapper4">
              {/* Botão Prev */}
              <div
                className={`pagination-prev ${page === 1 ? "pagination-prev--disabled" : ""}`}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                <img className="icon" alt="Anterior" src="./images/Chevron Left.svg" />
              </div>

              {/* Números das Páginas Dinâmicos */}
              {(() => {
                const half = Math.floor(maxPagesToShow / 2);
                let startPage = Math.max(1, page - half);
                let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

                // Ajusta o início se o fim estiver no limite
                if (endPage - startPage + 1 < maxPagesToShow) {
                  startPage = Math.max(1, endPage - maxPagesToShow + 1);
                }

                return Array.from({ length: endPage - startPage + 1 }, (_, index) => {
                  const pageNumber = startPage + index;
                  return (
                    <div
                      key={pageNumber}
                      className={`pagination-item ${page === pageNumber ? "pagination-item--active" : ""}`}
                      onClick={() => setPage(pageNumber)}
                    >
                      <span className="div41">{pageNumber}</span>
                    </div>
                  );
                });
              })()}

              {/* Botão Next */}
              <div
                className={`pagination-next ${page === totalPages || totalPages === 0 ? "pagination-next--disabled" : ""}`}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              >
                <img className="icon" alt="Próximo" src="./images/Chevron Right.svg" />
              </div>
            </div>

            {/* Seletor de Itens por Página */}
            <div className="wrapper5">
              <div className="select">
                <select
                  className="select-an-item"
                  value={page}
                  onChange={(e) => setPage(Number(e.target.value))} // Muda a página diretamente
                  style={{
                    border: "none",
                    background: "transparent",
                    fontFamily: "Poppins",
                    fontSize: "14px",
                    width: "100%",
                    paddingRight: "24px",
                    appearance: "none",
                  }}
                >
                  {Array.from({ length: totalPages }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1}
                    </option>
                  ))}
                </select>
                <img
                  className="icon select-icon"
                  alt="Selecionar página"
                  src="./images/Chevron Down.svg"
                />
              </div>
              <span className="page">Page</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StockGrid;
