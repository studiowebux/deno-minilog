import Logger from "../src/mod.ts";

const logger = new Logger(); // Logs everything by default
logger.info("This is an info log");
logger.info({ foo: "bar" });
logger.info({ bar: "foo" });
logger.warn("This is a warning", { someKey: "Some value" });
try {
  throw new Error("An error occurred");
} catch (e: unknown) {
  logger.error(e as Error);
}

const specialLogger = new Logger({ info: false, warn: true, error: true });
specialLogger.info("should be hidden");
specialLogger.warn("This is a warning", { someKey: "Some value" });
specialLogger.error(
  new Error("An error occurred and should print only this message"),
);
try {
  throw new Error("An error occurred");
} catch (e: unknown) {
  specialLogger.error(e as Error);
}
