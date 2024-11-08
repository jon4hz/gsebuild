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
import dist from "./dist.js";

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

  /**
   * A configuration to reformat Javascript files for distribution.
   *
   * This configuration reformats generated Javascript files to make them easier
   * to read.  GNOME Shell extensions submitted to extensions.gnome.org are
   * subject to manual review; hence the submitted artifacts must contain
   * readable code.
   *
   * While tsc generally generates readable code, it trims whitespace and blank
   * lines, and this eslint configuration aims to address this by adding some
   * extra whitespace and blank lines again.
   *
   * Use this configuration with eslint --fix to reformat Typescript output
   * before submission to extensions.gnome.org.
   */
  readonly dist: TSESLint.FlatConfig.Config;
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
  dist,
};

export default { configs };
