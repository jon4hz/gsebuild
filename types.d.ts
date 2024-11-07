declare module "eslint-plugin-promise" {
  import type { TSESLint } from "@typescript-eslint/utils";

  type PluginPromise = {
    configs: {
      "flat/recommended": TSESLint.FlatConfig.Config;
    };
  };

  declare const pluginPromise: PluginPromise;

  export default pluginPromise;
}
