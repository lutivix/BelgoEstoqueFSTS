//import React from "react";
// import Layout from "../components/Layout";

// const Reports = () => (
//   <Layout>
//     <div className="dashboard">
//       <h2>Relatórios</h2>
//       <p>Relatórios para exportação em excel serão disponibilizados aqui!</p>
//     </div>
//   </Layout>
// );

//export default Reports;
// import { useState, useEffect } from "react";
// import * as XLSX from "xlsx";
// import { OmieProductFromDb } from "../types/omie-product-from-db";
// import "./Reports.css"; // Ajusta o caminho conforme tua estrutura
// import Layout from "../components/Layout";

// const backendUrl = "http://192.168.7.216:3000/products/db";

// const Reports = () => {
//   const [products, setProducts] = useState<OmieProductFromDb[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Busca os dados da API quando o componente monta
//   useEffect(() => {
//     const fetchProducts = async () => {
//       try {
//         const response = await fetch(backendUrl);
//         if (!response.ok) {
//           throw new Error("Erro ao buscar produtos da API");
//         }
//         const data: OmieProductFromDb[] = await response.json();
//         setProducts(data);
//         setLoading(false);
//       } catch (err) {
//         setError((err as Error).message);
//         setLoading(false);
//       }
//     };
//     fetchProducts();
//   }, []);

//   // Função pra exportar pra Excel
//   const exportToExcel = () => {
//     const worksheet = XLSX.utils.json_to_sheet(products, {
//       header: [
//         "codigo_produto",
//         "codigo_omie",
//         "name",
//         "desc",
//         "type",
//         "id_type",
//         "valor_un",
//         "primeira_loja",
//         "id",
//         "cod_integ",
//         "estoque_vitoria",
//         "estoque_uniao",
//         "estoque_linhares",
//         "estoque_supertela",
//         "estoque_telarame",
//         "estoque_estruturaco",
//         "estoque_vitoria_dm1",
//         "estoque_uniao_dm1",
//         "estoque_linhares_dm1",
//         "estoque_supertela_dm1",
//         "estoque_telarame_dm1",
//         "estoque_estruturaco_dm1",
//         "estoque_total",
//         "estoque_total_dm1",
//         "D",
//         "DM1",
//       ],
//     });
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório Estoque");
//     XLSX.writeFile(
//       workbook,
//       `relatorio_estoque_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.xlsx`,
//     );
//   };

//   if (loading) {
//     return <div className="reports">Carregando...</div>;
//   }

//   if (error) {
//     return <div className="reports">Erro: {error}</div>;
//   }

//   return (
//     <Layout>
//       <div className="reports">
//         <div className="reports__header">
//           <h1>Relatórios de Estoque</h1>
//           <button className="reports__export-button" onClick={exportToExcel}>
//             Exportar para Excel
//           </button>
//         </div>
//         <div className="reports__table-wrapper">
//           <table className="reports__table">
//             <thead>
//               <tr>
//                 <th>Cód. Produto</th>
//                 <th>Cód. Omie</th>
//                 <th>Nome</th>
//                 <th>Descrição</th>
//                 <th>Tipo</th>
//                 <th>Valor Unitário</th>
//                 <th>Primeira Loja</th>
//                 <th>Estoque Vitória</th>
//                 <th>Estoque União</th>
//                 <th>Estoque Linhares</th>
//                 <th>Estoque Supertela</th>
//                 <th>Estoque Telarame</th>
//                 <th>Estoque Estruturaco</th>
//                 <th>Estoque Total</th>
//                 <th>Data</th>
//               </tr>
//             </thead>
//             <tbody>
//               {products.map((product) => (
//                 <tr key={product.id}>
//                   <td>{product.codigo_produto}</td>
//                   <td>{product.codigo_omie}</td>
//                   <td>{product.name}</td>
//                   <td>{product.desc}</td>
//                   <td>{product.type}</td>
//                   <td>{product.valor_un.toFixed(2)}</td>
//                   <td>{product.primeira_loja}</td>
//                   <td>{product.estoque_vitoria}</td>
//                   <td>{product.estoque_uniao}</td>
//                   <td>{product.estoque_linhares}</td>
//                   <td>{product.estoque_supertela}</td>
//                   <td>{product.estoque_telarame}</td>
//                   <td>{product.estoque_estruturaco}</td>
//                   <td>{product.estoque_total}</td>
//                   <td>{product.D || "-"}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default Reports;

import { useState } from "react";
import "./Reports.css"; // Ajusta o caminho conforme tua estrutura
import Layout from "../components/Layout";

const backendUrl = "http://localhost:3000/products/export-excel"; // URL da API que gera o Excel

const Reports = () => {
  const [reportName, setReportName] = useState<string>(
    `StockReport${new Date().toLocaleDateString("en-CA").replace(/-/g, "")}`,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função pra baixar o Excel da API
  const downloadExcel = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(backendUrl);
      if (!response.ok) {
        throw new Error("Erro ao baixar o relatório da API");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName}.xlsx`; // Usa o nome do relatório
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // Libera memória
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="reports">
        <div className="reports__header">{/* <h1>Relatórios</h1> */}</div>
        <div className="reports__content">
          <div className="reports__download-section">
            <label>Relatório de Estoque - Nome:</label>
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="reports__report-name"
              disabled={loading}
            />
            <button className="reports__export-button" onClick={downloadExcel} disabled={loading}>
              {loading ? "Baixando..." : "Baixar Excel"}
            </button>
          </div>
          {error && <p className="reports__error">{error}</p>}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
