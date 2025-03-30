// backend/src/products/entities/product.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("OmieProduto")
export class Product {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column({ name: "COD_OMIE", length: 450 })
  codigo_omie: string;

  @Column({ name: "COD_PRD", length: 200 })
  codigo_produto: string;

  @Column({ name: "NOME", length: 200 })
  name: string;

  @Column({ name: "DESCR", length: 500, nullable: true })
  desc?: string;

  @Column({ name: "FAMILIA", length: 200, nullable: true })
  type?: string;

  @Column({ name: "COD_FAM", nullable: true, type: "bigint" })
  id_type?: number;

  @Column({ name: "COD_INTG", type: "bigint" })
  cod_integ: number;

  @Column({ name: "VL_UNI", type: "decimal", precision: 18, scale: 2 })
  valor_un: number;

  @Column({ name: "PRIM_LOJA" })
  primeira_loja: string;

  @Column({ name: "EST_ID", nullable: true })
  est_id?: number;

  // Removido o @OneToOne por enquanto
}
