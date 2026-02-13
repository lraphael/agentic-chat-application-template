/**
 * Simple structured logger that works with Turbopack.
 *
 * Pino's dynamic worker thread modules (pino-XXXXX) are incompatible with Turbopack,
 * even with serverExternalPackages configured. This logger provides the same interface
 * (info, warn, error, debug, child) using structured JSON via console.
 */

const logLevel = process.env["LOG_LEVEL"] ?? "info";
const serviceName = process.env["APP_NAME"] ?? "ai-opti-nextjs-starter";
const environment = process.env["NODE_ENV"] ?? "development";

const LOG_LEVELS: Record<string, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

function shouldLog(level: string): boolean {
  return (LOG_LEVELS[level] ?? 30) >= (LOG_LEVELS[logLevel] ?? 30);
}

function formatLog(level: string, bindings: Record<string, unknown>, args: unknown[]): string {
  const obj: Record<string, unknown> = {
    level,
    time: new Date().toISOString(),
    service: serviceName,
    environment,
    ...bindings,
  };

  // Handle pino-style calling convention: logger.info({ data }, "message") or logger.info("message")
  if (
    args.length === 2 &&
    typeof args[0] === "object" &&
    args[0] !== null &&
    typeof args[1] === "string"
  ) {
    Object.assign(obj, args[0]);
    obj["msg"] = args[1];
  } else if (args.length === 1 && typeof args[0] === "string") {
    obj["msg"] = args[0];
  } else if (args.length === 1 && typeof args[0] === "object" && args[0] !== null) {
    Object.assign(obj, args[0]);
  } else {
    obj["msg"] = args.map(String).join(" ");
  }

  return JSON.stringify(obj);
}

interface SimpleLogger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  trace: (...args: unknown[]) => void;
  fatal: (...args: unknown[]) => void;
  child: (bindings: Record<string, unknown>) => SimpleLogger;
  level: string;
}

function createLogger(bindings: Record<string, unknown> = {}): SimpleLogger {
  const log = (level: string, consoleFn: (...args: unknown[]) => void) => {
    return (...args: unknown[]) => {
      if (shouldLog(level)) {
        consoleFn(formatLog(level, bindings, args));
      }
    };
  };

  return {
    /* eslint-disable no-console */
    info: log("info", console.log),
    warn: log("warn", console.warn),
    error: log("error", console.error),
    debug: log("debug", console.debug),
    trace: log("trace", console.trace),
    fatal: log("fatal", console.error),
    /* eslint-enable no-console */
    child: (childBindings: Record<string, unknown>) =>
      createLogger({ ...bindings, ...childBindings }),
    level: logLevel,
  };
}

export const logger = createLogger();

export type Logger = SimpleLogger;
