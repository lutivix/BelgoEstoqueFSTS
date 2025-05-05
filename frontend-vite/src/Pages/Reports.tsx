import { useState } from "react";
import "../Styles/Reports.css"; // Ajusta o caminho conforme tua estrutura
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

  const downloadFrontendLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/api/logger/download-frontend-logs");
      if (!response.ok) {
        throw new Error("Erro ao baixar logs do frontend");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName}_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
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
          <div className="reports__download-section">
            <label>Relatório de Logs - Nome:</label>
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="reports__report-name"
              disabled={loading}
            />
            <button
              className="reports__export-button"
              onClick={downloadFrontendLogs}
              disabled={loading}
            >
              {loading ? "Baixando..." : "📦 Baixar Logs Frontend"}
            </button>
          </div>
          {error && <p className="reports__error">{error}</p>}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
