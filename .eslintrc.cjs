module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  overrides: [
    {
      files: ["**/*.tsx", "**/*.jsx"],
      plugins: ["react", "react-hooks"],
      extends: ["plugin:react/recommended", "plugin:react-hooks/recommended"],
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "react/no-unescaped-entities": "off",
        "react-hooks/exhaustive-deps": "off",
      },
      settings: {
        react: {
          version: "detect",
        },
      },
    },
    {
      files: ["supabase/functions/**/*.ts"],
      env: {
        node: true,
      },
      globals: {
        Deno: "readonly",
        EdgeRuntime: "readonly",
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "no-useless-catch": "off",
        "no-case-declarations": "off",
        "prefer-const": "off",
      },
    },
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
  },
};
