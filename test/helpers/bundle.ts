import { rollup } from 'rollup'
import virtual_ from '@rollup/plugin-virtual'
import raker, { type Options as RakerOptions } from '../../source/index.ts'

// Workaround for bad Rollup plugins typings.
const virtual = virtual_ as unknown as typeof virtual_.default

export async function bundle(
    input: string,
    options: RakerOptions = {}
): Promise<string> {

    const build = await rollup({
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
