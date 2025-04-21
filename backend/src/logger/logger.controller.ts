// logger.controller.ts
import { Controller, Post, Body, Get, Res } from "@nestjs/common";
import { LoggerService } from "./logger.service";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";
import * as archiver from "archiver";

@Controller("logger")
export class LoggerController {
  constructor(private readonly logger: LoggerService) {}

  @Post("frontend")
  logFrontend(
    @Body()
    body: {
      message: string;
      level: "info" | "warn" | "error";
      type?: "L" | "P" | "O";
      data?: unknown;
    },
  ): { status: string } {
    const { message, level, type = "L", data } = body;
    const fullMsg = `[FRONTEND] [${type}] ${message}` + (data ? ` | ${JSON.stringify(data)}` : "");

    try {
      if (level === "info") {
        this.logger.logFrontend(fullMsg);
      } else if (level === "warn") {
        this.logger.warnFrontend(fullMsg);
      } else if (level === "error") {
        this.logger.errorFrontend(fullMsg);
      }
    } catch (err) {
      this.logger.error(
        `Erro ao tentar registrar log do frontend: ${fullMsg}`,
        (err as Error).stack,
      );
    }

    return { status: "ok" };
  }

  @Get("download-frontend-logs")
  async downloadFrontendLogs(@Res() res: Response): Promise<void> {
    {
      const logDir = path.join(process.cwd(), "logs");
      const zipName = `BelgoEstoqueFrontendLogs_${new Date().toISOString().slice(0, 10)}.zip`;

      res.set({
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=${zipName}`,
      });

      const archive = archiver("zip", { zlib: { level: 9 } });

      // ⚠️ Trate erros corretamente no stream
      archive.on("error", (err) => {
        throw err;
      });

      archive.pipe(res);

      fs.readdirSync(logDir).forEach((file) => {
        if (file.includes("BelgoEstoqueFrontend")) {
          const filePath = path.join(logDir, file);
          archive.file(filePath, { name: file });
        }
      });

      const logger = this.logger;

      // ⚠️ MUITO IMPORTANTE: aguardar o fim do envio
      archive.finalize().then(() => {
        logger.log("Arquivo zip finalizado e enviado.");
      });
    }
  }

  @Get("ping")
  ping(): { msg: string } {
    return { msg: "LoggerController funcionando!" };
  }
}
