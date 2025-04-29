import Logger from "../src/mod.ts";

const logger = new Logger({
  withErrorTrace: false,
}); // Logs everything by default

function testError() {
  console.log("Testing error output");

  try {
    throw new Error("Should show this line in the log");
  } catch (e) {
    logger.error(e);
    logger.trace(e);
    console.error(e);
  }
}

testError();

console.log("*".repeat(60));

const logger2 = new Logger({
  withErrorTrace: true,
}); // Logs everything by default

function testError2() {
  console.log("Testing error output");

  try {
    throw new Error("Should show this line in the log");
  } catch (e) {
    logger2.error(e);
    logger2.trace(e);
    console.error(e);
  }
}

testError2();

console.log("*".repeat(60));

const logger3 = new Logger({
  withErrorTrace: true,
  format: "json",
}); // Logs everything by default

function testError3() {
  console.log("Testing error output");

  try {
    throw new Error("Should show this line in the log");
  } catch (e) {
    logger3.error(e);
    logger3.trace(e);
    console.error(e);
  }
}

testError3();
