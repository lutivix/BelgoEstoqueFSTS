// backend/src/logger/logger.service.ts
import { Injectable } from "@nestjs/common";
import { createLogger, format, transports } from "winston";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class LoggerService {
  private logger;

  constructor() {
    const today = new Date()
      .toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
      .split("/")
      .reverse()
      .join("");
    // const logDir = path.join(__dirname, "../../logs");
    const logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    this.logger = createLogger({
      format: format.combine(
        format.timestamp({ format: "DD/MM/YYYY HH:mm:ss.SSS" }),
        format.printf(
          ({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`,
        ),
      ),
      transports: [
        new transports.File({
          filename: `${logDir}/BelgoEstoqueBackend${today}.log`,
        }),
        new transports.Console({ level: "info" }),
      ],
    });
  }

  log(message: string, type: "L" | "P" | "O" = "L") {
    this.logger.info(`[${type}] ${message}`);
  }

  warn(message: string, type: "L" | "P" | "O" = "L") {
    this.logger.warn(`[${type}] ${message}`);
  }

  error(message: string, stack?: string) {
    this.logger.error(stack ? `${message}\n${stack}` : message);
  }
}
