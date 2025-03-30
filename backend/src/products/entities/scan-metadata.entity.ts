import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("ScanMetadata")
export class ScanMetadata {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "datetime" })
  lastMovementScan: Date;
}
