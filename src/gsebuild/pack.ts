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

import { execa } from "execa";
import { glob } from "glob";
import { Ora, oraPromise } from "ora";

import { ExpandedConfiguration, PatternToCopy } from "./config.js";
import { MetadataJson } from "./metadata.js";

type SourceAndDest = readonly [string, string];

const getFilesToCopy = (
  copyToSource: readonly Readonly<PatternToCopy>[],
): Promise<readonly SourceAndDest[]> =>
  Promise.all(
    copyToSource.map(
      (pattern): Promise<string[] | readonly (readonly [string, string])[]> => {
        if (typeof pattern === "string") {
          return glob(pattern);
        } else {
          return Promise.resolve([pattern]);
        }
      },
    ),
  ).then((files) =>
    files.flatMap((sources) =>
      sources.map((source) =>
        typeof source === "string" ? [source, source] : source,
      ),
    ),
  );

const copy =
  (sourceDirectory: string, copyToSource: readonly Readonly<PatternToCopy>[]) =>
  async (spinner: Ora) => {
    const filesToCopy = await getFilesToCopy(copyToSource);
    if (filesToCopy.length === 0) {
      throw new Error("Did not find any files to copy to source directory");
    }
    for (const [source, dest] of filesToCopy) {
      const target = path.join(sourceDirectory, dest);
      spinner.text = `${source} -> ${target}`;
      await fs.cp(source, target, {
        recursive: true,
      });
    }
    spinner.text = `Copied ${filesToCopy.length.toFixed(0)} files to ${sourceDirectory}`;
  };

const exists = async (directory: string): Promise<boolean> =>
  fs.access(directory).then(
    () => true,
    () => false,
  );

const pack = async (metadata: MetadataJson, config: ExpandedConfiguration) => {
  const targetDirectory = "dist";

  if (0 < config.pack["copy-to-source"].length) {
    await oraPromise(
      copy(config.pack["source-directory"], config.pack["copy-to-source"]),
    );
  }

  const args = [
    "pack",
    "--force",
    "--out-dir",
    targetDirectory,
    config.pack["source-directory"],
    `--extra-source=${config.extension["metadata-file"]}`,
  ].concat(
    await Promise.all(
      config.pack["extra-sources"].map((source) =>
        glob(source, { cwd: config.pack["source-directory"] }),
      ),
    ).then((sources) =>
      sources.flat().map((source) => `--extra-source=${source}`),
    ),
    await Promise.all(
      config.pack.schemas.map((schema) =>
        glob(schema, { cwd: config.pack["source-directory"] }),
      ),
    ).then((schemas) => schemas.flat().map((schema) => `--schema=${schema}`)),
  );
  if (await exists(config.extension["po-directory"])) {
    args.push(`--podir=${config.extension["po-directory"]}`);
  }

  // Explicitly create the target directory upfront,
  // otherwise gnome-extensions pack segfaults, see
  // https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/2512
  await fs.mkdir(targetDirectory, { recursive: true });
  await oraPromise(execa("gnome-extensions", args), {
    failText: `Failed to run gnome-extensions ${args.join(" ")}`,
    text: "Running gnome-extension pack",
    successText: `Extension packed at dist/${metadata.uuid}.shell-extension.zip`,
  });
};

export default pack;
