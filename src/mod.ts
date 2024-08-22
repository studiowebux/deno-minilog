/**
 * A module providing a simple logger with customizable log levels and colors.
 * @module deno-minilog
 */

import { Color } from "./colors.ts";

type Level = "error" | "warn" | "info";
type Config = Record<Level, boolean>;

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
  };

  /**
   * Creates a new Logger instance with optional configuration settings.
   * @param {Partial<Config>} [config] - Partial configuration object for the logger.
   */
  constructor(config?: Partial<Config>) {
    if (config) this.config = { ...this.config, ...config };
  }

  /**
   * Logs a message with the specified level.
   * @private
   * @param {Level} level - The log level ("error", "warn", or "info").
   * @param {unknown} message - The main message to be logged.
   * @param {...unknown[]} args - Additional arguments to be logged.
   */
  private log(level: Level, message: unknown, ...args: unknown[]): void {
    // If the level is disabled, we don't log anything
    if (!this.config[level]) return;

    let msg = "";
    args.forEach((arg) => {
      if (typeof arg !== "string" && !(arg instanceof Error)) {
        msg += ` ${JSON.stringify(arg)}`;
      } else if (arg instanceof Error) {
        msg += `${arg.message}`;
      } else {
        msg += ` ${arg}`;
      }
    });

    const formattedMessage: string =
      typeof message === "string"
        ? message
        : message instanceof Error
          ? this.formatError(message)
          : JSON.stringify(message);

    console[level](
      Color(
        Color(
          `${new Date().toLocaleString()} ${level.toUpperCase()}: `,
          "Bold",
        ),
        level === "error" ? "FgRed" : level === "warn" ? "FgYellow" : "FgGreen",
      ),
      formattedMessage,
      msg,
    );
  }

  /**
   * Logs an info message.
   * @param {unknown} message - The main message to be logged.
   * @param {...unknown[]} args - Additional arguments to be logged.
   */
  info(message: unknown, ...args: unknown[]): void {
    this.log("info", message, ...args);
  }

  /**
   * Logs a warning message.
   * @param {unknown} message - The main message to be logged.
   * @param {...unknown[]} args - Additional arguments to be logged.
   */
  warn(message: unknown, ...args: unknown[]): void {
    this.log("warn", message, ...args);
  }

  /**
   * Logs an error message.
   * @param {unknown} message - The main message to be logged.
   * @param {...unknown[]} args - Additional arguments to be logged.
   */
  error(message: unknown, ...args: unknown[]): void {
    this.log("error", message, ...args);
  }

  /**
   * Formats an Error object into a string with additional details.
   * @param {Error} message - The Error object to be formatted.
   * @returns {string} - The formatted error string.
   */
  formatError(message: Error): string {
    return `${Color(`${message.name}:`, "Bold")} ${message.message} ${Color("[stack]:", "Bold")} ${JSON.stringify(message.stack)}`;
  }
}
