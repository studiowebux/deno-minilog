// deno run -A otel_manual.ts
// Deno takes care to auto-instrument fetch calls and few metrics.

// Instance ID (distributed infrastructure)
import { randomUUID } from "node:crypto";
import { hostname, machine, release, type } from "node:os";
import { pid } from "node:process";

// Resources
import { ATTR_SERVICE_NAME } from "npm:@opentelemetry/semantic-conventions";
import { resourceFromAttributes } from "npm:@opentelemetry/resources";

// Shared
import {
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  SpanStatusCode,
} from "npm:@opentelemetry/api";
import { metrics, trace } from "npm:@opentelemetry/api";

// Metrics;
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from "npm:@opentelemetry/sdk-metrics";
import { OTLPMetricExporter } from "npm:@opentelemetry/exporter-metrics-otlp-http";

// Traces
import {
  BatchSpanProcessor,
  NodeTracerProvider,
} from "npm:@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "npm:@opentelemetry/exporter-trace-otlp-http";

// Logs
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "npm:@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "npm:@opentelemetry/exporter-logs-otlp-http";

import Logger from "../src/mod.ts";

// Util Function
export function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Debugging
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const INSTANCE_ID = randomUUID();
console.debug("INSTANCE_ID", INSTANCE_ID);
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: "deno-minilog-test",
  ["service.namespace"]: "minilog-lib",
  ["service.instance.id"]: INSTANCE_ID, // In a context of Containers, you should use the unique id from the machine (probably the hostname, otherwise you need a way to map the physical and virtual machines)
  ["machine.location"]: "Montreal, Québec, Canada",
  ["machine.datacenter"]: "It works on my local machine",
  ["deployment.environment"]: "production",
  ["host.id"]: "i-123456789", // Your machine id (the physical one)
  ["cloud.provider"]: "local",
  ["cloud.region"]: "remote",
  ["host.name"]: hostname(),
  ["os.type"]: type(),
  ["os.version"]: release(),
  ["host.type"]: machine(),
  ["process.pid"]: pid,
});

// Send metrics to remote port 4318
const metricExporter = new OTLPMetricExporter();
const metricProvider = new MeterProvider({
  resource,
  readers: [
    new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 1_000, // 15_000 might be better for production.
    }),
  ],
});
metrics.setGlobalMeterProvider(metricProvider);

const meter = metrics.getMeter("deno-minilog-test", "1.0.0");
const iterationCounter = meter.createCounter("iteration_counter", {
  "description": "Dummy counter",
});
const blockProcessedCounter = meter.createCounter("block_processed_counter", {
  "description": "Block Processed counter",
});

// Send traces to remote port 4318
const traceExporter = new OTLPTraceExporter();
const traceProvider = new NodeTracerProvider({
  resource,
  spanProcessors: [
    new BatchSpanProcessor(traceExporter),
  ],
});
traceProvider.register();
const tracer = trace.getTracer("deno-minilog-test", "1.0.0");

// Send to remote port 4318
const logExporter = new OTLPLogExporter();
const loggerProvider = new LoggerProvider({ resource });
loggerProvider.addLogRecordProcessor(
  new BatchLogRecordProcessor(logExporter),
);

// Because deno auto instrumentation is still unstable.
async function tracedFetch(url: string, options: RequestInit = {}) {
  return tracer.startActiveSpan("fetch", async (span) => {
    try {
      // Prepare headers
      const headers = new Headers(options.headers || {});

      // Perform the fetch with the injected headers
      const response = await fetch(url, { ...options, headers });

      // Set attributes on the span
      span.setAttribute("http.url", url);
      span.setAttribute("http.method", options.method || "GET");
      span.setAttribute("http.status_code", response.status);
      span.setStatus({ code: SpanStatusCode.OK });

      if (!response.ok) {
        span.setStatus({ code: SpanStatusCode.ERROR });
      }

      return response;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}

//
// Application
//

const logger = new Logger({
  otelSupport: true,
  loggerProvider,
  loggerName: "test-minilog",
}); // Logs everything by default

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
            const response = await tracedFetch("https://webuxlab.com");
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
        const response = await tracedFetch("https://webuxlab.com");
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

//
// Cleanup
//

await loggerProvider.shutdown();
await logExporter.shutdown();
await traceExporter.shutdown();
await traceProvider.shutdown();
await metricExporter.shutdown();
await metricProvider.shutdown();

console.log("Test done.");
