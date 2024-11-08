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

import { Configuration, PatternToCopy } from "./config.js";

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

const pack = async (config?: Configuration) => {
  const sourceDirectory = config?.pack?.["source-directory"] ?? ".";
  const targetDirectory = "dist";
  const extraSources = config?.pack?.["extra-sources"] ?? [];
  const poDirectory = config?.pack?.["po-directory"];
  const schemas = config?.pack?.schemas ?? [];
  const copyToSource = config?.pack?.["copy-to-source"] ?? [];

  if (0 < copyToSource.length) {
    await oraPromise(copy(sourceDirectory, copyToSource));
  }

  const args = [
    "pack",
    "--force",
    "--out-dir",
    targetDirectory,
    sourceDirectory,
  ].concat(
    await Promise.all(
      extraSources.map((source) => glob(source, { cwd: sourceDirectory })),
    ).then((sources) =>
      sources.flat().map((source) => `--extra-source=${source}`),
    ),
    await Promise.all(
      schemas.map((schema) => glob(schema, { cwd: sourceDirectory })),
    ).then((schemas) => schemas.flat().map((schema) => `--schema=${schema}`)),
  );
  if (poDirectory) {
    args.push(`--podir=${poDirectory}`);
  }

  // Explicitly create the target directory upfront,
  // otherwise gnome-extensions pack segfaults, see
  // https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/2512
  await fs.mkdir(targetDirectory, { recursive: true });
  await oraPromise(execa("gnome-extensions", args), {
    failText: `Failed to run gnome-extensions ${args.join(" ")}`,
    text: "Running gnome-extension pack",
    successText: "Extension packed",
  });
};

export default pack;
