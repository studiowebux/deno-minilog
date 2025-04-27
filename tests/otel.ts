// deno run -A otel.ts
import { ATTR_SERVICE_NAME } from "npm:@opentelemetry/semantic-conventions";
import { resourceFromAttributes } from "npm:@opentelemetry/resources";

// import { diag, DiagConsoleLogger, DiagLogLevel } from "npm:@opentelemetry/api";
import { logs } from "npm:@opentelemetry/api-logs";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
  // ConsoleLogRecordExporter,
  // SimpleLogRecordProcessor,
} from "npm:@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "npm:@opentelemetry/exporter-logs-otlp-http";

import Logger from "../src/mod.ts";

export function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Optional and only needed to see the internal diagnostic logging (during development)
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// Local console only
// const loggerProvider = new LoggerProvider();
// loggerProvider.addLogRecordProcessor(
//   new SimpleLogRecordProcessor(new ConsoleLogRecordExporter())
// );

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: "deno-minilog-test",
});

// Send to remote port 4318
const logExporter = new OTLPLogExporter();
const loggerProvider = new LoggerProvider({ resource });
loggerProvider.addLogRecordProcessor(
  new BatchLogRecordProcessor(logExporter),
);
logs.setGlobalLoggerProvider(loggerProvider);

const logger = new Logger({
  otelSupport: true,
  loggerProvider,
  loggerName: "test-minilog",
}); // Logs everything by default

const clog = logger.fork("testing fork & otel");

for (let i = 0; i < 100; i++) {
  logger.info("This is an info log", { iteration: i });
  logger.info({ foo: "bar" });
  logger.info({ bar: "foo" });
  logger.warn("This is a warning", { someKey: "Some value" });
  clog.debug("This is a debug message from the fork.");
  try {
    throw new Error("An error occurred");
  } catch (e: unknown) {
    logger.error(e as Error);
  }

  await timeout(500);
}

await loggerProvider.shutdown();
await logExporter.shutdown();

console.log("Test done.");
