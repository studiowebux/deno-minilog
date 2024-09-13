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

logger.verbose("This is a verbose message.");
logger.trace("This is a trace message.");
logger.debug("This is a debug message.");

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

// Isolate logs output to the fork prints only
const jsonLoggerSimple = new Logger({
  format: "json",
});
jsonLoggerSimple.info("should be hidden");
jsonLoggerSimple.warn("This is a warning", { someKey: "Some value" });
jsonLoggerSimple.warn({ foo: "bar" });
jsonLoggerSimple.error(
  new Error("An error occurred and should print only this message"),
);
jsonLoggerSimple.verbose("This is a verbose message.");
jsonLoggerSimple.trace("This is a trace message.");
jsonLoggerSimple.debug("This is a debug message.");

console.log("Test with isolation:");
// Isolate logs output to the fork prints only
const jsonLogger = new Logger({
  format: "json",
  forkToPrint: ["testinf feat 1"],
});
jsonLogger.verbose("wont be shown.");
jsonLogger.trace("wont be shown.");
jsonLogger.debug("wont be shown.");

const clog = jsonLogger.fork("testinf feat 1");
clog.debug("This is a debug message.");
jsonLogger.debug("In between, without ids");
clog.debug(
  "Im debugging stuff in between this section marked by the id to this other section",
);
clog.resetFork();

jsonLogger.debug("After resetting the fork");
