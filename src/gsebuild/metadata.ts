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

/**
 * Relevant metadata declared in `metadata.json`.
 *
 * This interface is not complete; it only encodes what's required by gsebuild.
 */
export interface MetadataJson {
  readonly uuid: string;
  readonly name: string;
  readonly description: string;
  readonly version?: string;
  readonly url?: string;
  readonly "settings-schema"?: string;
  readonly "gettext-domain"?: string;
  readonly "version-name"?: string;
}

/**
 * Read a metadata file.
 *
 * @param file The metadata file to read
 * @returns The de-serialized metadata.
 */
export const readMetadata = async (file: string): Promise<MetadataJson> => {
  return JSON.parse(
    await fs.readFile(file, { encoding: "utf-8" }),
  ) as MetadataJson;
};
