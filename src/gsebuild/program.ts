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

import { Command } from "@commander-js/extra-typings";

import pack from "./pack.js";
import { Configuration, ExpandedConfiguration } from "./config.js";
import pkg from "../../package.json" with { type: "json" };

interface PackageJson {
  readonly gsebuild?: Configuration;
}

const getConfiguration = async (): Promise<ExpandedConfiguration> => {
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
  };
};

const program = (): Command => {
  const program = new Command();

  program
    .name("gsebuild")
    .version(pkg.version)
    .description("Build gnome extensions");

  program
    .command("pack")
    .description("Pack a GNOME shell extension")
    .action(async () => {
      await pack(await getConfiguration());
    });

  return program;
};

export default program;
