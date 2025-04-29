import type { Logger as OtelLogger } from "@opentelemetry/api-logs";
import type { LoggerProvider } from "@opentelemetry/sdk-logs";

import { Color } from "./colors.ts";
import { replacer } from "./util.ts";

type Level = "error" | "warn" | "info" | "debug" | "verbose" | "trace";
type Format = "json" | "text";
type ForkToPrint = string[];
type Config = Record<Level, boolean> & {
  format: Format;
  forkToPrint: ForkToPrint;
  hideForks: boolean;
  // OTEL
  otelSupport: boolean;
  loggerProvider: LoggerProvider | undefined;
  loggerName: string;
  // Error
  withErrorTrace: boolean;
};

/**
 * A Logger class for logging messages with different levels (error, warn, info).
 * @class
 */
export default class Logger {
  /**
   * The configuration object for the logger.
   * @private
   */
  private config: Config = {
    error: true,
    warn: true,
    info: true,
    debug: true,
    verbose: true,
    trace: true,
    format: "text",
    forkToPrint: [],
    hideForks: false,
    otelSupport: false,
    loggerProvider: undefined,
    loggerName: "minilog",
    withErrorTrace: false,
  };
  private id: string | undefined;

  // OpenTelemetry
  private logger: OtelLogger | undefined;

  /**
   * Creates a new Logger instance with optional configuration settings.
   * @param {Partial<Config>} [config] - Partial configuration object for the logger.
   */
  constructor(config?: Partial<Config>) {
    if (config) this.config = { ...this.config, ...config };

    // Otel Logger
    if (this.config.loggerProvider && this.config.otelSupport) {
      this.logger = this.config.loggerProvider.getLogger(
        this.config.loggerName,
      );
    }
  }

  /**
   * Logs a message with the specified level.
   * @private
   * @param {Level} level - The log level ("error", "warn", or "info").
   * @param {...unknown[]} args - arguments to be logged, when using Otel Logger, it must be (msg: string, attributes: Record<string, unknown>)
   */
  private log(
    level: Level,
    msg: string,
    attributes: Record<string, unknown>,
  ): Logger;
  private log(level: Level, ...args: unknown[]): Logger {
    const timestamp = new Date();
    // If the level is disabled, we don't log anything
    if (!this.config[level]) {
      return this;
    }
    if (this.config.hideForks && this.id) {
      return this;
    }
    if (this.config.forkToPrint.length > 0) {
      if (!this.id || !this.config.forkToPrint.includes(this.id)) {
        return this;
      }
    }

    let msg = "";
    let attributes = {};

    // Using Otel Format
    if (this.config.otelSupport === true) {
      const [userMessage, userAttributes] = args;
      msg = this.formatMessage(userMessage);
      attributes = userAttributes as Record<string, unknown>;
    } else {
      // Using STD Formart
      args.forEach((arg) => {
        msg += this.formatMessage(arg);
      });
    }

    if (this.config.format === "text") {
      const id = this.id ? ` [${this.id}]` : "";
      this.getConsoleFunction(level)(
        Color(
          Color(
            `${timestamp.toLocaleString()} ${level.toUpperCase()}${id}: `,
            "Bold",
          ),
          level === "error"
            ? "FgRed"
            : level === "warn"
            ? "FgYellow"
            : level === "debug"
            ? "FgCyan"
            : level === "verbose"
            ? "FgGray"
            : level === "trace"
            ? "FgMagenta"
            : "FgGreen",
        ),
        msg,
      );

      // OTEL Logs
      this.logger?.emit({
        severityText: level,
        body: msg,
        attributes: {
          id: this.id,
          timestamp: timestamp.getTime(),
          ...attributes,
        },
      });
    } else if (this.config.format === "json") {
      this.getConsoleFunction(level)(
        JSON.stringify(
          {
            message: msg,
            level: level,
            timestamp,
            id: this.id,
          },
          replacer,
        ),
      );

      // OTEL Logs
      this.logger?.emit({
        severityText: level,
        body: msg,
        attributes: {
          id: this.id,
          timestamp: timestamp.getTime(),
          ...attributes,
        },
      });
    }

    return this;
  }

  /**
   * Extract the correct console function to print the message(s) on the console.
   * @param {Level} level Print function to use.
   */
  getConsoleFunction(level: Level): (...data: unknown[]) => void {
    if (["debug", "verbose"].includes(level)) {
      return console.debug;
    } else if (["info"].includes(level)) {
      return console.info;
    } else if (["warn"].includes(level)) {
      return console.warn;
    } else if (["error"].includes(level)) {
      return console.error;
    } else if (["trace"].includes(level)) {
      return console.trace;
    }
    return console.log;
  }

  /**
   * Assign an id for a section of the logger, used to track the logs in an application flow
   * @param {string} identifier - The identifier value to print in the logs
   */
  fork(identifier: string): Logger {
    const logger = new Logger(this.config);
    logger.id = identifier;
    return logger;
  }

  /**
   * Programmatically toggle the forks visibility
   */
  toggleForksVisibility(): Logger {
    this.config.hideForks = !this.config.hideForks;
    return this;
  }

  /**
   * Reset the set id to track logs
   */
  resetFork(): Logger {
    this.id = undefined;
    return this;
  }

  /**
   * Logs an info message. When Otel Support is enabled (msg: string, attributes: Record<string, unknown>)
   * @param {unknown} message - The main message to be logged.
   * @param {...unknown[]} args - Additional arguments to be logged.
   */
  info(message: unknown, ...args: unknown[]): Logger {
    // @ts-ignore
    this.log("info", message, ...args);
    return this;
  }

  /**
   * Logs a warning message.  When Otel Support is enabled (msg: string, attributes: Record<string, unknown>)
   * @param {unknown} message - The main message to be logged.
   * @param {...unknown[]} args - Additional arguments to be logged.
   */
  warn(message: unknown, ...args: unknown[]): Logger {
    // @ts-ignore
    this.log("warn", message, ...args);
    return this;
  }

  /**
   * Logs an error message. When Otel Support is enabled (msg: string, attributes: Record<string, unknown>)
   * @param {unknown} message - The main message to be logged.
   * @param {...unknown[]} args - Additional arguments to be logged.
   */
  error(message: unknown, ...args: unknown[]): Logger {
    // @ts-ignore
    this.log("error", message, ...args);
    return this;
  }

  /**
   * Logs a debug message. When Otel Support is enabled (msg: string, attributes: Record<string, unknown>)
   * @param {unknown} message - The main message to be logged.
   * @param {...unknown[]} args - Additional arguments to be logged.
   */
  debug(message: unknown, ...args: unknown[]): Logger {
    // @ts-ignore
    this.log("debug", message, ...args);
    return this;
  }

  /**
   * Logs a verbose message. When Otel Support is enabled (msg: string, attributes: Record<string, unknown>)
   * @param {unknown} message - The main message to be logged.
   * @param {...unknown[]} args - Additional arguments to be logged.
   */
  verbose(message: unknown, ...args: unknown[]): Logger {
    // @ts-ignore
    this.log("verbose", message, ...args);
    return this;
  }

  /**
   * Logs a trace message. When Otel Support is enabled (msg: string, attributes: Record<string, unknown>)
   * @param {unknown} message - The main message to be logged.
   * @param {...unknown[]} args - Additional arguments to be logged.
   */
  trace(message: unknown, ...args: unknown[]): Logger {
    // @ts-ignore
    this.log("trace", message, ...args);
    return this;
  }

  /**
   * Formats an Error object into a string with additional details.
   * @param {Error} message - The Error object to be formatted.
   * @returns {string} - The formatted error string.
   */
  formatError(message: Error): string {
    if (this.config.format === "text") {
      return `${Color(`${message.name}:`, "Bold")} ${message.message}\n${
        Color("[stack]:", "Bold")
      } ${message.stack}`;
    }

    return `${message.name}: ${message.message} [stack] ${
      JSON.stringify(message.stack)
    }`;
  }

  /**
   * Format the message to always return a string
   * @param message User input to be formatted
   * @returns
   */
  formatMessage(message: unknown): string {
    let msg = "";
    if (typeof message !== "string" && !(message instanceof Error)) {
      msg += ` ${JSON.stringify(message, replacer)}`;
    } else if (message instanceof Error && this.config.withErrorTrace) {
      // expanding with the error name, message and stack.
      msg += this.formatError(message);
    } else if (message instanceof Error) {
      // Keeping only the error message.
      msg += `${message.message}`;
    } else {
      msg += ` ${message}`;
    }

    return msg;
  }

  /**
   * Setup the logger with new configuration
   * Useful with the singleton
   */
  setConfig(config: Partial<Config>) {
    if (config) this.config = { ...this.config, ...config };
  }

  /**
   * @returns Logger id (if any)
   */
  getId(): string {
    return this.id || "";
  }
}

/**
 * Logger Singleton to centralize the configuration
 */
export const loggerInstance: Logger = new Logger();
