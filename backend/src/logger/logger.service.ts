// backend/src/logger/logger.service.ts
import { Injectable } from "@nestjs/common";
import { createLogger, format, transports } from "winston";
import * as fs from "fs";
import * as path from "path";
import * as DailyRotateFile from "winston-daily-rotate-file";

@Injectable()
export class LoggerService {
  private backendLogger;
  private frontendLogger;

  constructor() {
    // const today = new Date()
    //   .toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
    //   .split("/")
    //   .reverse()
    //   .join("");
    // const logDir = path.join(__dirname, "../../logs");
    const logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    // Logger do backend
    this.backendLogger = createLogger({
      format: format.combine(
        format.timestamp({ format: "DD/MM/YYYY HH:mm:ss.SSS" }),
        format.printf(
          ({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`,
        ),
      ),
      transports: [
        new DailyRotateFile({
          filename: `${logDir}/BelgoEstoqueBackend%DATE%.log`,
          datePattern: "YYYYMMDD",
          maxFiles: "30d",
        }),
        new transports.Console({ level: "info" }),
      ],
    });

    // Logger do frontend
    this.frontendLogger = createLogger({
      format: format.combine(
        format.timestamp({ format: "DD/MM/YYYY HH:mm:ss.SSS" }),
        format.printf(
          ({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`,
        ),
      ),
      transports: [
        new DailyRotateFile({
          filename: `${logDir}/BelgoEstoqueFrontend%DATE%.log`,
          datePattern: "YYYYMMDD",
          maxFiles: "30d",
        }),
      ],
    });
  }

  log(message: string, type: "L" | "P" | "O" = "L"): void {
    this.backendLogger.info(`[${type}] ${message}`);
  }

  warn(message: string, type: "L" | "P" | "O" = "L"): void {
    this.backendLogger.warn(`[${type}] ${message}`);
  }

  error(message: string, stack?: string): void {
    this.backendLogger.error(stack ? `${message}\n${stack}` : message);
  }

  logFrontend(message: string): void {
    this.frontendLogger.info(message);
  }

  warnFrontend(message: string): void {
    this.frontendLogger.warn(message);
  }

  errorFrontend(message: string): void {
    this.frontendLogger.error(message);
  }
}
