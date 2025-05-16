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
  Cell,
} from "recharts";
import "../Styles/EstoqueTotalChart.css";
import { useMediaQuery } from "react-responsive";

import { useNavigate } from "react-router-dom";

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
  data: {
    name: string;
    estoque_total: number;
  }[];
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

const formatarNumero = (valor: number) => {
  if (valor >= 1_000_000) return (valor / 1_000_000).toFixed(2) + "M";
  if (valor >= 1_000) return (valor / 1_000).toFixed(2) + "K";
  return valor.toFixed(2);
};

const EstoqueTotalChart = ({ data }: Props) => {
  const isMobile = useMediaQuery({ maxWidth: 540 });
  // Agrupar estoque total por loja
  const estoquePorLoja = data;

  const navigate = useNavigate();

  return (
    <div className="dashboard__chart-content">
      {/* <div className="dashboard__chart-title">Estoque Total por Loja</div> */}
      <h4 className="dashboard__chart-title">Estoque Total</h4>
      <div className="dashboard__chart-subtitle">Distribuição de estoque por Loja K/M</div>
      {/* <ResponsiveContainer width="100%" minHeight={300}> */}
      <ResponsiveContainer width={isMobile ? 300 : "100%"} minHeight={160}>
        <BarChart data={estoquePorLoja} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          {/* <XAxis dataKey="loja" /> */}
          <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={50} />

          <YAxis tickFormatter={formatarNumero} />
          <Tooltip formatter={(value) => formatarNumero(Number(value))} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="estoque_total"
            name="Total"
            fill="#003b4a"
            radius={[6, 6, 0, 0]} // Arredondado só no topo
            barSize={window.innerWidth < 640 ? 15 : 25} // exemplo de ajuste para mobile
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                onClick={() => {
                  const loja = entry?.name?.toLowerCase();
                  if (loja) {
                    console.log(`Foi para /products?loja=${encodeURIComponent(loja)}`);
                    navigate(`/products?loja=${encodeURIComponent(loja)}`);
                  }
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EstoqueTotalChart;
