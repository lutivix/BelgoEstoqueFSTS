/* frontend-vite/src/types/omie-product-from-db.ts */
export interface OmieProductFromDb {
  codigo_produto: string;
  codigo_omie: string;
  name: string;
  desc: string;
  type: string;
  id_type: string;
  valor_un: number;
  primeira_loja: string;
  id: string; // Mude de number pra string
  cod_integ: string;
  estoque_vitoria: number;
  estoque_uniao: number;
  estoque_linhares: number;
  estoque_supertela: number;
  estoque_telarame: number;
  estoque_estruturaco: number;
  estoque_vitoria_dm1: number;
  estoque_uniao_dm1: number;
  estoque_linhares_dm1: number;
  estoque_supertela_dm1: number;
  estoque_telarame_dm1: number;
  estoque_estruturaco_dm1: number;
  estoque_total: number;
  estoque_total_dm1: number;
  D?: string; // Opcional
  DM1?: string; // Opcional
}
