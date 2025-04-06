import { MigrationInterface, QueryRunner } from "typeorm";

export class AddScanMetadata1743191590411 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ScanMetadata" (
        "id" int NOT NULL IDENTITY(1,1),
        "lastMovementScan" datetime NOT NULL,
        CONSTRAINT "PK_ScanMetadata" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ScanMetadata"`);
  }
}
