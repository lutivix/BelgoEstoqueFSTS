// import { Controller, Get } from '@nestjs/common';
// import { AppService } from './app.service';

// @Controller()
// export class AppController {
//   constructor(private readonly appService: AppService) {}

//   @Get()
//   getHello(): string {
//     return this.appService.getHello();
//   }
// }

// src/app.controller.ts
import { Controller, Get } from "@nestjs/common";
import { DatabaseService } from "./database/database.service";

@Controller()
export class AppController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  async getHello(): Promise<string> {
    return this.databaseService.testConnection();
  }
}
