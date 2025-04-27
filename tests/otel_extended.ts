// OTEL_SERVICE_NAME="deno-minilog-test" OTEL_METRIC_EXPORT_INTERVAL=1000 OTEL_DENO=true deno run -A --unstable-otel otel_extended.ts
// Deno takes care to auto-instrument fetch calls and few metrics.

// Shared
import { SpanStatusCode } from "npm:@opentelemetry/api";
import { metrics, trace } from "npm:@opentelemetry/api";

import Logger from "../src/mod.ts";

// Util Function
export function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const meter = metrics.getMeter("deno-minilog-test", "1.0.0");
const iterationCounter = meter.createCounter("iteration_counter", {
  "description": "Dummy counter",
});
const blockProcessedCounter = meter.createCounter("block_processed_counter", {
  "description": "Block Processed counter",
});

const tracer = trace.getTracer("deno-minilog-test", "1.0.0");

//
// Application
//

const logger = new Logger(); // Logs everything by default

const clog = logger.fork("testing fork & otel");

for (let i = 0; i < 1; i++) {
  await tracer.startActiveSpan("iteration", async (span) => {
    try {
      iterationCounter.add(1);
      span.updateName(`Iteration #${i}`);
      span.setAttribute("app.iteration", i);
      logger.info("This is an info log", { iteration: i });
      logger.info({ foo: "bar" });
      logger.info({ bar: "foo" });
      logger.warn("This is a warning", { someKey: "Some value" });
      tracer.startActiveSpan("test_forked_logger", (span) => {
        try {
          span.updateName(clog.getId());
          span.setAttribute("logger.id", clog.getId());
          clog.debug("This is a debug message from the fork.");
          span.setStatus({
            "code": SpanStatusCode.OK,
            message: "Test Done",
          });
        } finally {
          span.end();
        }
      });

      tracer.startActiveSpan("test_error_handler", (span) => {
        try {
          throw new Error("An error occurred");
        } catch (e: unknown) {
          span.recordException(e as Error);
          span.setStatus({
            "code": SpanStatusCode.ERROR,
            message: (e as Error).message,
          });
          logger.error(e as Error);
        } finally {
          span.end();
        }
      });

      await tracer.startActiveSpan(
        "test_auto_instrumentation",
        async (span) => {
          try {
            const response = await fetch("https://webuxlab.com");
            const data = await response.text();
            logger.info(`Received: ${data.length} characters`);
            span.setStatus({
              "code": SpanStatusCode.OK,
              message: "Data Fetched with success",
            });
          } finally {
            span.end();
          }
        },
      );

      span.setStatus({
        "code": SpanStatusCode.OK,
        message: "Iteration completed",
      });

      await timeout(500);
    } finally {
      span.end();
    }
  });
}

// Goal: Create an individual span per processing.
// The reason why I am testing this...
// Long lived running process and span aggregation
async function processSomething() {
  await tracer.startActiveSpan(
    "processSomething",
    async (span) => {
      try {
        const id = new Date().getTime();
        const entries = Math.floor(Math.random() * 100);
        logger.info(`Processing: ${id}`);
        span.addEvent(
          `Processing ${id} with ${entries} entries`,
        );
        const response = await fetch("https://webuxlab.com");
        const data = await response.text();
        logger.info(`Received: ${data.length} characters`);
        blockProcessedCounter.add(1);
        await timeout(entries);
        span.setStatus({
          "code": SpanStatusCode.OK,
          message: "Processing completed",
        });
      } finally {
        span.end();
      }
    },
  );
}

async function coreLoop() {
  for (let i = 0; i < 10; i++) {
    await processSomething();
  }
}

await coreLoop();

console.log("Test done.");
