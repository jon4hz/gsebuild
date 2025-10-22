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

import { Command } from "@commander-js/extra-typings";

import pack from "./pack.js";
import xgettext from "./xgettext.js";
import { upload, confirmUpload } from "./upload.js";
import pkg from "../../package.json" with { type: "json" };

const program = (): Command => {
  const program = new Command();

  program
    .name("gsebuild")
    .version(pkg.version)
    .description("Build gnome extensions")
    .addHelpText(
      "after",
      `
Homepage: https://github.com/jon4hz/gsebuild

Licensed under the Apache License, Version 2.0 (the "License");
See http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
    );

  program
    .command("pack")
    .summary("Pack a GNOME shell extension")
    .description(
      `Pack a GNOME shell extension into a ZIP artifact.

Include files according to the 'gsebuild' configuration in 'package.json, and
generate an ZIP file for this extension in 'dist/$UUID.shell-extension.zip',
where $UUID is the uuid of the extension according to 'metadata.json'.`,
    )
    .action(pack);

  program
    .command("xgettext")
    .description("Extract translatable strings for the extension")
    .action(xgettext);

  program
    .command("upload")
    .summary("Upload an extension ZIP artifact to extensions.gnome.org")
    .description(
      `Upload an extension ZIP artifact to extensions.gnome.org.

If no extension is specified upload 'dist/$UUID.shell-extension.zip' as created
by the 'pack' subcommand.

Uploading to extensions.gnome.org requires authentication with username and
password.  By default, this command prompts for both.  If '$EGO_USERNAME' and
'$EGO_PASSWORD' are set, use these for authentication.

Uploading to extensions.gnome.org also requires confirmation of terms of service
and license agreements.  By default, this command asks the same prompts as the
upload form on extensions.gnome.org.  However, fully automated uploads the
confirmation can also be given ahead of time and stored in a dedicated file, see
the 'confirm-upload' subcommand.

You can enforce a fully non-interactive upload with --no-interaction, but in
this case you must pass a file stating confirmation with --confirmations,
generated with 'confirm-upload'.`,
    )
    .option(
      "--no-interaction",
      "Do not ask any questions, but instead fail on missing information.",
    )
    .option(
      "-c, --confirmations <FILENAME>",
      "Load license and terms of service confirmation from FILENAME.",
    )
    .option("-u, --username <USERNAME>", "Your extensions.gnome.org user name.")
    .argument("[extension]", "The extension artifact to upload.")
    .action(upload);

  program
    .command("confirm-upload")
    .summary("Confirm upload terms of extension.gnome.org")
    .description(
      `Confirm upload terms of extensions.gnome.org ahead of time.

Uploading to extensions.gnome.org requires confirmation of terms of service and
license agreements. This command prompts for these confirmations and stores
the confirmation in a JSON document. This document can then be passed to
'upload -c' for a fully non-interactive upload, e.g. from CI.`,
    )
    .argument("<targetFile>", "The extension artifact to upload.")
    .action(confirmUpload);
  return program;
};

export default program;
