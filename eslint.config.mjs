import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // House style: no em/en dashes in visible text (scripts/check-dashes.mjs
  // enforces the same rule at build time, including public/).
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        ...[
          "Literal[value=/[\\u2013\\u2014]/]",
          "TemplateElement[value.raw=/[\\u2013\\u2014]/]",
          "JSXText[value=/[\\u2013\\u2014]/]",
        ].map((selector) => ({
          selector,
          message:
            'No em/en dashes in visible text. Use a comma, colon, full stop or brackets ("to" for ranges).',
        })),
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
