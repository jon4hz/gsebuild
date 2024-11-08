// Copyright Sebastian Wiesner <sebastian@swsnr.de>
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0.If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginPromise from "eslint-plugin-promise";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  // See https://typescript-eslint.io/getting-started/typed-linting
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        // @ts-ignore
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  pluginPromise.configs["flat/recommended"],
  // Just setup the configuration to disable conflicting rules, but don't use the plugin to run prettier in eslint.
  eslintConfigPrettier,
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },
  // Global ignores, see https://eslint.org/docs/latest/use/configure/configuration-files#globally-ignoring-files-with-ignores
  // "ignores" must be the _only_ key in this object!
  {
    ignores: [
      // Ignore eslint config, because these aren't included in the tsconfig which confuses eslint
      "/eslint.config.js",
      "dist/**/*",
      "node_modules/**",
    ],
  },
);
