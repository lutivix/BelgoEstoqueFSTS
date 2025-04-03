import { useEffect, useState, useMemo } from "react";
import { Box, Tooltip, IconButton, useMediaQuery } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
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
  const isSmallScreen = useMediaQuery("(max-width: 800px)");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10; // Fixo em 10, ou ajuste conforme necessário
  const maxPagesToShow = 3; // Mostra apenas 3 números por vez

  const backendUrl = "http://192.168.7.216:3000/products/db";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(backendUrl);
        const validProducts = response.data.map((item: any, index: number) => ({
          ...item,
          id: item.id ?? index,
        }));
        setProducts(validProducts);
        setFilteredProducts(validProducts);
        setLoading(false);
      } catch (error) {
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

  const fullColumns: GridColDef[] = [
    {
      field: "codigo_omie",
      headerName: "Código Omie",
      minWidth: 120,
      flex: 1,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "name",
      headerName: "Nome",
      minWidth: 200,
      flex: 2,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "type",
      headerName: "Família",
      minWidth: 120,
      flex: 1,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "primeira_loja",
      headerName: "Loja",
      minWidth: 120,
      flex: 1,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "estoque_total",
      headerName: "Estoque Total",
      minWidth: 150,
      flex: 1,
      type: "number",
      headerAlign: "center",
      align: "center",
      //renderCell: (params) => <span>{params.value}</span>,
      renderCell: (params) => (
        <Tooltip title={getStockTooltip(params.row)} arrow>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "D",
      headerName: "Data Atual",
      minWidth: 120,
      flex: 1,
      headerAlign: "center",
      align: "center",
      valueFormatter: (value: string | undefined) => formatDate(value),
    },
    {
      field: "edit",
      headerName: "",
      width: 70,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <IconButton onClick={() => console.log("Editar produto:", params.row.D)} size="small">
          <EditIcon sx={{ color: "#212529" }} />
        </IconButton>
      ),
    },
  ];

  const smallColumns: GridColDef[] = [
    {
      field: "codigo_omie",
      headerName: "Código",
      minWidth: 80,
      flex: 1,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "name",
      headerName: "Nome",
      minWidth: 120,
      flex: 2,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "estoque_total",
      headerName: "Estoque",
      minWidth: 80,
      flex: 1,
      type: "number",
      headerAlign: "center",
      align: "center",
      renderCell: (params) => <span>{params.value}</span>,
    },
  ];

  const columns = isSmallScreen ? smallColumns : fullColumns;

  useEffect(() => {
    if (isSmallScreen) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [isSmallScreen]);

  // Dentro do return, ajustando o layout
  return (
    <Layout>
      <Box className="body">
        <Box className="header1">
          <p className="produtos">Produtos</p>
          <Box className="breadcrumbs">
            <Box className="breadcrumbitem">
              <span className="link">Dashboard</span>
            </Box>
            <Box className="breadcrumbseparator">
              <span className="link">/</span>
            </Box>
            <Box className="breadcrumbitem1">
              <span className="link">Produtos</span>
            </Box>
          </Box>
        </Box>
        <Box className="table">
          <Box className="actions">
            <Box className="searchbox-parent">
              <Box className="searchbox-wrapper">
                <img className="search-icon" alt="Pesquisar" src="/images/Search.svg" />
                <input
                  className="searchbox-input"
                  placeholder="Pesquisar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Box>
              <Box className="select-comodities">
                <Box className="button">
                  <img className="icon" alt="Filtro" src="/images/Filter.svg" />
                </Box>
              </Box>
            </Box>
            <Box className="button1">
              <img className="icon" alt="Adicionar" src="/images/Plus.svg" />
              <span className="label">Adicionar</span>
            </Box>
          </Box>
          <Box className="wrapper2">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Cód. Omie</th>
                  <th>Nome</th>
                  <th>Família</th>
                  <th>Loja</th>
                  <th>Estoque Total</th>
                  <th>Data</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {paginatedProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.codigo_omie}</td>
                    <td>{product.name}</td>
                    <td>{product.type}</td>
                    <td>{product.primeira_loja}</td>
                    <td>
                      <Tooltip title={getStockTooltip(product)} arrow>
                        <span>{product.estoque_total}</span>
                      </Tooltip>
                    </td>
                    <td>{formatDate(product.D)}</td>
                    <td>
                      <IconButton
                        size="small"
                        onClick={() => console.log("Editar produto:", product.id)}
                      >
                        <EditIcon sx={{ color: "#212529" }} />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
          <Box className="wrapper6">
            <tfoot>
              <tr>
                <td colSpan={7}>
                  <Box className="pagination">
                    <Box className="wrapper4">
                      {/* Botão Prev */}
                      <Box
                        className="pagination-prev"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        sx={{
                          cursor: page === 1 ? "not-allowed" : "pointer",
                          opacity: page === 1 ? 0.5 : 1,
                        }}
                      >
                        <img className="icon" alt="Anterior" src="./images/Chevron Left.svg" />
                      </Box>

                      {/* Números das Páginas Dinâmicos */}
                      {(() => {
                        const maxPagesToShow = 5;
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
                            <Box
                              key={pageNumber}
                              className={`pagination-item ${page === pageNumber ? "active" : ""}`}
                              onClick={() => setPage(pageNumber)}
                              sx={{
                                cursor: "pointer",
                                backgroundColor: page === pageNumber ? "#0057fc" : "#fff",
                                color: page === pageNumber ? "#fff" : "#0057fc",
                              }}
                            >
                              <span className="div41">{pageNumber}</span>
                            </Box>
                          );
                        });
                      })()}

                      {/* Botão Next */}
                      <Box
                        className="pagination-next"
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        sx={{
                          cursor:
                            page === totalPages || totalPages === 0 ? "not-allowed" : "pointer",
                          opacity: page === totalPages || totalPages === 0 ? 0.5 : 1,
                        }}
                      >
                        <img className="icon" alt="Próximo" src="./images/Chevron Right.svg" />
                      </Box>
                    </Box>

                    {/* Seletor de Itens por Página */}
                    <Box className="wrapper5">
                      <Box className="select">
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
                          style={{
                            position: "absolute",
                            right: "8px",
                            pointerEvents: "none",
                          }}
                        />
                      </Box>
                      <span className="page">Page</span>
                    </Box>
                  </Box>
                </td>
              </tr>
            </tfoot>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default StockGrid;
