// src/components/Dashboard.tsx
import { useEffect, useState, useMemo } from "react";
import Layout from "./Layout";
import { log } from "../utils/logger";
//import { EstoqueMinimoPieChart } from "./EstoqueMinimoPieChart"; // (vamos criar depois)
import EstoqueMinimoPieChart from "./EstoqueMinimoPieChart";
import "./Dashboard.css"; // já considerando que seu CSS tá centralizado
import EstoqueTotalChart from "./EstoqueTotalChart";

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

  const [filtroProduto, setFiltroProduto] = useState("");
  const [filtroFamilia, setFiltroFamilia] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroLoja, setFiltroLoja] = useState<string[]>([]);
  const [showLojas, setShowLojas] = useState<boolean>(false);

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
      if (filtroProduto) queryParams.append("produto", filtroProduto);
      if (filtroLoja.length) {
        filtroLoja.forEach((loja) => queryParams.append("lojas", loja));
      }

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

  const handleSubmit = (e?: React.FormEvent) => {
    log("Aplicando filtros", "info", "P", {
      filtroData,
      filtroFamilia,
      filtroLoja,
      filtroProduto,
    });

    e?.preventDefault();
    fetchEstoque(); // 🔁 isso precisa estar aqui
  };

  const handleLimparFiltros = () => {
    setFiltroData("");
    setFiltroFamilia("");
    setFiltroProduto("");
    setFiltroLoja([]);
    fetchEstoque(); // opcional, se não tiver `useEffect` com deps
  };

  // derivar para gráfico mínimo
  const dataMinimo = useMemo(() => {
    return data.map((p) => ({
      name: p.name,
      emFalta: Math.max(0, p.emFalta),
    }));
  }, [data]);

  const handleRemoverProduto = () => {
    setFiltroProduto("");
    handleSubmit(); // dispara nova consulta
  };

  const handleRemoverFamilia = () => {
    setFiltroFamilia("");
    handleSubmit(); // dispara nova consulta
  };

  const handleRemoverData = () => {
    setFiltroData("");
    handleSubmit(); // dispara nova consulta
  };

  const handleRemoverLoja = (loja: string) => {
    const novaLista = filtroLoja.filter((l) => l !== loja);
    setFiltroLoja(novaLista);
    // Aguarda o estado atualizar logicamente, aplicando com nova lista
    setTimeout(() => handleSubmit(), 0); // gambitech confiável 😅
  };

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard__wrapper">
          {/* <h2 className="dashboard__title">Estoque Detalhado</h2> */}

          {/* 📌Filtros */}
          <form onSubmit={handleSubmit} className="dashboard__filters">
            <div className="dashboard__filters-row">
              <div className="filter-group">
                <label>Produto:</label>
                <input
                  type="text"
                  value={filtroProduto}
                  onChange={(e) => setFiltroProduto(e.target.value)}
                  placeholder="Ex: Telas Soldadas"
                />
              </div>

              <div className="filter-group">
                <label>Família:</label>
                <input
                  type="text"
                  value={filtroFamilia}
                  onChange={(e) => setFiltroFamilia(e.target.value)}
                  placeholder="Ex: Telas Soldadas"
                />
              </div>

              <div className="filter-group">
                <label>Data:</label>
                <input
                  type="date"
                  value={filtroData}
                  onChange={(e) => setFiltroData(e.target.value)}
                />
              </div>

              <div className="filter-group-button">
                <label>Lojas:</label>
                <div className="dropdown-wrapper">
                  <button
                    type="button"
                    className="dashboard__button"
                    onClick={() => setShowLojas(!showLojas)}
                  >
                    {showLojas ? "Ocultar" : "Selecionar"}
                  </button>

                  {showLojas && (
                    <div className="dashboard__checkbox-group floating">
                      {["vitoria", "uniao", "linhares", "supertela", "telarame", "estruturaco"].map(
                        (loja) => (
                          <label key={loja} className="checkbox-wrapper">
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
                            <span className="custom-checkbox" />
                            {loja.charAt(0).toUpperCase() + loja.slice(1)}
                          </label>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="filter-group filter-group-buttons">
                {/* <label>Ações:</label> */}
                <button className="dashboard__button" type="submit">
                  Aplicar
                </button>
                <button className="dashboard__button" onClick={handleLimparFiltros}>
                  Limpar
                </button>
              </div>
            </div>
            {/* Só para o caso de precisar colocar 2 linhas nos celulares */}
            {/* <div className="dashboard__filters-row"></div> */}
          </form>

          <div className="dashboard__active-filters">
            {filtroProduto && (
              <div className="chip">
                {filtroProduto}
                <span onClick={handleRemoverProduto}>×</span>
              </div>
            )}
            {filtroFamilia && (
              <div className="chip">
                {filtroFamilia}
                <span onClick={handleRemoverFamilia}>×</span>
              </div>
            )}
            {filtroData && (
              <div className="chip">
                {new Date(filtroData).toLocaleDateString("pt-BR")}
                <span onClick={handleRemoverData}>×</span>
              </div>
            )}
            {filtroLoja.map((loja) => (
              <div className="chip" key={loja}>
                {loja}
                <span onClick={() => handleRemoverLoja(loja)}>❌</span>
              </div>
            ))}
          </div>

          {/* 📌 Espaço reservado para KPIs/cards */}
          <div className="dashboard__cards-placeholder">
            {/* Aqui você vai encaixar os cards futuros */}

            <div className="cartoes-info">
              <div>
                <span>Estoque total de Matéria Prima</span>
                <p>1500</p>
                <span>Teste 3</span>
              </div>

              <div>Teste 2</div>
            </div>
            <div className="cartoes-info">Demanda por Segmento</div>
            <div className="cartoes-info">Baixa Rotação</div>
          </div>

          {loading ? (
            <p>Carregando dados...</p>
          ) : (
            // <div className="dashboard__wrapper">
            //   <table className="dashboard__table">
            //     <thead>
            //       <tr>
            //         <th>Produto</th>
            //         <th>Família</th>
            //         <th>Data</th>
            //         <th>Estoque Total</th>
            //         <th>Mínimo</th>
            //         <th>% Em falta</th>
            //         {filtroLoja.length > 0 ? (
            //           filtroLoja.map((loja) => (
            //             <th key={loja}>{loja.charAt(0).toUpperCase() + loja.slice(1)}</th>
            //           ))
            //         ) : (
            //           <>
            //             <th>Vitória</th>
            //             <th>União</th>
            //             <th>Linhares</th>
            //             <th>Supertela</th>
            //             <th>Telarame</th>
            //             <th>Estruturaco</th>
            //           </>
            //         )}
            //       </tr>
            //     </thead>
            //     <tbody>
            //       {data.map((item) => (
            //         <tr key={item.name + item.D}>
            //           <td>{item.name}</td>
            //           <td>{item.type}</td>
            //           <td>{item.D}</td>
            //           <td>{getEstoqueTotalFiltrado(item)}</td>
            //           <td>{item.estoque_minimo}</td>
            //           <td>{item.emFalta}%</td>
            //           {filtroLoja.length > 0 ? (
            //             filtroLoja.map((loja) => (
            //               <td key={loja}>{item.porLoja[loja as keyof typeof item.porLoja]}</td>
            //             ))
            //           ) : (
            //             <>
            //               <td>{item.porLoja.vitoria}</td>
            //               <td>{item.porLoja.uniao}</td>
            //               <td>{item.porLoja.linhares}</td>
            //               <td>{item.porLoja.supertela}</td>
            //               <td>{item.porLoja.telarame}</td>
            //               <td>{item.porLoja.estruturaco}</td>
            //             </>
            //           )}
            //         </tr>
            //       ))}
            //     </tbody>
            //   </table>

            //   {/* <p>{`Texto absurdamente grande sem espaços nem quebras: `.repeat(100)}</p> */}
            // </div>
            <div>
              {/* 📊 Gráficos */}
              <div className="dashboard__charts">
                {/* 🥧 Gráfico de Estoque Mínimo */}
                <div className="dashboard__chart-minimo">
                  <EstoqueMinimoPieChart data={dataMinimo} />
                </div>

                {/* 📦 Gráfico de Estoque Total (placeholder por enquanto) */}
                <div className="dashboard__chart-total">
                  {/* <div className="dashboard__chart-placeholder">Gráfico Total (em breve)</div> */}
                  <EstoqueTotalChart data={data} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
