import { walk } from 'zimmerframe'
import type { Plugin } from 'rollup'
import type { Node as AstNode } from 'estree'
import { Config } from './config.ts'
import { Raker } from './raker.js'

/**
 * A plugin that 'rakes' your code to remove dead leaves
 * such as `console` calls, `debugger` statements, and useless comments.
 */
export interface Options {
    /**
     * The name of a preset to use or extend upon.
     *
     * Default: undefined.
     */
    preset?: 'library' | 'application'

    /**
     * Set to `true` to remove all comments, `false` to remove none,
     * or an object to only remove select comments.
     *
     * Default depends on the selected preset:
     * - default: remove all comments.
     * - 'library': preserve licensing, JsDoc and annotation comments,
     *              remove all others.
     * - 'application': preserve licensing comments,
     *                  remove all others.
     *
     * Note that this setting only targets "meaningful" comments;
     * simple block comments and line comments are always removed.
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
         * Whether to remove bundler annotations.
         */
        annotations?: boolean
    }

    /**
     * Set to `true` to remove all `console` calls, `false` to remove none,
     * or a callback or an object to only remove select `console` calls.
     *
     * Default depends on the selected preset:
     * - default: remove all `console.*` calls.
     * - 'library': preserve `log`, `info`, `warn` and `error` methods calls,
     *              remove all others.
     * - 'application': preserve `log`, `info`, `warn` and `error` methods calls,
     *                  remove all others.
     */
    console?: boolean | ((method: string) => boolean) | {
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
     * Set to `true` to remove `debugger` statements, or `false` to leave them
     * in code.
     *
     * Default: `true` in all presets.
     */
    debugger?: boolean

    /**
     * Set to `true` to remove blank lines, or `false` to leave them in code.
     *
     * Default: `true` in all presets.
     */
    blankLines?: boolean
}

export default function codeRaker(options: Options = {}): Plugin {

    const config = new Config(options)

    return {
        name: 'code-raker',

        transform: {
            order: 'post',
            handler(code) {
                const raker = new Raker(code)
                walk(this.parse(code) as AstNode, null, {
                    DebuggerStatement(node, context) {
                        if (config.debugger())
                            raker.removeStatementNode(node, context.path.at(-1)!)
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
                            raker.removeExpressionNode(node, context.path.at(-1)!, context.path.at(-2)!)
                        }
                    }
                })

                const result = raker.toString()
                return result === code ? null : { code: result, map: raker.generateMap() }
            }
        },

        renderChunk: {
            order: 'post',
            handler(code) {
                const raker = new Raker(code += '\n;')
                let previousNode = { start: NaN, end: NaN } as AstNode
                walk(this.parse(code) as AstNode, null, {
                    _(node, context) {
                        if (node.start >= previousNode.start && node.end <= previousNode.end) {
                            if ((node.start - previousNode.start) > 1)
                                raker.removeComments(previousNode.start, node.start, config)
                        }
                        else if ((node.start - previousNode.end) > 1)
                            raker.removeComments(previousNode.end, node.start, config)

                        if (raker.isEmptyBlock(node))
                            raker.removeComments(node.start, node.end, config)

                        previousNode = node
                        context.next()
                    }
                })

                if (config.blankLines())
                    raker.trimLines()

                let result = raker.toString()
                if (result === code)
                    return

                result = result.slice(0, -2)
                return { code: result, map: raker.generateMap() }
            }
        }
    }
}

export { codeRaker }
