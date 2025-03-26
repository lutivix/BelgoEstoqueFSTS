// frontend/src/App.tsx
import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoadInitial = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await axios.get('http://localhost:3000/products/load-initial/VITORIA');
      setMessage(response.data.message);
    } catch (err: any) {
      console.error('Erro no front-end:', err.response?.data || err.message); // Log detalhado
      setError(err.response?.data?.message || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Controle de Estoque</h1>
      <button onClick={handleLoadInitial} disabled={loading}>
        {loading ? 'Carregando...' : 'Carregar Produtos Iniciais'}
      </button>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default App;