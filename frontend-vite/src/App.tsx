import { useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import StockGrid from "./components/StockGrid"; // Ajuste o caminho
import Dashboard from "./components/Dashboard"; // Ajuste o caminho
import Reports from "./Pages/Reports"; // Novo
import Settings from "./Pages/Settings"; // Novo
import HelpCentre from "./Pages/Help"; // Novo

function App() {
  const [count, setCount] = useState(0);

  return (
    //   <>
    //     {/* <div>
    //       <a href="https://vitejs.dev" target="_blank">
    //         <img src={viteLogo} className="logo" alt="Vite logo" />
    //       </a>
    //       <a href="https://react.dev" target="_blank">
    //         <img src={reactLogo} className="logo react" alt="React logo" />
    //       </a>
    //     </div>
    //     <h1>Vite + React</h1>
    //     <div className="card">
    //       <button onClick={() => setCount((count) => count + 1)}>
    //         count is {count}
    //       </button>
    //       <p>
    //         Edit <code>src/App.tsx</code> and save to test HMR
    //       </p>
    //     </div>
    //     <p className="read-the-docs">
    //       Click on the Vite and React logos to learn more
    //     </p> */}
    //   </>
    // )

    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<StockGrid />} />
        <Route path="/reports" element={<Reports />} /> {/* Relatórios */}
        <Route path="/settings" element={<Settings />} /> {/* Configurações */}
        <Route path="/help" element={<HelpCentre />} /> {/* Help Centre */}
      </Routes>
    </Router>
  );
}

export default App;
