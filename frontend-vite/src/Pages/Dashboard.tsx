// src/components/Dashboard.tsx
import { useEffect, useState, useMemo, useRef } from "react";
import Layout from "../components/Layout";
import { log } from "../utils/logger";
//import { EstoqueMinimoPieChart } from "./EstoqueMinimoPieChart"; // (vamos criar depois)
import EstoqueMinimoPieChart from "../components/EstoqueMinimoPieChart";
import "../Styles/Dashboard.css"; // já considerando que seu CSS tá centralizado
import EstoqueTotalChart from "../components/EstoqueTotalChart";

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

const FilterPopup = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  children,
  isOpen,
  setIsOpen,
  buttonText,
}: any) => {
  const popupRef = useRef(null);
  const buttonRef = useRef(null);
  let leaveTimeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="filter-popup-relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button ref={buttonRef} className="filter-popup-button filter-popup-button--md">
        {buttonText}
      </button>
      {isOpen && (
        <div ref={popupRef} className="filter-popup-box">
          <label className="filter-popup-label">{label}:</label>
          {children ? (
            children
          ) : (
            <input
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="filter-popup-input"
            />
          )}
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState<EstoqueDetalhado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroProduto, setFiltroProduto] = useState("");
  const [filtroFamilia, setFiltroFamilia] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroLoja, setFiltroLoja] = useState<string[]>([]);
  const [showLojas, setShowLojas] = useState<boolean>(false);

  const [isProdutoOpen, setIsProdutoOpen] = useState(false);
  const [isFamiliaOpen, setIsFamiliaOpen] = useState(false);
  const [isDataOpen, setIsDataOpen] = useState(false);
  const [isLojaOpen, setIsLojaOpen] = useState(false);

  const getEstoqueTotalFiltrado = (item: EstoqueDetalhado): number => {
    const lojas = filtroLoja.length > 0 ? filtroLoja : Object.keys(item.porLoja);
    return lojas.reduce(
      (soma, loja) => soma + (item.porLoja[loja as keyof typeof item.porLoja] || 0),
      0,
    );
  };

  const backendUrl = "http://192.168.7.15:3000/api/products/dashboard/estoque-detalhado";

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

      const response = await fetch(`${backendUrl}?${queryParams}`);
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

    setIsProdutoOpen(false);
    setIsFamiliaOpen(false);
    setIsDataOpen(false);
    setIsLojaOpen(false);
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

  const showActionButtons =
    filtroProduto !== "" ||
    filtroFamilia !== "" ||
    filtroData !== "" ||
    filtroLoja.length > 0 ||
    isProdutoOpen ||
    isFamiliaOpen ||
    isDataOpen ||
    isLojaOpen;

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard__wrapper">
          {/* <h2 className="dashboard__title">Estoque Detalhado</h2> */}

          {/* 📌Filtros */}
          <div className="filter-section-container">
            <div className="filter-controls-wrapper">
              <FilterPopup
                label="Produto"
                value={filtroProduto}
                onChange={setFiltroProduto}
                placeholder="Ex: Telas Soldadas"
                isOpen={isProdutoOpen}
                setIsOpen={setIsProdutoOpen}
                buttonText={`Produto ${filtroProduto ? "✓" : ""}`}
              />
              <FilterPopup
                label="Família"
                value={filtroFamilia}
                onChange={setFiltroFamilia}
                placeholder="Ex: Telas Soldadas"
                isOpen={isFamiliaOpen}
                setIsOpen={setIsFamiliaOpen}
                buttonText={`Família ${filtroFamilia ? "✓" : ""}`}
              />
              <FilterPopup
                label="Período"
                value={filtroData}
                onChange={setFiltroData}
                type="date"
                placeholder=""
                isOpen={isDataOpen}
                setIsOpen={setIsDataOpen}
                buttonText={`Período ${filtroData ? "✓" : ""}`}
              />
              <FilterPopup
                label="Lojas"
                value={filtroLoja.join(", ")}
                onChange={() => {}}
                placeholder=""
                isOpen={isLojaOpen}
                setIsOpen={setIsLojaOpen}
                buttonText={`Lojas ${filtroLoja.length > 0 ? `(${filtroLoja.length}) ✓` : ""}`}
              >
                <div className="filter-popup-checkbox-container">
                  {["vitoria", "uniao", "linhares", "supertela", "telarame", "estruturaco"].map(
                    (loja) => (
                      <label key={loja} className="filter-popup-checkbox-label">
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
                          className="filter-popup-checkbox-input"
                        />
                        <span>{loja.charAt(0).toUpperCase() + loja.slice(1)}</span>
                      </label>
                    ),
                  )}
                </div>
              </FilterPopup>

              {true && (
                <div className="filter-action-buttons-container">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="filter-button-aplicar filter-button-aplicar--md"
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    onClick={handleLimparFiltros}
                    className="filter-button-limpar filter-button-limpar--md"
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>
          </div>
          {(filtroProduto || filtroFamilia || filtroData || filtroLoja.length > 0) && (
            <div className="active-filters-container">
              <span className="active-filters-label">Filtros ativos:</span>
              {filtroProduto && (
                <div className="filter-chip">
                  {filtroProduto}
                  <button onClick={handleRemoverProduto} className="filter-chip-remove-button">
                    &times;
                  </button>
                </div>
              )}
              {filtroFamilia && (
                <div className="filter-chip">
                  {filtroFamilia}
                  <button onClick={handleRemoverFamilia} className="filter-chip-remove-button">
                    &times;
                  </button>
                </div>
              )}
              {filtroData && (
                <div className="filter-chip">
                  {new Date(filtroData + "T00:00:00").toLocaleDateString("pt-BR")}
                  <button onClick={handleRemoverData} className="filter-chip-remove-button">
                    &times;
                  </button>
                </div>
              )}
              {filtroLoja.map((loja) => (
                <div className="filter-chip" key={loja}>
                  {loja.charAt(0).toUpperCase() + loja.slice(1)}
                  <button
                    onClick={() => handleRemoverLoja(loja)}
                    className="filter-chip-remove-button"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 📌 Espaço reservado para KPIs/cards */}
          <div className="dashboard__cards-placeholder">
            {/* Aqui você vai encaixar os cards futuros */}

            <div className="cartoes-info">
              <div>Estoque total de Matéria Prima</div>
              <div className="cartoes-info__subcol">
                <div className="cartoes-info__title">1500</div>
                <div>vs Último Semestre</div>
              </div>

              {/* <div>Teste 2</div> */}
            </div>
            <div className="cartoes-info">
              <div>Demanda por Segmento</div>
              <div className="cartoes-info__demandas">
                <div>AGRO: 30%</div>
                <div>CONSTRUÇÃO: 30%</div>
                <div>RESIDENCIAL: 30%</div>
              </div>
            </div>
            <div className="cartoes-info">
              <div>Baixa Rotação</div>
              <div className="cartoes-info__subcol">
                <div className="cartoes-info__title">Telas</div>
                <div>Parado a 60 dias</div>
              </div>
            </div>
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
