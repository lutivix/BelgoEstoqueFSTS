import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { OmieProductFromDb } from "../types/omie-product-from-db";
import "./StockGrid.css";
import Layout from "../components/Layout";
import { useLayoutWidth, useLayoutHeigth } from "./Layout"; // Importa o hook do contexto

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

  const layoutWidth = useLayoutWidth(); // Acessa a largura do layout
  const layoutHeight = useLayoutHeigth();

  let alturaGrid = layoutHeight - 226;
  let largura = layoutWidth;

  console.log(alturaGrid + " " + largura);

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
              <div className="actions__button">
                <img className="icon" alt="Filtro" src="/images/Filter.svg" />
              </div>
            </div>
          </div>
          <div className="actions__categoria">
            <img className="actions_cat-icon" alt="Adicionar" src="/images/Plus.svg" />
            <span className="label">Adicionar</span>
          </div>
        </div>
        <div className="wrapper-grid">
          {isSmallScreen ? (
            <div className="grid__list">
              {paginatedProducts.map((product) => (
                <div key={product.id} className="grid__card">
                  <div>
                    <strong>Código:</strong> {product.codigo_omie}
                  </div>
                  <div>
                    <strong>Nome:</strong> {product.name}
                  </div>
                  <div>
                    <strong>Estoque:</strong>{" "}
                    <span title={getStockTooltip(product)}>{product.estoque_total}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className="grid__table">
              <thead>
                <tr>
                  {isSmallScreen ? (
                    <>
                      <th>Código</th>
                      <th>Nome</th>
                      <th>Estoque</th>
                    </>
                  ) : (
                    <>
                      <th>Cód. Omie</th>
                      <th>Nome</th>
                      <th>Família</th>
                      <th>Loja</th>
                      <th>Estoque Total</th>
                      <th>Data</th>
                      <th></th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody>
                {paginatedProducts.map((product) => (
                  <>
                    <tr key={product.id}>
                      {isSmallScreen ? (
                        <>
                          <td>{product.codigo_omie}</td>
                          <td>{product.name}</td>
                          <td>
                            <span title={getStockTooltip(product)}>{product.estoque_total}</span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{product.codigo_omie}</td>
                          <td>{product.name}</td>
                          <td>{product.type}</td>
                          <td>{product.primeira_loja}</td>
                          <td>
                            <span className="tooltip" title={getStockTooltip(product)}>
                              {product.estoque_total}
                            </span>
                          </td>
                          <td>{formatDate(product.D)}</td>
                          <td>
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
                          </td>
                        </>
                      )}
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
