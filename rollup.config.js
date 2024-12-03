import fs from 'node:fs'
import { defineConfig } from 'rollup'
import nodeExternals from 'rollup-plugin-node-externals'
import { codeRaker } from './out/index.js'

/**
 * Workaround for the wrong typings in all rollup plugins.
 * @template T
 * @param {{ default: { default: T } }} module
 * @returns {T}
 * @see {@link https://github.com/rollup/plugins/issues/1541#issuecomment-1837153165}
 */
const rollupPlugin = ({ default: plugin }) => /** @type {T} */(plugin)
const commonjs = rollupPlugin(await import('@rollup/plugin-commonjs'))
const nodeResolve = rollupPlugin(await import('@rollup/plugin-node-resolve'))

const outDir = './dist'

export default defineConfig({
    input: './out/index.js',
    output: {
        dir: outDir,
        format: 'esm',
        generatedCode: 'es2015',
        sourcemap: true,
        sourcemapExcludeSources: true,
        minifyInternalExports: false,
    },
    plugins: [
        nodeExternals(),
        nodeResolve(),
        commonjs(),
        codeRaker({
            preset: 'application',
            console: true,
        }),
        {
            name: 'dts',
            generateBundle() {
                this.emitFile({
                    type: 'asset',
                    fileName: 'index.d.ts',
                    source: fs.readFileSync('./out/index.d.ts')
                })
            }
        }
    ]
})
