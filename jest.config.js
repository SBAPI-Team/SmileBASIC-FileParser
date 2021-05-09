module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    "ts-jest": {
      tsconfig: "tests/tsconfig.json"
    }
  },
  coverageReporters: [
    "json-summary", 
    "text",
    "lcov"
  ]
};