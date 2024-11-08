# gsebuild

Some kind of a build tool for GNOME extensions.

This tool adds some scaffolding for building GNOME Shell extensions, especially with Typescript:

- Provide recommended eslint and tsc configurations.

Planned features:

- Pack extensions from a conventional layout.
- Compile blueprint files to builder XML.
- Extract messages from sources and UI/BLP files with xgettext.
- Submit to extensions.gnome.org

## Installation

```console
$ npm install --save-dev @swsnr/gsebuild
```

## Setup

### Typescript

```console
$ npm install --save-dev typescript eslint
```

Then create a `tsconfig.json`:

```json
{
  "extends": "@swsnr/gsebuild/tsconfig.json",
  "compilerOptions": {
    "outDir": "build"
  },
  // ...
}
```

And a eslint configuration file `eslint.config.dist.js` to reformat typescript for submission to extensions.gnome.org:

```javascript
import { dist } from "@swsnr/gsebuild/eslint";

export default [
  dist,
  {
    files: ["build/**/*"],
  },
];
```

Then add `package.json` scripts to build Typescript:

```json
{
    "scripts": {
        "compile": "tsc --build tsconfig.json",
        "postcompile": "eslint --no-config-lookup --config eslint.config.dist.js --quiet --fix ."
    }
}
```

## License

Copyright Sebastian Wiesner <sebastian@swsnr.de>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
