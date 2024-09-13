import { Color } from "./colors.ts";

type Level = "error" | "warn" | "info" | "debug" | "verbose" | "trace";
type Format = "json" | "text";
type ForkToPrint = string[];
type Config = Record<Level, boolean> & {
  format: Format;
  forkToPrint: ForkToPrint;
  hideForks: boolean;
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
  };
  private id: string | undefined;

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
   * @param {...unknown[]} args - arguments to be logged.
   */
  private log(level: Level, ...args: unknown[]): Logger {
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
    args.forEach((arg) => {
      if (typeof arg !== "string" && !(arg instanceof Error)) {
        msg += ` ${JSON.stringify(arg)}`;
      } else if (arg instanceof Error) {
        msg += `${arg.message}`;
      } else {
        msg += ` ${arg}`;
      }
    });

    if (this.config.format === "text") {
      const id = this.id ? ` [${this.id}]` : "";
      this.getConsoleFunction(level)(
        Color(
          Color(
            `${new Date().toLocaleString()} ${level.toUpperCase()}${id}: `,
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
    } else if (this.config.format === "json") {
      this.getConsoleFunction(level)(
        JSON.stringify({
          message: msg,
          level: level,
          timestamp: new Date().toLocaleString(),
          id: this.id,
        }),
      );
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
   * Logs an info message.
   * @param {unknown} message - The main message to be logged.
   * @param {...unknown[]} args - Additional arguments to be logged.
   */
  info(message: unknown, ...args: unknown[]): Logger {
    this.log("info", message, ...args);
    return this;
  }

  /**
   * Logs a warning message.
   * @param {unknown} message - The main message to be logged.
   * @param {...unknown[]} args - Additional arguments to be logged.
   */
  warn(message: unknown, ...args: unknown[]): Logger {
    this.log("warn", message, ...args);
    return this;
  }

  /**
   * Logs an error message.
   * @param {unknown} message - The main message to be logged.
   * @param {...unknown[]} args - Additional arguments to be logged.
   */
  error(message: unknown, ...args: unknown[]): Logger {
    this.log("error", message, ...args);
    return this;
  }

  /**
   * Logs a debug message.
   * @param {unknown} message - The main message to be logged.
   * @param {...unknown[]} args - Additional arguments to be logged.
   */
  debug(message: unknown, ...args: unknown[]): Logger {
    this.log("debug", message, ...args);
    return this;
  }

  /**
   * Logs a verbose message.
   * @param {unknown} message - The main message to be logged.
   * @param {...unknown[]} args - Additional arguments to be logged.
   */
  verbose(message: unknown, ...args: unknown[]): Logger {
    this.log("verbose", message, ...args);
    return this;
  }

  /**
   * Logs a trace message.
   * @param {unknown} message - The main message to be logged.
   * @param {...unknown[]} args - Additional arguments to be logged.
   */
  trace(message: unknown, ...args: unknown[]): Logger {
    this.log("trace", message, ...args);
    return this;
  }

  /**
   * Formats an Error object into a string with additional details.
   * @param {Error} message - The Error object to be formatted.
   * @returns {string} - The formatted error string.
   */
  formatError(message: Error): string {
    return `${Color(`${message.name}:`, "Bold")} ${message.message} ${Color("[stack]:", "Bold")} ${JSON.stringify(message.stack)}`;
  }

  /**
   * Setup the logger with new configuration
   * Useful with the singleton
   */
  setConfig(config: Partial<Config>) {
    if (config) this.config = { ...this.config, ...config };
  }
}

/**
 * Logger Singleton to centralize the configuration
 */
export const loggerInstance = new Logger();
