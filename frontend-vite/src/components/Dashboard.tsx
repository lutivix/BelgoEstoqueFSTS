// src/components/Dashboard.tsx
import { useEffect, useState } from "react";
import Layout from "./Layout";
import "./Dashboard.css";
import { log } from "../utils/logger";

interface EstoqueDetalhado {
  name: string;
  type: string;
  D: string;
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
}

const Dashboard = () => {
  const [data, setData] = useState<EstoqueDetalhado[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroFamilia, setFiltroFamilia] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroLoja, setFiltroLoja] = useState<string[]>([]);
  const getEstoqueTotalFiltrado = (item: EstoqueDetalhado): number => {
    const lojas = filtroLoja.length > 0 ? filtroLoja : Object.keys(item.porLoja);
    return lojas.reduce(
      (soma, loja) => soma + (item.porLoja[loja as keyof typeof item.porLoja] || 0),
      0,
    );
  };

  const fetchEstoque = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filtroFamilia) queryParams.append("familia", filtroFamilia);
      if (filtroData) queryParams.append("data", filtroData);

      const response = await fetch(
        `http://localhost:3000/api/products/dashboard/estoque-detalhado?${queryParams}`,
      );
      const json = await response.json();
      setData(json);
    } catch (error) {
      log("Erro ao buscar estoque", "error", "O", error);
    } finally {
      setLoading(false);
    }
    log("Dashboard carregado", "info", "L");
  };

  useEffect(() => {
    fetchEstoque();
  }, []); // Primeiro carregamento (sem filtros)

  const handleSubmit = (e: React.FormEvent) => {
    log("Aplicando filtros", "info", "P", {
      filtroData,
      filtroFamilia,
      filtroLoja,
    });

    e.preventDefault();
    fetchEstoque();
  };

  return (
    <Layout>
      <div className="dashboard">
        {/* <h2 className="dashboard__title">Estoque Detalhado</h2> */}

        <form
          onSubmit={handleSubmit}
          className="dashboard__filters"
          style={{ marginBottom: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}
        >
          <div>
            <label>Família:</label>
            <input
              type="text"
              value={filtroFamilia}
              onChange={(e) => setFiltroFamilia(e.target.value)}
              placeholder="Ex: Telas Soldadas"
            />
          </div>
          <div>
            <label>Lojas:</label>
            <div className="dashboard__checkbox-group">
              {["vitoria", "uniao", "linhares", "supertela", "telarame", "estruturaco"].map(
                (loja) => (
                  <label key={loja} style={{ marginRight: "8px" }}>
                    <input
                      type="checkbox"
                      value={loja}
                      checked={filtroLoja.includes(loja)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          setFiltroLoja([...filtroLoja, loja]);
                        } else {
                          setFiltroLoja(filtroLoja.filter((l) => l !== loja));
                        }
                      }}
                    />
                    {loja.charAt(0).toUpperCase() + loja.slice(1)}
                  </label>
                ),
              )}
            </div>
          </div>

          <div>
            <label>Data:</label>
            <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} />
          </div>
          <button type="submit">Aplicar Filtros</button>
        </form>

        {loading ? (
          <p>Carregando dados...</p>
        ) : (
          <div className="dashboard__wrapper">
            <table className="dashboard__table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Família</th>
                  <th>Data</th>
                  <th>Estoque Total</th>
                  <th>Mínimo</th>
                  <th>% Em falta</th>
                  {filtroLoja.length > 0 ? (
                    filtroLoja.map((loja) => (
                      <th key={loja}>{loja.charAt(0).toUpperCase() + loja.slice(1)}</th>
                    ))
                  ) : (
                    <>
                      <th>Vitória</th>
                      <th>União</th>
                      <th>Linhares</th>
                      <th>Supertela</th>
                      <th>Telarame</th>
                      <th>Estruturaco</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.name + item.D}>
                    <td>{item.name}</td>
                    <td>{item.type}</td>
                    <td>{item.D}</td>
                    <td>{getEstoqueTotalFiltrado(item)}</td>
                    <td>{item.estoque_minimo}</td>
                    <td>{item.emFalta}%</td>
                    {filtroLoja.length > 0 ? (
                      filtroLoja.map((loja) => (
                        <td key={loja}>{item.porLoja[loja as keyof typeof item.porLoja]}</td>
                      ))
                    ) : (
                      <>
                        <td>{item.porLoja.vitoria}</td>
                        <td>{item.porLoja.uniao}</td>
                        <td>{item.porLoja.linhares}</td>
                        <td>{item.porLoja.supertela}</td>
                        <td>{item.porLoja.telarame}</td>
                        <td>{item.porLoja.estruturaco}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* <p>{`Texto absurdamente grande sem espaços nem quebras: `.repeat(100)}</p> */}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
