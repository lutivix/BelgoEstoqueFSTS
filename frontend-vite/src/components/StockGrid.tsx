import { useEffect, useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { TextField, Box, Tooltip, useMediaQuery } from "@mui/material";
import axios from "axios";
import { OmieProductFromDb } from "../types/omie-product-from-db";

const formatDate = (value: string | undefined): string => {
  if (!value) return "-";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
};

const getStockTooltip = (row: OmieProductFromDb): string => {
  const date = formatDate(row.D);
  return `
    Estoques em ${date}:
    - Vitória: ${row.estoque_vitoria}
    - União: ${row.estoque_uniao}
    - Linhares: ${row.estoque_linhares}
    - Supertela: ${row.estoque_supertela}
    - Telarame: ${row.estoque_telarame}
    - Estruturaco: ${row.estoque_estruturaco}
  `.trim();
};

const isDevToolsOpen = () => {
  return window.outerWidth - window.innerWidth > 100 || window.outerHeight - window.innerHeight > 100;
};

const StockGrid = () => {
  const [products, setProducts] = useState<OmieProductFromDb[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<OmieProductFromDb[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const isSmallScreen = useMediaQuery("(max-width: 600px)");

  const backendUrl = "http://localhost:3000/products/db"; // Para computador local

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
    const filtered = products.filter((product) => {
      const searchString = [
        product.codigo_omie || "",
        product.name || "",
        product.type || "",
        product.primeira_loja || "",
      ]
        .join(" ")
        .toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const fullColumns: GridColDef[] = [
    { field: "codigo_omie", headerName: "Código Omie", minWidth: 120, flex: 1, headerAlign: "center", align: "center" },
    { field: "name", headerName: "Nome", minWidth: 200, flex: 2, headerAlign: "left", align: "left" },
    { field: "type", headerName: "Família", minWidth: 120, flex: 1, headerAlign: "center", align: "center" },
    { field: "primeira_loja", headerName: "Loja", minWidth: 120, flex: 1, headerAlign: "center", align: "center" },
    {
      field: "estoque_total",
      headerName: "Estoque Total Hoje",
      minWidth: 150,
      flex: 1,
      type: "number",
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Tooltip title={getStockTooltip(params.row)} arrow disableHoverListener={isDevToolsOpen()}>
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
  ];

  const smallColumns: GridColDef[] = [
    {
      field: "codigo_omie",
      headerName: "Código Omie",
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
      renderCell: (params) => (
        <Tooltip title={getStockTooltip(params.row)} arrow disableHoverListener={isDevToolsOpen()}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
  ];

  const columns = isSmallScreen ? smallColumns : fullColumns;

  return (
    <Box
      sx={{
        maxHeight: "100vh", // Limita à altura da tela
        width: "100%",
        padding: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <h1
        style={{
          margin: 0,
          textAlign: "center",
          fontSize: "2rem",
        }}
      >
        Estoque Belgo
      </h1>
      <TextField
        label="Buscar por Código, Nome, Família ou Loja"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{
          width: "50%",
          mx: "auto",
          "& .MuiInputBase-root": { fontSize: "1rem" },
        }}
      />
      <Box sx={{ height: "70vh", overflow: "auto" }}> {/* Altura fixa para caber em 1080px */}
        <DataGrid
          rows={filteredProducts}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } }, // 10 linhas
          }}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection
          disableRowSelectionOnClick
          columnHeaderHeight={56}
          sx={{
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f5f5f5",
              fontSize: "1rem",
              minHeight: "unset !important",
              height: "56px",
              padding: "0 8px",
            },
            "& .MuiDataGrid-cell": {
              padding: "8px",
              fontSize: "1rem",
            },
            "& .MuiDataGrid-root": {
              fontSize: "1rem",
            },
            "& .MuiDataGrid-footerContainer": {
              fontSize: "1rem",
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default StockGrid;