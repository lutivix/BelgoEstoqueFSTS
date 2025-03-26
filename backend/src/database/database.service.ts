// src/database/database.service.ts
import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class DatabaseService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async testConnection(): Promise<string> {
    try {
      await this.dataSource.query("SELECT 1 AS test");
      return "Conexão bem-sucedida!";
    } catch (error) {
      return `Erro na conexão: ${error.message}`;
    }
  }
}
