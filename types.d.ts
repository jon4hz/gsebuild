declare module "eslint-plugin-promise" {
  import type { TSESLint } from "@typescript-eslint/utils";

  interface PluginPromise {
    readonly configs: {
      "flat/recommended": TSESLint.FlatConfig.Config;
    };
  }

  declare const pluginPromise: PluginPromise;

  export default pluginPromise;
}
