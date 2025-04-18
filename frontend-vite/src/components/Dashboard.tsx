// src/components/Dashboard.tsx
import { useEffect, useState } from "react";
import Layout from "./Layout";

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

  useEffect(() => {
    const fetchEstoque = async () => {
      try {
        const response = await fetch("http://localhost:3000/products/dashboard/estoque-detalhado");
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error("Erro ao buscar dados do estoque:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEstoque();
  }, []);

  return (
    <Layout>
      <div className="dashboard">
        <h2 className="dashboard__title">Estoque Detalhado</h2>
        {loading ? (
          <p>Carregando dados...</p>
        ) : (
          <table className="dashboard__table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Família</th>
                <th>Data</th>
                <th>Estoque Total</th>
                <th>Mínimo</th>
                <th>% Em falta</th>
                <th>Vitória</th>
                <th>União</th>
                <th>Linhares</th>
                <th>Supertela</th>
                <th>Telarame</th>
                <th>Estruturaco</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.name + item.D}>
                  <td>{item.name}</td>
                  <td>{item.type}</td>
                  <td>{item.D}</td>
                  <td>{item.estoque_total}</td>
                  <td>{item.estoque_minimo}</td>
                  <td>{item.emFalta}%</td>
                  <td>{item.porLoja.vitoria}</td>
                  <td>{item.porLoja.uniao}</td>
                  <td>{item.porLoja.linhares}</td>
                  <td>{item.porLoja.supertela}</td>
                  <td>{item.porLoja.telarame}</td>
                  <td>{item.porLoja.estruturaco}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
