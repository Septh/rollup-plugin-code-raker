import MagicString from 'magic-string'
import type { Node as AstNode, BlockStatement, Program, StaticBlock, SwitchCase } from 'estree'
import { spaces, lineTerminators } from './charcode.js'
import type { Config } from './config.ts'

type Block = Program | BlockStatement | StaticBlock
type BlockLike = Block | SwitchCase

export class Raker extends MagicString {

    public isEmptyBlock(node: AstNode): boolean {
        return Raker.blocks.has(node.type as BlockLike['type']) && ((node as Block).body ?? (node as SwitchCase).consequent).length === 0
    }

    private static blocks: Set<BlockLike['type']> = new Set([ 'Program', 'BlockStatement', 'StaticBlock', 'SwitchCase' ])
    public removeStatementNode(node: AstNode, parent: AstNode): void {

        if (Raker.blocks.has(parent.type as BlockLike['type'])) {
            const text = this.original
            let { start, end } = node

            let before = start
            while (before > 0 && spaces.has(text.charCodeAt(before - 1)))
                --before

            let after = end
            while (after < text.length && spaces.has(text.charCodeAt(after)))
                ++after

            if (lineTerminators.has(text.charCodeAt(after))) {
                start = before
                end = after
                if (before === 0 || lineTerminators.has(text.charCodeAt(before - 1)))
                    ++end
            }
            else if (after >= end)
                end = after
            else
                start = before

            this.remove(start, end)
        }
        else this.update(node.start, node.end, ';')
    }

    public removeExpressionNode(node: AstNode, parent: AstNode, grandParent: AstNode): void {
        if (parent.type === 'ExpressionStatement')
            return this.removeStatementNode(parent, grandParent)
        this.update(node.start, node.end, '(void 0)')
    }

    private static commentsRx = /(?<block>[/][*].*?[*][/])|(?<line>[/][/][^\n\r\u2028\u2029]*)/gsd
    private static noRange = [ -1, -1 ]
    public removeComments(from: number, to: number, config: Config): void {

        const text = this.original.slice(from, to)
        const matches = Array.from(text.matchAll(Raker.commentsRx)) as RegExpExecArrayWithGroupsAndIndices<'block' | 'line'>[]

        let result = text
        for (let i = matches.length - 1; i >= 0; i--) {
            const { indices, groups } = matches[i]

            let [ start, end ] = groups.line ? indices.groups.line!
                : groups.block && config.testComment(groups.block) ? indices.groups.block!
                : Raker.noRange
            if (start < 0)
                continue

            let before = start
            while (before > 0 && spaces.has(text.charCodeAt(before - 1)))
                --before

            let after = end
            while (after < result.length && spaces.has(text.charCodeAt(after)))
                ++after

            if (lineTerminators.has(text.charCodeAt(after))) {
                start = before
                end = after
                if (before === 0 || lineTerminators.has(text.charCodeAt(before - 1)))
                    ++end
            }
            else if (after >= end)
                end = after
            else
                start = before

            result = result.slice(0, start) + result.slice(end)
        }

        if (config.blankLines())
            result = result.replaceAll(/[\n\r\u2028\u2029]{2,}/g, '\n')

        if (result !== text)
            this.update(from, to, result)
    }
}
