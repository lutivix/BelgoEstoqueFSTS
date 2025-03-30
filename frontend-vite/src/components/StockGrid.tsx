import { useEffect, useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { TextField, Box, Tooltip } from "@mui/material";
import axios from "axios";
import { OmieProductFromDb } from "../types/omie-product-from-db";

const formatDate = (value: string | undefined): string => {
  if (!value) return "-";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
};

// Função para gerar o texto do tooltip
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

const StockGrid = () => {
  const [products, setProducts] = useState<OmieProductFromDb[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<OmieProductFromDb[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:3000/products/db");
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

  const columns: GridColDef[] = [
    { field: "codigo_omie", headerName: "Código Omie", width: 150, headerAlign: "center", align: "center" },
    { field: "name", headerName: "Nome", width: 300, headerAlign: "left", align: "left" },
    { field: "type", headerName: "Família", width: 150, headerAlign: "center", align: "center" },
    { field: "primeira_loja", headerName: "Loja", width: 150, headerAlign: "center", align: "center" },
    {
        field: "estoque_total",
        headerName: "Estoque Total Hoje",
        width: 180,
        type: "number",
        headerAlign: "center",
        align: "center",
        renderCell: (params) => (
          <Tooltip title={getStockTooltip(params.row)} arrow>
            <span>{params.value}</span>
          </Tooltip>
        ),
    },
    {
      field: "D",
      headerName: "Data Atual",
      width: 150,
      headerAlign: "center",
      align: "center",
      valueFormatter: (value: string | undefined) => formatDate(value), // Valor direto, não objeto
    },
  ];

  return (
    <div style={{ height: "80vh", width: "100%", padding: 20 }}>
      <h1 style={{ marginBottom: 10, textAlign: "center" }}>Estoque Belgo</h1>
      <Box sx={{ marginBottom: 2, display: "flex", justifyContent: "center" }}>
        <TextField
          label="Buscar por Código, Nome, Família ou Loja"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: "50%" }}
        />
      </Box>
      <DataGrid
        rows={filteredProducts}
        columns={columns}
        loading={loading}
        getRowId={(row) => row.id}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        pageSizeOptions={[10, 25, 50]}
        checkboxSelection
        disableRowSelectionOnClick
        sx={{
          "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f5f5" },
          "& .MuiDataGrid-cell": { padding: "8px" },
        }}
      />
    </div>
  );
};

export default StockGrid;