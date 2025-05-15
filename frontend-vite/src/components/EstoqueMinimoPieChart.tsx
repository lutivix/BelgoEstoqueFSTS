import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import "../Styles/EstoqueMinimoPieChart.css";

interface ProdutoEstoque {
  name: string;
  emFalta: number; // percentual
}

interface Props {
  data: ProdutoEstoque[];
}

const ESTOQUE_FAIXAS = [
  { label: "0–20%", cor: "#dc3545", min: 0, max: 20 },
  { label: "20–40%", cor: "#fd7e14", min: 20, max: 40 },
  { label: "40–60%", cor: "#ffc107", min: 40, max: 60 },
  { label: "60–80%", cor: "#198754", min: 60, max: 80 },
  { label: "80%+", cor: "#003b4a", min: 80, max: Infinity },
];

const EstoqueMinimoPieChart = ({ data }: Props) => {
  if (!data || data.length === 0) {
    return <div className="dashboard__chart-placeholder">Nenhum dado disponível</div>;
  }

  const totalProdutos = data.length;

  const agrupado = ESTOQUE_FAIXAS.map((faixa) => {
    const qtd = data.filter((p) => {
      const valor = Math.max(p.emFalta, 0);
      return valor >= faixa.min && valor < faixa.max;
    }).length;

    return {
      ...faixa,
      qtd,
    };
  });

  return (
    <div className="dashboard__chart-content">
      <h4 className="dashboard__chart-title">Estoque Mínimo</h4>
      <div className="dashboard__chart-subtitle">Distribuição por faixa de cobertura</div>
      <ResponsiveContainer width="100%" minHeight={160}>
        <PieChart>
          <Pie
            data={agrupado}
            dataKey="qtd"
            nameKey="label"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={3}
            cornerRadius={6}
          >
            {agrupado.map((item, index) => (
              <Cell key={index} fill={item.cor} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `${value} produto(s)`} />
        </PieChart>
      </ResponsiveContainer>
      <div className="dashboard__chart-center-label">{totalProdutos} produtos</div>

      <div className="dashboard__chart-legend">
        <div className="legend-column">
          {agrupado.map((faixa) => (
            <div key={faixa.label} className="legend-item">
              <span className="color-icon" style={{ backgroundColor: faixa.cor }} />
              <span className="legend-label">{faixa.label}</span>
              <span className="legend-value">{faixa.qtd} produtos</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EstoqueMinimoPieChart;
