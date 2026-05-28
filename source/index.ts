import { walk } from 'zimmerframe'
import type { Plugin } from 'rollup'
import type { Node as AstNode } from 'estree'
import { Raker } from './raker.js'

export interface Options {
    /**
     * The name of a preset to use or extend upon.
     *
     * Default: undefined.
     */
    preset?: 'library' | 'application'

    /**
     * Set to `true` to remove all comments, `false` to remove none, or an object to only remove select comments.
     *
     * Default depends on the selected preset:
     * - default: remove all comments.
     * - `'library'`: preserve licensing and JsDoc/TsDoc comments, remove everything else.
     * - `'application'`: preserve licensing comments, remove everything else.
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
     * Set to `true` to remove all `console` calls, `false` to remove none, or a callback or an object to only remove select `console` calls.
     *
     * Default depends on the selected preset:
     * - default: preserve nothing.
     * - `'library'`: remove all `console` methods calls.
     * - `'application'`: preserve `info`, `warn`, `error` and `debug` methods calls, remove all others.
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

interface Preset {
    licenses:    (comment: string) => boolean
    docs:        (comment: string) => boolean
    annotations: () => boolean
    console:     (method: string, statement: string) => boolean
    debugger:    () => boolean
}

/**
 * A plugin that 'rakes' your code to remove dead leaves
 * such as `console` calls, `debugger` statements, and useless comments.
 */
export function codeRaker(options: Options = {}): Plugin {

    const consoleMethods = Object.keys(console).filter(name => typeof console[name as keyof Console] === 'function')
    const remove = () => true,
          keep = () => false
    const presets: Record<'all' | 'none' | NonNullable<Options['preset']>, Preset> = {
        // A preset that removes everything. This is the default.
        all: {
            licenses: remove,
            docs: remove,
            annotations: remove,
            console: remove,
            debugger: remove
        },
        // A preset that removes nothing.
        none: {
            licenses: keep,
            docs: keep,
            annotations: keep,
            console: keep,
            debugger: keep
        },
        // The 'library' preset.
        library: {
            licenses: keep,
            docs: keep,
            annotations: keep,
            console: remove,
            debugger: remove
        },
        // The 'application' preset.
        application: {
            licenses: keep,
            docs: remove,
            annotations: remove,
            console: createFilter(consoleMethods, [ 'info', 'warn', 'error', 'debug' ]),
            debugger: remove
        }
    }

    const licenseStartRx  = /^\/\*\![ \r\n\u2028\u2029]/    // /*!<space or line terminator>
    const docStartRx      = /^\/\*\*[ \r\n\u2028\u2029]/    // /**<space or line terminator>
    const docLicenseTagRx = /\s@license\b/
    const annotationRx    = /[@#]__(?:PURE|NO_SIDE_EFFECTS)__/

    const config = getConfig()

    return {
        name: 'code-raker',

        transform(code) {
            const raker = new Raker(code)
            const removeDebuggerStatements = config.debugger()
            walk(this.parse(code) as AstNode, {}, {
                DebuggerStatement(node, context) {
                    if (removeDebuggerStatements)
                        raker.rakeNode(node, context.path.at(-1)!)
                },

                CallExpression(node, context) {
                    const { callee } = node
                    if (
                        callee.type === 'MemberExpression'
                        && callee.object.type === 'Identifier'
                        && callee.object.name === 'console'
                        && callee.property.type === 'Identifier'
                        && config.console(callee.property.name, code.slice(node.start, node.end))
                    ) {
                        raker.rakeNode(node, context.path.at(-1)!)
                    }
                },
            })

            return raker.hasChanged()
                ? { code: raker.toString(), map: raker.generateMap() }
                : null
        },

        renderChunk(code) {
            const raker = new Raker(code)
            let prev = { start: NaN, end: NaN } as AstNode
            walk(this.parse(code) as AstNode, {}, {
                _(node, context) {
                    if (node.start >= prev.start && node.end <= prev.end) {
                        // `node` is the first child of `prev`
                        if ((node.start - prev.start) > 1) {
                            // And there is text before it.
                            raker.rakeTextBetweenNodes(prev.start, node.start, shouldRemove)
                        }
                    }
                    else if ((node.start - prev.end) > 1) {
                        // `node` immediately follows `prev` and there is text between them.
                        raker.rakeTextBetweenNodes(prev.end, node.start, shouldRemove)
                    }
                    prev = node
                    context.next()
                }
            })

            return raker.hasChanged()
                ? { code: raker.toString(), map: raker.generateMap() }
                : null

            function shouldRemove(comment: string): boolean {
                return licenseStartRx.test(comment) ? config.licenses(comment)
                    : docStartRx.test(comment) ?
                        docLicenseTagRx.test(comment) ? config.licenses(comment) : config.docs(comment)
                    : annotationRx.test(comment) ? config.annotations()
                    : true // Meaningless comments are always removed
            }
        }
    }

    function getConfig(): Preset {
        const preset = options.preset === undefined ? presets.all
            : (options.preset === 'application' || options.preset === 'library') ? presets[options.preset]
            : fail('preset')

        return {
            ...getCommentsConfig(),
            ...getConsoleConfig(),
            ...getDebuggerConfig(),
        }

        function getCommentsConfig(): Pick<Preset, 'licenses' | 'docs' | 'annotations'> {
            const { comments: option } = options
            if (option === undefined) {
                const { licenses, docs, annotations } = preset
                return { licenses, docs, annotations }
            }
            if (isBoolean(option)) {
                const { licenses, docs, annotations } = option ? presets.all : presets.none
                return { licenses, docs, annotations }
            }
            if (isObject(option)) {
                const { licenses, docs, annotations } = option
                return {
                    licenses: (
                        licenses === undefined ? preset.licenses
                            : isBoolean(licenses) ? (licenses ? presets.all.licenses : presets.none.licenses)
                            : isFunction(licenses) ? licenses
                            : fail('comments.licenses')
                    ),
                    docs: (
                        docs === undefined ? preset.docs
                            : isBoolean(docs) ? (docs ? presets.all.docs : presets.none.docs)
                            : isFunction(docs) ? docs
                            : fail('comments.docs')
                    ),
                    annotations: (
                        annotations === undefined ? preset.annotations
                            : isBoolean(annotations) ? (annotations ? presets.all.annotations : presets.none.annotations)
                            : fail('comments.annotations')
                    )
                }
            }
            fail('comments')
        }

        function getConsoleConfig(): Pick<Preset, 'console'> {
            const { console: option } = options
            if (option === undefined)
                return { console: preset.console }
            if (isBoolean(option))
                return { console: option ? presets.all.console : presets.none.console }
            if (isFunction(option))
                return { console: option }
            if (isObject(option)) {
                const { include = consoleMethods, exclude = [] } = option
                if (!Array.isArray(include))
                    fail('console.include')
                if (!Array.isArray(exclude))
                    fail('console.exclude')
                return { console: createFilter(include, exclude) }
            }
            fail('console')
        }

        function getDebuggerConfig(): Pick<Preset, 'debugger'> {
            const { debugger: option } = options
            if (option === undefined)
                return { debugger: preset.debugger }
            if (isBoolean(option))
                return { debugger: option ? presets.all.debugger : presets.none.debugger }
            fail('debugger')
        }

        function isBoolean(value: unknown): value is boolean {
            return typeof value === 'boolean'
        }

        function isObject(value: unknown): value is object {
            return value !== null && typeof value === 'object'
        }

        function isFunction(value: unknown): value is Function {
            return typeof value === 'function'
        }

        function fail(optionName: string): never {
            throw new TypeError(`Invalid value for "${optionName}" option.`)
        }
    }

    function createFilter(include: string[], exclude: string[]) {
        const isIncluded = (name: string) => include.length > 0 && include.includes(name)
        const isExcluded = (name: string) => exclude.length > 0 && exclude.includes(name)
        return function filter(name: string) {
            return isIncluded(name) && !isExcluded(name)
        }
    }
}

export default codeRaker
