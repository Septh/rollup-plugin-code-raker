import MagicString from 'magic-string'
import type { AstNode } from 'rollup'
import { space, lineTerminators } from './charcode.js'

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

    public rakeBetweenNodes(start: number, end: number, shouldRemoveComment: (comment: string) => boolean): void {
        const re = /(?<line>[/][/][^\n]*)|(?<block>[/][*].*?[*][/])/gsd

        const text = this.original.slice(start, end)
        let raked = text

        const matches = Array.from(text.matchAll(re)) as RegExpExecArrayWithGroupsAndIndices<'line' | 'block'>[]
        if (matches.length > 0) {
            for (let i = matches.length - 1; i >= 0; i--) {
                const { indices, groups } = matches[i]
                if (groups.line) {
                    let [ from, to ] = indices.groups.line!

                    // Back to the first non-space character before the comment.
                    while (from > 0 && space.has(text.charCodeAt(from - 1)))
                        --from

                    raked = raked.slice(0, from) + raked.slice(to)
                }
                else if (groups.block) {
                    let [ from, to ] = indices.groups.block!
                    if (shouldRemoveComment(groups.block)) {

                        // Back to the first non-space character before the comment.
                        let before = from
                        while (before > 0 && space.has(text.charCodeAt(before - 1)))
                            --before

                        // Forward to the first non-space character after the comment.
                        let after = to
                        while (after < text.length && space.has(text.charCodeAt(after)))
                            ++after

                        // If the comment ends a line and there is no code before it, remove the whole line.
                        if (lineTerminators.has(text.charCodeAt(after))) {
                            from = before
                            to = ++after
                        }
                        else if (before === 0 || !lineTerminators.has(text.charCodeAt(before - 1)))
                            from = before
                        else
                            to = after

                        raked = raked.slice(0, from) + raked.slice(to)
                    }
                }
            }
        }

        raked = raked.replaceAll(/\n+/g, '\n')
        if (raked === '\n')
            raked = ''
        if (raked !== text)
            this.update(start, end, raked)
    }
}
