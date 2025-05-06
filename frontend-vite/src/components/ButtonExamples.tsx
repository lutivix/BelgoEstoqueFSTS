import React from 'react';
import Button from './Button'; // Import the Button component
import Layout from './Layout'; // Assuming Layout provides the sidebar and overall structure

const ButtonExamples: React.FC = () => {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-text-heading mb-4">Exemplos de Botões</h1>
        <p className="text-text-secondary mb-6">Demonstração das variantes e tamanhos do componente Button estilizado com Tailwind CSS e Design Tokens do Figma.</p>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-text-heading mb-2">Variantes</h2>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="primary" title="Variante Principal (Primary)">Primary</Button>
              <Button variant="secondary" title="Variante Secundária (Secondary)">Secondary</Button>
              <Button variant="success" title="Variante de Sucesso (Success)">Success</Button>
              <Button variant="warning" title="Variante de Aviso (Warning)">Warning</Button>
              {/* Added direct Tailwind class for testing */}
              <Button variant="danger" title="Variante de Perigo (Danger)">Danger</Button>
              <Button variant="primary" disabled title="Variante Principal Desabilitada">Disabled</Button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-text-heading mb-2">Tamanhos (com Variante Primary)</h2>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="primary" size="sm" title="Tamanho Pequeno (sm)">Small (sm)</Button>
              <Button variant="primary" size="base" title="Tamanho Base (base)">Base (base)</Button>
              <Button variant="primary" size="lg" title="Tamanho Grande (lg)">Large (lg)</Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ButtonExamples;

