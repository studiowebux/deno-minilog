import { loggerInstance } from "../../src/mod.ts";
import { myFn, myFnForked } from "./f1.ts";

loggerInstance.setConfig({ debug: false });

// main
loggerInstance.info("Application is starting");
myFn();
myFnForked();
loggerInstance.info("Application has ended");
