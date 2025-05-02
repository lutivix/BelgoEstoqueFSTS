// src/components/dashboard/EstoqueTotalChart.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import "../Styles/EstoqueTotalChart.css";

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

type Props = {
  data: EstoqueDetalhado[];
};

const lojas = ["vitoria", "uniao", "linhares", "supertela", "telarame", "estruturaco"] as const;
type Loja = (typeof lojas)[number];

const coresLoja: Record<string, string> = {
  vitoria: "#0d6efd",
  uniao: "#6610f2",
  linhares: "#6f42c1",
  supertela: "#d63384",
  telarame: "#fd7e14",
  estruturaco: "#198754",
};

const EstoqueTotalChart = ({ data }: Props) => {
  // Agrupar estoque total por loja
  const estoquePorLoja = lojas.map((loja: Loja) => {
    const total = data.reduce((soma, p) => soma + (p.porLoja?.[loja] ?? 0), 0);
    return { loja, total };
  });

  return (
    <div className="dashboard__chart-content">
      {/* <div className="dashboard__chart-title">Estoque Total por Loja</div> */}
      <h4 className="dashboard__chart-title">Estoque Total</h4>
      <div className="dashboard__chart-subtitle">Distribuição de estoque por Loja</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={estoquePorLoja} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="loja" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="total"
            name="Total por loja"
            fill="#003b4a"
            radius={[6, 6, 0, 0]} // Arredondado só no topo
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EstoqueTotalChart;
