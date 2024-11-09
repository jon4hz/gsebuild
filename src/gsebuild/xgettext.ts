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

import { glob } from "glob";
import { execa } from "execa";

import { ExpandedConfiguration } from "./config.js";
import { MetadataJson } from "./metadata.js";

const xgettext = async (
  metadata: MetadataJson,
  config: ExpandedConfiguration,
) => {
  if (config.gettext.sources.length === 0) {
    throw new Error("No sources configured for xgettext!");
  }

  const sources = (
    await Promise.all(config.gettext.sources.map((pattern) => glob(pattern)))
  ).flat();

  if (sources.length === 0) {
    throw new Error("No sources found for xgettext");
  }

  const domain = metadata["gettext-domain"] ?? metadata.uuid;
  const pot = path.join(config.extension["po-directory"], `${domain}.pot`);

  const args = [
    "--sort-by-file",
    "--from-code=UTF-8",
    `--package-name=${metadata.uuid}`,
    "--add-comments",
    "--foreign-user",
  ];
  if (config.gettext["copyright-holder"]) {
    args.push(`--copyright-holder=${config.gettext["copyright-holder"]}`);
  }

  const blueprints = [];
  const typescripts = [];
  const otherSources = [];

  for (const source of sources) {
    const ext = path.extname(source);
    if (ext === ".blp") {
      blueprints.push(source);
    } else if (ext === ".ts") {
      typescripts.push(source);
    } else {
      otherSources.push(source);
    }
  }

  // We extract strings from blueprints and typescript sources into separate
  // temporary POT files first, because both formats are unknown to xgettext so
  // we need to pass extra flags and can't just let xgettext work just from the
  // file extension.
  //
  // We then feed the temporary POT files as additional inputs to the main
  // xgettext invocation, and remove the temporary POTs again.

  const blpPot =
    blueprints.length === 0
      ? null
      : path.join(config.extension["po-directory"], `${domain}.blp.pot`);
  if (blpPot !== null) {
    // See https://jwestman.pages.gitlab.gnome.org/blueprint-compiler/translations.html
    const blueprintExtraArgs = [
      "--language=C",
      "--from-code=UTF-8",
      "--keyword=_",
      "--keyword=C_:1c,2",
      `--output=${blpPot}`,
    ];
    await execa("xgettext", args.concat(blueprintExtraArgs, blueprints), {
      stderr: "inherit",
      stdout: "inherit",
    });
    otherSources.push(blpPot);
  }

  const tsPot =
    typescripts.length === 0
      ? null
      : path.join(config.extension["po-directory"], `${domain}.ts.pot`);
  if (tsPot !== null) {
    await execa(
      "xgettext",
      args.concat(
        args,
        ["--language=Javascript", `--output=${tsPot}`],
        typescripts,
      ),
      { stderr: "inherit", stdout: "inherit" },
    );
    otherSources.push(tsPot);
  }

  try {
    await execa("xgettext", args.concat([`--output=${pot}`], otherSources), {
      stderr: "inherit",
      stdout: "inherit",
    });
  } finally {
    for (const toRemove of [blpPot, tsPot]) {
      if (toRemove) {
        try {
          await fs.rm(toRemove, { force: true });
        } catch {
          console.error("Failed to remove", blpPot);
        }
      }
    }
  }
};

export default xgettext;
