/* eslint-disable prettier/prettier */
// src/database/database.controller.ts
import { Controller, Get } from "@nestjs/common";
import { DatabaseService } from "./database.service";

@Controller("database")
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get("test")
  async testConnection(): Promise<string> {
    await this.databaseService.testConnection();
    return "Conexão com o banco OK!";
  }
}
