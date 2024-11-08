// Copyright Sebastian Wiesner <sebastian@swsnr.de>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginPromise from "eslint-plugin-promise";
import type { TSESLint } from "@typescript-eslint/utils";

import guide from "./guide.js";

export { default as dist } from "./dist.js";

export interface Configurations {
  /**
   * The bare configuration provided by the GJS Guide.
   *
   * See https://gjs.guide/guides/gjs/style-guide.html#eslint
   */
  readonly guide: TSESLint.FlatConfig.Config;
  /**
   * The recommended configuration for plain Javascript.
   */
  readonly javascript: TSESLint.FlatConfig.ConfigArray;
  /**
   * The recommended configuration for Typescript.
   */
  readonly typescript: TSESLint.FlatConfig.ConfigArray;
}

/**
 * Configurations provided by gsebuild, for plain Javascript as well as for typescript.
 */
export const configs: Configurations = {
  guide,
  javascript: [
    eslint.configs.recommended,
    guide,
    {
      linterOptions: {
        reportUnusedDisableDirectives: "error",
      },
    },
    pluginPromise.configs["flat/recommended"],
  ],
  typescript: [
    eslint.configs.recommended,
    guide,
    {
      linterOptions: {
        reportUnusedDisableDirectives: "error",
      },
      rules: {
        // .eslintrc.gjs-guide.yml enables this, but it has no use in typescript
        // which ensures a consistent return value through its type checks.
        "consistent-return": "off",
      },
    },
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    pluginPromise.configs["flat/recommended"],
  ],
};

export default { configs };
