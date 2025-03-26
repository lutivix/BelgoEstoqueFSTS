// backend/src/products/entities/stock.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("EstoqueBelgo")
export class Stock {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column({ name: "OMIE_PRD_ID" })
  omiePrdId: string;

  @Column({
    type: "datetime2",
    name: "EST_D",
    default: () => "'2024-11-01T17:12:13.9554664-03:00'",
  })
  DHoje: Date;

  @Column({
    type: "datetime2",
    name: "EST_DM1",
    default: () => "'2024-11-01T17:12:13.9553938-03:00'",
  })
  DMenos1: Date;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  EST_VIX?: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  EST_UNI?: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  EST_LIN?: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  EST_SUP?: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  EST_TEL?: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  EST_EST?: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  EST_VIX_DM1?: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  EST_UNI_DM1?: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  EST_LIN_DM1?: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  EST_SUP_DM1?: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  EST_TEL_DM1?: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  EST_EST_DM1?: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  EST_TOTAL_HOJE?: number;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  EST_TOTAL_DM1?: number;

  // Removido o @ManyToOne por enquanto
}
