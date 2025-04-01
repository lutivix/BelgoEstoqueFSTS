import { useEffect, useState } from "react";
import {
  Box, Typography, Tooltip,
  IconButton, useMediaQuery
} from "@mui/material";
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
        .includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const fullColumns: GridColDef[] = [
    { field: "codigo_omie", headerName: "Código Omie", minWidth: 120, flex: 1, headerAlign: "center", align: "center" },
    { field: "name", headerName: "Nome", minWidth: 200, flex: 2, headerAlign: "left", align: "left" },
    { field: "type", headerName: "Família", minWidth: 120, flex: 1, headerAlign: "center", align: "center" },
    { field: "primeira_loja", headerName: "Loja", minWidth: 120, flex: 1, headerAlign: "center", align: "center" },
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
        <IconButton
          onClick={() => console.log("Editar produto:", params.row.id)}
          size="small"
        >
          <EditIcon sx={{ color: "#212529" }} />
        </IconButton>
      ),
    },
  ];

  const smallColumns: GridColDef[] = [
    { field: "codigo_omie", headerName: "Código", minWidth: 80, flex: 1, headerAlign: "center", align: "center" },
    { field: "name", headerName: "Nome", minWidth: 120, flex: 2, headerAlign: "left", align: "left" },
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
            <Typography className="produtos">Produtos</Typography>
            <Box className="breadcrumbs">
              <Box className="breadcrumbitem">
                <Typography className="link">Dashboard</Typography>
              </Box>
              <Box className="breadcrumbseparator">
                <Typography className="link">/</Typography>
              </Box>
              <Box className="breadcrumbitem1">
                <Typography className="link">Produtos</Typography>
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
                  <Typography className="label">Adicionar</Typography>
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
                    {filteredProducts.slice(0, 10).map((product) => (
                      <tr key={product.id}>
                        <td>{product.codigo_omie}</td>
                        <td>{product.name}</td>
                        <td>{product.type}</td>
                        <td>{product.primeira_loja}</td>
                        <td><Tooltip title={getStockTooltip(product)} arrow>
                          <span>{product.estoque_total}</span>
                          </Tooltip>
                      </td>
                        <td>{formatDate(product.D)}</td>
                        <td>
                          <IconButton size="small">
                            <EditIcon sx={{ color: "#212529" }} />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={7}>
                        <Box className="pagination">
                          <button>Prev</button>
                          <span>Página 1</span>
                          <button>Next</button>
                        </Box>
                      </td>
                    </tr>
                  </tfoot>
                </table>
            </Box>
          </Box>
        </Box>
        </Layout>
  );
};

export default StockGrid;