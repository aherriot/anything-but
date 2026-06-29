import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // Playwright owns the e2e/ specs; keep Jest out of them (it would otherwise
  // match their *.spec.ts files and try to run them as unit tests).
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  // Report coverage across the whole source tree, not just files a test
  // happens to import — otherwise the headline number is misleadingly high.
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/instant.schema.ts",
    "!src/instant.perms.ts",
  ],
};

export default createJestConfig(config);
