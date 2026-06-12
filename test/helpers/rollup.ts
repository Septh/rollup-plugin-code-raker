import { rollup as _rollup } from 'rollup'
import _virtual from '@rollup/plugin-virtual'
import raker, { type Options as RakerOptions } from '#test'

// Workaround for bad Rollup plugins typings.
const virtual = _virtual as unknown as typeof _virtual.default

export async function rollup(input: string, options: RakerOptions = {}): Promise<string> {

    const build = await _rollup({
        input: 'input',
        plugins: [
            virtual({ input }),
            raker(options)
        ],
        treeshake: false,
        external: /^node:/
    })

    const { output } = await build.generate({ format: 'esm' })
    const code = output
        .map(chunk => chunk.type === 'chunk' && chunk.code)
        .filter(Boolean)
        .join('\n')
    await build.close()
    return code
}
