export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

function formatLog(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
  const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
  const err = entry.error ? ` ERROR: ${entry.error.name}: ${entry.error.message}` : "";
  return `${base}${ctx}${err}`;
}

export function log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    error: error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined,
  };

  const formatted = formatLog(entry);

  switch (level) {
    case "debug":
      console.debug(formatted);
      break;
    case "info":
      console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }
}

export function debug(message: string, context?: Record<string, unknown>): void {
  log("debug", message, context);
}

export function info(message: string, context?: Record<string, unknown>): void {
  log("info", message, context);
}

export function warn(message: string, context?: Record<string, unknown>, error?: Error): void {
  log("warn", message, context, error);
}

export function error(message: string, context?: Record<string, unknown>, error?: Error): void {
  log("error", message, context, error);
}

export const logger = {
  debug,
  info,
  warn,
  error,
};
