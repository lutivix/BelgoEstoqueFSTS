export type LogLevel = "info" | "warn" | "error";
export type LogType = "L" | "P" | "O";

export const log = async (
  message: string,
  level: LogLevel = "info",
  type: LogType = "L",
  data?: any,
) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${type}]`;
  const fullMessage = `${prefix} ${message}`;

  if (import.meta.env.DEV) {
    if (level === "info") console.log(fullMessage, data ?? "");
    if (level === "warn") console.warn(fullMessage, data ?? "");
    if (level === "error") console.error(fullMessage, data ?? "");
  }

  try {
    await fetch("http://localhost:3000/api/logger/frontend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, level, type, data }),
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error("[LOGGER] Erro ao enviar log para o backend", err);
    }
  }
};
