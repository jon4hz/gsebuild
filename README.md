# gsebuild

![NPM Version](https://img.shields.io/npm/v/%40swsnr%2Fgsebuild)
![CI status](https://img.shields.io/github/actions/workflow/status/swsnr/gsebuild/ci.yaml)
![Apache 2.0 license](https://img.shields.io/github/license/swsnr/gsebuild)

Some kind of a build tool for GNOME extensions.

This tool adds some scaffolding for building GNOME Shell extensions, especially
with Typescript:

- Provide recommended eslint and tsc configurations.

Planned features:

- Pack extensions from a conventional layout.
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


### Packging simple extensions

`gsebuild` comes with a `gsebuild` utility which simplifies packing of extensions, configured through `package.json`.

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
        "../metadata.json"
      ],
      "po-directory": "../po",
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
  - as well as README, licenses, icons, and `metadata.json` (relative to `source-directory`),
  - uses gettext message catalogs from the `../po` directory (relative to `source-directory`), and
  - gsettings schemas in the `../schemas` directory (relative to `source-directory`).

## Reference

### gsebuild configuration

TK
