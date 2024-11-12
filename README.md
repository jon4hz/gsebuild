# gsebuild

![NPM Version](https://img.shields.io/npm/v/%40swsnr%2Fgsebuild)
![CI status](https://img.shields.io/github/actions/workflow/status/swsnr/gsebuild/ci.yaml)
![Apache 2.0 license](https://img.shields.io/github/license/swsnr/gsebuild)

Some kind of a build tool for GNOME extensions.

This tool adds some scaffolding for building GNOME Shell extensions, especially
with Typescript:

- Provide recommended eslint and tsc configurations.
- Provide a `gsebuild` tool with helpful commands for managing extensions:
  - `gsebuild pack` packs an extension ZIP for submission to extensions.gnome.org.

Planned features:

- Extract messages from sources and UI/BLP files with xgettext.
- Submit to extensions.gnome.org

## Installation

```console
$ npm install --save-dev @swsnr/gsebuild
```

## Setup

### Eslint

`gsebuild` ships with a recommended eslint configuration for Javascript (see below for Typescript).
Setup `eslint.config.js` as follows:

```javascript
import gsebuild from "@swsnr/gsebuild/eslint";

export default [
  ...gsebuild.configs.javascript,
  {
    ignores: [
      // Packages
      "node_modules/**",
    ],
  },
];
```

Then lint with `eslint .`.

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

And a eslint configuration file `eslint.config.dist.js` to reformat typescript
for submission to extensions.gnome.org:

```javascript
import eslint from "@swsnr/gsebuild/eslint";

export default [
  eslint.config.dist,
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

For linting with `eslint`, use the recommended typescript configuration from
`gsebuild` in `eslint.confg.js`, and set up [typed linting](https://typescript-eslint.io/getting-started/typed-linting):

```javascript
import gsebuild from "@swsnr/gsebuild/eslint";

export default [
  ...gsebuild.configs.typescript,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: [
      // eslint configs
      "eslint.config.*",
      // Build outputs
      "build/**/*",
      "dist/**/*",
      // Packages
      "node_modules/**",
    ],
  },
];
```

`gsebuild` already includes typescript-eslint.

### Blueprint

This tool does not provide specific support for [blueprint](https://jwestman.pages.gitlab.gnome.org/blueprint-compiler/).

Given that blueprint is still experimental and not widely available yet, it's
recommended to commit the generated UI files to the repository and not make
blueprint a critical part of the build process.  This enables building the
extension even if blueprint is not available.

To build blueprint you can then use a simple npm script with [glob](https://www.npmjs.com/package/glob):

```json
{
  "scripts": {
    "blueprint": "glob -c 'blueprint-compiler batch-compile ui ui' 'ui/*.blp'",
    "postblueprint": "glob -c 'git add' 'ui/*.ui'",
  }
}
```

### Translations

`gsebuild` comes with a `gsebuild` utility which provides a `xgettext` command to extract translatable strings from the
sources, configured through `package.json`.

Configure gettext extraction in `package.json`:

```json
{
  "gsebuild": {
    "extension": {
      "po-directory": "po"
    }
    "gettext": {
      "sources": ["**/*.ts", "ui/*.blp"]
    }
  }
}
```

Then run `gsebuild xgettext` to produce a gettext POT file with extracted strings at `po/$DOMAIN.pot` where `$DOMAIN`
is the gettext domain of your extension, as configured in `metadata.json` (defaults to the extension UUID if unset).

The `po-directory` defaults to `po` in the `package.json` directory.

See <https://gjs.guide/extensions/development/translations.html> for more information about translating extensions.


### Packging simple extensions

`gsebuild` also provides a `pack` command which simplifies packing of extensions, configured through `package.json`.

By default, `gsebuild` includes `extension.js`, `prefs.js`, and `metadata.json` in the current directory.
Additional files and directories can be included via `package.json`:

```json
{
  "scripts" {
    "pack": "gsebuild pack"
  },
  "gsebuild": {
    "pack": {
      "extra-sources": ["LICENSE*", "README.md"]
    }
  }
}
```

With this configuration `npm run pack` includes `extension.js`, `prefs.js`, `metadata.json`, the `README.md`, and all LICENSE files.
It also includes all gettext catalogs in the `po` directory and compiles them, to support extension translations (see above).
The packed extension ZIP for upload to extensions.gnome.org gets written to the `dist/` directory.

Note that `gsebuild pack` uses the `gnome-extensions pack` command under the hood, and thus requires `gnome-shell` to be installed.

### Packaging complex extensions

`gsebuild` also handles more complex extensions (see above for the Typescript setup):

```json
{
  "scripts": {
    "compile": "tsc --build tsconfig.json",
    "postcompile": "eslint --no-config-lookup --config eslint.config.dist.js --quiet --fix .",
    "predist": "npm run compile",
    "dist": "gsebuild",
  },
  "gsebuild": {
    "pack": {
      "copy-to-source": [
        "ui/*.ui",
        ["./src/lib/vendor/saxes/README.md", "lib/vendor/saxes/README.md"],
        ["./src/lib/vendor/xmlchars/README.md", "lib/vendor/xmlchars/README.md"]
      ],
      "source-directory": "build",
      "extra-sources": [
        "ui",
        "lib",
        "../README.md",
        "../LICENSE*",
        "../icons/",
      ],
      "schemas": [
        "../schemas/*.gschema.xml"
      ]
    }
  }
}
```

This setup

- compiles Typescript code to the `build` directory,
- reformats the generated code to make it easier to read for the e.g.o reviewers, and
- packs the extension:
  - It works from the `build` directory,
  - copies all `ui/*.ui` files and some extra READMEs to the build directory first, and then
  - includes the `ui` and `lib` directories in `build`,
  - as well as README, licenses, and icons (relative to `source-directory`),
  - uses gettext message catalogs from the `po` directory beneath `package.json` if it exists, and
  - gsettings schemas in the `../schemas` directory (relative to `source-directory`).

### Uploading extensions

`gsebuild upload` can upload packed extensions directly from the command line.

## Reference

### gsebuild configuration

See API documentation of the `Configuration` interface.
