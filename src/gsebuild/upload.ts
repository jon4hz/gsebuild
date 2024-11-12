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

import path from "node:path";
import fs from "node:fs/promises";

import * as prompts from "@inquirer/prompts";
import { Command, OptionValues } from "@commander-js/extra-typings";

import { ExpandedConfiguration, getConfiguration } from "./config.js";
import { readMetadata } from "./metadata.js";
import * as ego from "./ego-api.js";

export interface UploadOptions extends Record<string, unknown> {
  readonly username?: string;
  readonly interaction?: boolean;
  readonly confirmations?: string;
}

const getDefaultArtifact = async (config: ExpandedConfiguration) => {
  const { uuid } = await readMetadata(config.extension["metadata-file"]);
  return `dist/${uuid}.shell-extension.zip`;
};

type PartialConfirmations = {
  [F in keyof Partial<ego.Confirmations>]:
    | Partial<ego.Confirmations>[F]
    | undefined;
};

const promptForMissingConfirmations = async (
  egoPrompts: ego.ConfirmationPrompts,
  confirmations: PartialConfirmations,
): Promise<ego.Confirmations> => ({
  shell_license_compliant:
    confirmations.shell_license_compliant ??
    (await prompts.confirm({
      message: egoPrompts.shell_license_compliant,
    })),
  tos_compliant:
    confirmations.tos_compliant ??
    (await prompts.confirm({
      message: egoPrompts.tos_compliant,
    })),
});

const checkConfirmations = (
  program: Command<unknown[], OptionValues>,
  confirmations: ego.Confirmations,
) => {
  if (!(confirmations.shell_license_compliant && confirmations.tos_compliant)) {
    program.error(
      "You must accept the license and terms of service for extensions.gnome.org",
      { exitCode: 1 },
    );
  }
};

interface PreconfirmedPrompt {
  readonly confirmed: boolean;
  readonly text: string;
}

type PreconfirmedPrompts = {
  readonly [P in keyof ego.Confirmations]: PreconfirmedPrompt;
};

const checkFieldText = (
  prompts: ego.ConfirmationPrompts,
  preconfirmed: PreconfirmedPrompts,
  field: keyof PreconfirmedPrompts,
): boolean => {
  if (preconfirmed[field].text === prompts[field]) {
    return true;
  } else {
    console.warn(`Ignoring confirmation for ${field}; prompt text changed!`);
    return false;
  }
};

const getPreconfirmed = async (
  egoPrompts: ego.ConfirmationPrompts,
  options: UploadOptions,
): Promise<PartialConfirmations> => {
  if (options.confirmations) {
    const preConfirmed = JSON.parse(
      await fs.readFile(options.confirmations, { encoding: "utf-8" }),
    ) as PreconfirmedPrompts;
    return {
      shell_license_compliant: checkFieldText(
        egoPrompts,
        preConfirmed,
        "shell_license_compliant",
      )
        ? preConfirmed.shell_license_compliant.confirmed
        : undefined,
      tos_compliant: checkFieldText(egoPrompts, preConfirmed, "tos_compliant")
        ? preConfirmed.tos_compliant.confirmed
        : undefined,
    };
  } else {
    return {};
  }
};

const getConfirmations = async (
  options: UploadOptions,
): Promise<ego.Confirmations> => {
  const egoPrompts = await ego.fetchConfirmationPrompts();
  const preconfirmed = await getPreconfirmed(egoPrompts, options);
  if (options.interaction) {
    return await promptForMissingConfirmations(egoPrompts, preconfirmed);
  } else {
    return {
      tos_compliant: preconfirmed.tos_compliant ?? false,
      shell_license_compliant: preconfirmed.shell_license_compliant ?? false,
    };
  }
};

export const upload = async (
  extensionZip: string | undefined,
  options: UploadOptions,
  program: Command<[string | undefined], UploadOptions>,
) => {
  const config = await getConfiguration();

  // Read the artifact first to fail early if it doesn't exist
  const artifactFile = extensionZip ?? (await getDefaultArtifact(config));
  const artifact = await fs.readFile(artifactFile);

  const username =
    options.username ??
    process.env["EGO_USERNAME"] ??
    (options.interaction
      ? await prompts.input({ message: "Your e.g.o username" })
      : program.error(
          "Missing username; pass --username or set $EGO_USERNAME",
          { exitCode: 2 },
        ));

  const password =
    process.env["EGO_PASSWORD"] ??
    (options.interaction
      ? await prompts.password({ message: "Your e.g.o password" })
      : program.error("Missing passwrd; set $EGO_PASSWORD", { exitCode: 2 }));

  const token = await ego.login({ username, password });
  try {
    const confirmations = await getConfirmations(options);
    checkConfirmations(program, confirmations);

    const mayUpload =
      // If we are asked not to ask don't ask ^^
      !options.interaction ||
      (await prompts.confirm({ message: `Upload ${artifactFile}?` }));
    if (!mayUpload) {
      program.error("Upload cancelled", { exitCode: 2 });
    }
    const { version, extension: uuid } = await ego.upload(
      token,
      confirmations,
      path.basename(artifactFile),
      artifact,
    );
    const { id } = await ego.queryExtension(token, uuid);
    const extensionUrl = `https://extensions.gnome.org/extension/${id.toFixed(0)}/`;
    console.log(
      `Successfully uploaded extension ${uuid} version ${version.toFixed(0)} to ${extensionUrl}`,
    );
  } finally {
    await ego.logout(token);
  }
};

export const confirmUpload = async (targetFile: string) => {
  const egoPrompts = await ego.fetchConfirmationPrompts();
  const confirmations = await promptForMissingConfirmations(egoPrompts, {});
  const savedConfirmations: PreconfirmedPrompts = {
    shell_license_compliant: {
      confirmed: confirmations.shell_license_compliant,
      text: egoPrompts.shell_license_compliant,
    },
    tos_compliant: {
      confirmed: confirmations.tos_compliant,
      text: egoPrompts.tos_compliant,
    },
  };
  await fs.writeFile(
    targetFile,
    JSON.stringify(savedConfirmations, undefined, 2),
  );
};
