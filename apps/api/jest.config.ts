import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^(\\.\\.?/.*)\\.js$': '$1',
    '^@hypez/shared-types$': '<rootDir>/../../../packages/shared-types/src/index.ts',
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.spec.ts',
    '!**/index.ts',
    '!**/main.ts',
    '!**/__mocks__/**',
  ],
  coverageDirectory: '../coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/__tests__/',
    '/test/',
    '\\.module\\.ts$',
    '\\.dto\\.ts$',
    '\\.guard\\.ts$',
    '\\.decorator\\.ts$',
    '\\.interface\\.ts$',
    '\\.constants\\.ts$',
    '\\.filter\\.ts$',
    '\\.interceptor\\.ts$',
    '\\.pipe\\.ts$',
  ],
  coverageThreshold: {
    global: {
      statements: 10,
      branches: 10,
      functions: 10,
      lines: 10,
    },
  },
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '../coverage',
        outputName: 'junit.xml',
      },
    ],
  ],
  testEnvironment: 'node',
};

export default config;
