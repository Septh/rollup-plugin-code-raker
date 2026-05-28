import MagicString from 'magic-string'
import type { Node as AstNode } from 'estree'
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

    public rakeTextBetweenNodes(from: number, to: number, shouldRemoveComment: (comment: string) => boolean): void {
        const re = /(?<line>[/][/][^\n]*)|(?<block>[/][*].*?[*][/])/gsd

        const text = this.original.slice(from, to)
        let raked = text

        const matches = Array.from(text.matchAll(re)) as RegExpExecArrayWithGroupsAndIndices<'line' | 'block'>[]
        if (matches.length > 0) {
            for (let i = matches.length - 1; i >= 0; i--) {
                const { indices, groups } = matches[i]
                if (groups.line) {
                    let [ start, end ] = indices.groups.line!

                    // Back to the first non-space character before the comment.
                    while (start > 0 && space.has(text.charCodeAt(start - 1)))
                        --start

                    raked = raked.slice(0, start) + raked.slice(end)
                }
                else if (groups.block && shouldRemoveComment(groups.block)) {
                    let [ start, end ] = indices.groups.block!

                    // Back to the first non-space character before the comment.
                    let before = start
                    while (before > 0 && space.has(text.charCodeAt(before - 1)))
                        --before

                    // Forward to the first non-space character after the comment.
                    let after = end
                    while (after < text.length && space.has(text.charCodeAt(after)))
                        ++after

                    // If the comment ends a line and there is no code before it, remove the whole line.
                    if (lineTerminators.has(text.charCodeAt(after))) {
                        start = before
                        end = ++after
                    }
                    else if (before === 0 || !lineTerminators.has(text.charCodeAt(before - 1)))
                        start = before
                    else
                        end = after

                    raked = raked.slice(0, start) + raked.slice(end)
                }
            }
        }

        raked = raked.replaceAll(/\n+/g, '\n')
        if (raked === '\n')
            raked = ''
        if (raked !== text)
            this.update(from, to, raked)
    }
}
