import MagicString from 'magic-string'
import type { Node as AstNode } from 'estree'
import { spaces, lineTerminators } from './charcode.js'

export class Raker extends MagicString {

    public rakeNode(node: AstNode, parent: AstNode): Raker {
        let { start, end } = node
        switch (parent.type) {
            case 'Program':
            case 'BlockStatement':
            case 'ExpressionStatement':
            case 'StaticBlock':
                this.remove(start, end)
                break

            case 'ArrowFunctionExpression':
                this.update(start, end, '{}')
                break

            default:
                this.update(start, end, '(void 0)')
                break
        }
        return this
    }

    private static commentsRx = /(?<line>[/][/][^\n\r\u2028\u2029]*)|(?<block>[/][*].*?[*][/])/gsd
    public rakeTextBetweenNodes(start: number, end: number, shouldRemoveComment: (comment: string) => boolean): void {

        // Find all comments between `start` and `end` in the original text.
        const text = this.original.slice(start, end)
        const matches = Array.from(text.matchAll(Raker.commentsRx)) as RegExpExecArrayWithGroupsAndIndices<'line' | 'block'>[]

        // Proceed from "bottom" to "top" of text so that we can cut into the result
        // without re-offsetting all comments "below" the current one.
        let result = text
        for (let i = matches.length - 1; i >= 0; i--) {
            const { indices, groups } = matches[i]
            if (groups.line) {
                let [ from, to ] = indices.groups.line!

                // Back to the first non-space character before the comment.
                while (from > 0 && spaces.has(result.charCodeAt(from - 1)))
                    --from

                // const toRemove = text.slice(from, to)
                // result = result.replace(toRemove, '')
                result = result.slice(0, from) + result.slice(to)
            }
            else if (groups.block && shouldRemoveComment(groups.block)) {
                let [ from, to ] = indices.groups.block!

                // Back to the first non-space character before the comment.
                let before = from
                while (before > 0 && spaces.has(result.charCodeAt(before - 1)))
                    --before

                // Forward to the first non-space character after the comment.
                let after = to
                while (after < result.length && spaces.has(result.charCodeAt(after)))
                    ++after

                if (lineTerminators.has(result.charCodeAt(after))) {
                    from = before
                    to = after
                }
                else if (after > to)
                    to = after
                else
                    from = before

                // const toRemove = text.slice(from, to)
                // result = result.replace(toRemove, '')
                result = result.slice(0, from) + result.slice(to)
            }
        }

        // Remove empty lines.
        result = result.replaceAll(/[\n\r\u2028\u2029]{2,}/g, '\n')
        if (result.length === 1 && lineTerminators.has(result.charCodeAt(0)))
            this.remove(start, end)
        else if (result !== text)
            this.update(start, end, result)
    }
}
