import { loggerInstance } from "../../src/mod.ts";

export function myFn() {
  // Wont show if the loggerInstance from bin.ts is hiding the debug logs.
  loggerInstance.debug("From the singleton.");
  loggerInstance.info("myFn is done.");
}

export function myFnForked() {
  // Wont show if the loggerInstance from bin.ts is hiding the debug logs.
  const forkedLogger = loggerInstance
    .fork("myFnForked")
    .warn("Warning from a fork from the singleton in composition.");
  forkedLogger.info("myFn is done.");
}
