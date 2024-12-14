export const replacer = (_key: unknown, value: unknown): unknown =>
  typeof value === "bigint" ? value.toString() : value;
