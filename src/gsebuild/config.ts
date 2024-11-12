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

import fs from "node:fs/promises";
import path from "node:path";

/**
 * A pattern to copy.
 *
 * Either a single glob pattern, or a pair of source and destination path.
 */
export type PatternToCopy = string | [string, string];

/**
 * Configuration for packging an extension to a ZIP artifact.
 */
export interface PackConfiguration {
  /**
   * The source directory for packing.
   *
   * The packing tool looks up source files relative to this directory.
   * It will automatically include the following files if they are found in the
   * source directory:
   *
   * - `extension.js`
   * - `prefs.js`.
   *
   * Defaults to the directory containing `package.json`.
   */
  readonly "source-directory"?: string;

  /**
   * Extra source files to include in the packed archive.
   *
   * A list of glob patterns relative to `source-directory` which to include in
   * the ZIP archive.  Each matched file gets added at the top-level of the ZIP
   * artifact, i.e. the directory layout is not preserved.
   *
   * If empty or unset no additional files are included in the ZIP artifact
   * beyond automatically included files from the `source-directory`, and files
   * referenced by `po-directory` or `schemas`.
   */
  readonly "extra-sources"?: readonly string[];

  /**
   * GSettings XML schemas to include.
   *
   * A list of glob patterns relative to `source-directory` which reference
   * GSettings XML schemas to include.
   *
   * The packing tool includes all matching schemas in the appropriate place in
   * the ZIP files, and compiles them in a binary catalog to make them available
   * for the `getSettings` method in extensions and extension preferences.
   *
   * See <https://gjs.guide/extensions/development/preferences.html#gsettings>
   * for more information.
   */
  readonly schemas?: readonly string[];

  /**
   * Files to copy to `source-directory` before packing the extension.
   *
   * A list of glob patterns (relative to the `package.json` directory) or pairs
   * of source (relative to the `package.json` directory) and destination
   * (relative to `source-directory`) path.
   *
   * For a glob pattern copy all matching files to the same place in the source
   * directory, i.e. preserve the directory hierarchy.
   *
   * For a source and destination pair, copy the source file to the destination
   * path relative to source-directory.  Glob patterns are not supported in this
   * case.
   *
   * Use this if you compile Typescript to a separate output directory, and wish
   * to include additional data files along with the compiled modules which the
   * Typescript compiler would not pick up automatically.
   *
   * Note that copying a file to the `source-directory` does not imply that it
   * is automatically included in the ZIP artifact.  Make sure that the copied
   * file is directly or indirectly covered by `extra-sources`.
   */
  readonly "copy-to-source"?: readonly Readonly<PatternToCopy>[];
}

/**
 * Configuration for gettext and extension translations.
 */
export interface GettextConfiguration {
  /**
   * A list of glob patterns to extract messages from.
   *
   * Supports all languages supported by xgettext, and additionally Blueprint and Typescript.
   */
  readonly sources?: readonly string[];

  /**
   * The copyright holder for the package, to add to the POT header.
   */
  readonly "copyright-holder"?: string | null;
}

/**
 * Overall configuration for this extension.
 */
export interface ExtensionConfiguration {
  /**
   * The path to the `metadata.json` file for this extension.
   *
   * Defaults to `metadata.json` in the directory of `package.json`.
   *
   * gsebuild reads extension metadata such as the UUID from this file, and
   * automatically includes this file when packing the extension.
   */
  readonly "metadata-file"?: string;

  /**
   * The path to the directory containing gettext PO files for translating.
   *
   * A single directory relative to the directory containing `package.json`.
   * Defaults to "po".
   *
   * The packging tool will process all gettext catalogs (`*.po`) in this
   * directory, by compiling them using the text domain set in `metadata.json`,
   * and includes them in the ZIP artifact so that they are available for the
   * extension gettext API.
   *
   * See <https://gjs.guide/extensions/development/translations.html> for more
   * information.
   */
  readonly "po-directory"?: string;
}

/**
 * Configuration for gsebuild.
 *
 * gsebuild reads configuration from the `gsebuild` key in `package.json`.
 */
export interface Configuration {
  /**
   * Overall configuration for this extension.
   */
  readonly extension?: ExtensionConfiguration;

  /**
   * Configuration for packing this extension into a ZIP artifact.
   *
   * If unset pack according to the default configuration which only supports
   * basic single-file extensions without settings or translations.
   */
  readonly pack?: PackConfiguration;

  /**
   * Configuration for gettext message extraction and processing.
   */
  readonly gettext?: GettextConfiguration;
}

/**
 * An expanded configuration without defaults.
 */
export type ExpandedConfiguration = Required<{
  readonly [P in keyof Configuration]: Required<Configuration[P]>;
}>;

interface PackageJson {
  readonly gsebuild?: Configuration;
}

/**
 * Get the expanded configuration.
 *
 * Load configuration from `package.json` and expand missing values to their
 * defaults.
 *
 * @returns The configuration from `package.json`
 */
export const getConfiguration = async (): Promise<ExpandedConfiguration> => {
  const packageDirectory = path.resolve();
  const config = (
    JSON.parse(
      await fs.readFile(path.join(packageDirectory, "package.json"), {
        encoding: "utf-8",
      }),
    ) as PackageJson
  ).gsebuild;
  return {
    extension: {
      "metadata-file":
        config?.extension?.["metadata-file"] ??
        path.join(packageDirectory, "metadata.json"),
      "po-directory":
        config?.extension?.["po-directory"] ??
        path.join(packageDirectory, "po"),
    },
    pack: {
      "copy-to-source": config?.pack?.["copy-to-source"] ?? [],
      "extra-sources": config?.pack?.["extra-sources"] ?? [],
      schemas: config?.pack?.schemas ?? [],
      "source-directory":
        config?.pack?.["source-directory"] ?? packageDirectory,
    },
    gettext: {
      sources: config?.gettext?.sources ?? [],
      "copyright-holder": config?.gettext?.["copyright-holder"] ?? null,
    },
  };
};
