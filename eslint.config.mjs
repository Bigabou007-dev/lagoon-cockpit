import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["packages/api/**/*.js", "packages/cli/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        clearTimeout: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        fetch: "readonly",
        AbortSignal: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
    },
  },
  {
    files: ["packages/api/__tests__/**/*.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly",
        afterEach: "readonly",
        jest: "readonly",
      },
    },
  },
  {
    ignores: [
      "node_modules/",
      "packages/app/",
      "packages/windows-agent/",
      "dist/",
      "data/",
      "*.db",
      "coverage/",
    ],
  },
];
