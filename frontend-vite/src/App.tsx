import "./App.css"; // Re-adicionando a importação conforme o arquivo do usuário
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

// Importações das páginas conforme estrutura do usuário (branch main)
import StockGrid from "./Pages/StockGrid";
import Dashboard from "./Pages/Dashboard";
import Reports from "./Pages/Reports";
import Settings from "./Pages/Settings";
import HelpCentre from "./Pages/Help";

// Importação do novo componente de exemplos de botões (adicionado pelo Tailwind setup)
import ButtonExamples from "./components/ButtonExamples";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas existentes do usuário (branch main) */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<StockGrid />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<HelpCentre />} />

        {/* Nova rota adicionada para a página de exemplos de botões */}
        <Route path="/buttons" element={<ButtonExamples />} />
      </Routes>
    </Router>
  );
}

export default App;

