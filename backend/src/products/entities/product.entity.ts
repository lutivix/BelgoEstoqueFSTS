// backend/src/products/entities/product.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("OmieProduto")
export class Product {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column({ name: "COD_OMIE", unique: true })
  codigo_omie: string;

  @Column({ name: "COD_PRD" })
  codigo_produto: string;

  @Column({ name: "NOME", length: 100 })
  name: string;

  @Column({ name: "DESCR", length: 200, nullable: true })
  desc?: string;

  @Column({ name: "FAMILIA", nullable: true })
  type?: string;

  @Column({ name: "COD_FAM", nullable: true })
  id_type?: number;

  @Column({ name: "COD_INTG" })
  cod_integ: number;

  @Column({ name: "VL_UNI", type: "decimal", precision: 18, scale: 2 })
  valor_un: number;

  @Column({ name: "PRIM_LOJA" })
  primeira_loja: string;

  @Column({ name: "EST_ID", nullable: true })
  est_id?: number;

  // Removido o @OneToOne por enquanto
}
