import { suite, test, type TestContext } from 'node:test'
import { source, regexes, stats } from './helpers/source.ts'
import { rollup } from './helpers/rollup.ts'

suite('"library" preset', async () => {
    const code = await rollup(source, { preset: 'library' })

    test('preserves licenses', (t: TestContext) => {
        t.assert.strictEqual(Array.from(code.matchAll(regexes.licenses)).length, stats.numLicenses)
    })

    test('preserves documentation comments', (t: TestContext) => {
        t.assert.strictEqual(Array.from(code.matchAll(regexes.docs)).length, stats.numDocs)
    })

    test('preserves annotations', (t: TestContext) => {
        t.assert.strictEqual(Array.from(code.matchAll(regexes.annotations)).length, stats.numAnnotations)
    })

    test('removes "debugger" statements', (t: TestContext) => {
        t.assert.strictEqual(regexes.debuggerStatements.test(code), false)
    })

    test('preserves "console.[log|info|warn|error]" calls and removes all others', (t: TestContext) => {
        const methods = [ 'log', 'info', 'warn', 'error' ]
        const matches = Array.from(code.matchAll(regexes.consoleCalls)).map(m => m[1])
        t.assert.strictEqual(matches.length, methods.length)
        t.assert.deepEqual(matches, methods)
    })
})
