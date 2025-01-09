![NPM Version](https://img.shields.io/npm/v/rollup-plugin-code-raker?label=latest)
![Rollup 4.0](https://img.shields.io/badge/Rollup-%3E%3D4.0.0-orange)
![Vite 5.0](https://img.shields.io/badge/Vite-%3E%3D5.0.0-purple)
![MIT License](https://img.shields.io/npm/l/rollup-plugin-code-raker)

# rollup-plugin-code-raker
> A Rollup/Vite plugin that rakes your bundle to remove dead leaves.

## Features
- Removes leftover comments, `console.*` calls and `debugger` statements from your bundle.
- Does not come in the way of treeshaking: remaining function annotations are removed *after* Rollup/Vite did their magic.
- Fully configurable.
- Comes with sensible defaults for both application and library bundling.

## Requirements
This plugin requires Rollup 4 or later or Vite 5 or later.

## Usage
Install the plugin using your favorite package manager:

```sh
npm install --save-dev rollup-plugin-code-raker
```

Then import the plugin in your `rollup.config.js`/`vite.config.js`:

```js
import rake from 'rollup-plugin-code-raker'

export default {
    ...
    plugins: [
        rake(/* options */)
    ]
}
```

## Options
code-raker uses *presets* to decide what to remove from code.
- The default preset is a "kill'em all" preset that blindly **removes** all comments (including licensing and documentation comments), all `console.*` calls and `debugger` statements.
- The `application` preset **preserves** licensing comments and `console.info`, `console.warn`, `console.error` and `console.debug` calls.
- The `library` preset **preserves** licensing and documentation comments.

> [!NOTE]
> - *Licensing* comments are block comments that start with `/*!` followed by a space or a newline, or documentation comments that contain the `@license` tag.
> - *Documentation*, or JsDoc/TsDoc comments, are block comments that start with `/**` followed by a space or a newline.
> - *Annotations* are block comments that contain one of these strings: `#__PURE__`, `@__PURE__`, `#__NO_SIDE_EFFECTS__`, `@__NO_SIDE_EFFECTS__`. See https://rollupjs.org/configuration-options/#treeshake-annotations for more info.

All options are optional.

```typescript
export interface Options {
    /**
     * The name of a preset to use or extend upon.
     *
     * Default: undefined.
     */
    preset?: 'library' | 'application'

    /**
     * Set to `true` to remove all comments, `false` to remove none, or an object
     * to only remove select comments.
     *
     * Default depends on the selected preset:
     * - default: remove all comments.
     * - library: preserve licensing and JsDoc/TsDoc comments, remove everything else.
     * - application: preserve licensing comments, remove everything else.
     *
     * Note that this setting only targets "meaningful" comments; common block comments (`/*`)
     * and line comments (`//`) are always removed.
     */
    comments?: boolean | {
        /**
         * Whether to remove licensing comments.
         */
        licenses?: boolean | ((comment: string) => boolean)

        /**
         * Whether to remove documentation comments.
         */
        docs?: boolean | ((comment: string) => boolean)

        /**
         * Whether to remove annotations.
         */
        annotations?: boolean
    }

    /**
     * Set to `true` to remove all `console` calls, `false` to remove none, or a callback
     * or an object to only remove select `console` calls.
     *
     * Default depends on the selected preset:
     * - default: remove all `console` methods calls.
     * - library: remove all `console` methods calls.
     * - application: preserve `info`, `warn`, `error` and `debug` methods calls,
     *   remove all others.
     */
    console?:  boolean | ((method: string, statement: string) => boolean) | {
        /**
         * An array of console methods names to remove.
         */
        include?: string[]
        /**
         * An array of console methods names to preserve.
         */
        exclude?: string[]
    }

    /**
     * Set to `true` to remove `debugger` statements, or `false` to leave them in code.
     *
     * Default: `true` in all presets.
     */
    debugger?: boolean
}
```

## License
MIT.
