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

/**
 * A pattern to copy.
 *
 * Either a single glob pattern, or a pair of source and destination path.
 */
export type PatternToCopy = string | [string, string];

export interface PackConfiguration {
  /**
   * The source directory for packing.
   *
   * The packing tool looks up source files relative to this directory.
   * It will automatically include the following files if they are found in the
   * source directory:
   *
   * - `metadata.json`
   * - `extension.js`
   * - `prefs.js`.
   *
   * Defaults to the current directory.
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
   * The directory for gettext translation catalogs.
   *
   * A single directory relative to `source-directory`.
   *
   * If set the packging tool finds all gettext catalogs (`*.po`), compiles the
   * into binary message catalogs using the text domain set in `metadata.json`,
   * and includes these in the ZIP artifact so that they are available for the
   * extension gettext API.
   *
   * See <https://gjs.guide/extensions/development/translations.html> for more
   * information.
   */
  readonly "po-directory"?: string;

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
   * A list of glob patterns (relative to the current directory) or pairs of
   * source (relative to the current directory) and destination (relative to
   * `source-directory`) path.
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
   */
  readonly "copy-to-source"?: readonly Readonly<PatternToCopy>[];
}

/**
 * Configuration for gsebuild.
 *
 * gsebuild reads configuration from the `gsebuild` key in `package.json`.
 */
export interface Configuration {
  /**
   * Configuration for packing extensions into ZIP artifacts.
   */
  readonly pack?: PackConfiguration;
}
