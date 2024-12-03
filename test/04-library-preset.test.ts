import { suite, test, type TestContext } from 'node:test'
import { presets, regexes, stats } from './helpers/sources.ts'
import { bundle } from './helpers/bundle.js'

suite('"library" preset', async () => {
    const code = await bundle(presets, { preset: 'library' })

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

    test('removes "console.*" calls', (t: TestContext) => {
        t.assert.strictEqual(regexes.consoleCalls.test(code), false)
    })
})
