// deno run -A tests/flow.ts
import Logger from "../src/mod.ts";

// This logger will ONLY show logs that are in the fork named `my_fn_logs`
// const logger = new Logger({ forkToPrint: ["my_fn_logs"] });
// const logger = new Logger({
//   forkToPrint: ["my_fn_logs", "my_second_fn"],
// });

// Will only show the two forks without debug level.
const logger = new Logger({
  forkToPrint: ["my_fn_logs", "my_second_fn"],
  debug: false,
});

// This logger will show ALL logs (Including ALL forks)
// const logger = new Logger();

// This logger will show ALL logs (Excluding ALL forks)
// const logger = new Logger({ forkToPrint: [], hideForks: true });

function myFn(logger: Logger, params: unknown) {
  logger.debug("myFn");
  logger.debug("My Function");
  logger
    .info("i'm doing stuff")
    .toggleForksVisibility()
    .debug("After toggling"); // this will never show
  logger.toggleForksVisibility().warn("Oops, stuff is now weird");
  logger.verbose(params);
  logger.debug("I'm done.");
}

function mySecondFn(logger: Logger) {
  logger.debug("mySecondFn");
  logger.debug("My Second Function");
  logger.debug("I'm done.");
}

// Main
logger.info("Application is starting...");
myFn(logger.fork("my_fn_logs"), { foo: "bar" });
mySecondFn(logger.fork("my_second_fn"));
logger.info("Application has ended.");
