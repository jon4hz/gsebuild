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
import pkg from "../../package.json" with { type: "json" };

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
      await pack();
    });

  program
    .command("xgettext")
    .description("Extract translatable strings for the extension")
    .action(async () => {
      await xgettext();
    });
  return program;
};

export default program;
