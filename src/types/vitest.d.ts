declare module "vitest" {
  export const describe: (...args: any[]) => void;
  export const test: (...args: any[]) => void;
  export const expect: (...args: any[]) => any;
}
