import { suite, test, type TestContext } from 'node:test'
import { presets, regexes, stats } from './helpers/sources.ts'
import { bundle } from './helpers/bundle.js'

suite('by default', async () => {
    const code = await bundle(presets)

    test('removes line comments', (t: TestContext) => {
        t.assert.equal(regexes.lineComments.test(code), false)
    })

    test('removes block comments', (t: TestContext) => {
        t.assert.equal(regexes.blockComments.test(code), false)
    })

    test('removes licenses', (t: TestContext) => {
        t.assert.strictEqual(regexes.licenses.test(code), false)
    })

    test('removes documentation comments', (t: TestContext) => {
        t.assert.strictEqual(regexes.docs.test(code), false)
    })

    test('removes annotations', (t: TestContext) => {
        t.assert.strictEqual(regexes.annotations.test(code), false)
    })

    test('removes "debugger" statements', (t: TestContext) => {
        t.assert.strictEqual(regexes.debuggerStatements.test(code), false)
    })

    test('removes "console.*" calls', (t: TestContext) => {
        t.assert.strictEqual(regexes.consoleCalls.test(code), false)
    })
})

suite('with "comments: false"', async () => {
    const code = await bundle(presets, { comments: false })

    test('still removes line comments', (t: TestContext) => {
        t.assert.strictEqual(regexes.lineComments.test(code), false)
    })

    test('still removes block comments', (t: TestContext) => {
        t.assert.strictEqual(regexes.blockComments.test(code), false)
    })

    test('preserves licenses', (t: TestContext) => {
        const matches = Array.from(code.matchAll(regexes.licenses))
        t.assert.strictEqual(matches.length, stats.numLicenses)
    })

    test('preserves documentation', (t: TestContext) => {
        const matches = Array.from(code.matchAll(regexes.docs))
        t.assert.strictEqual(matches.length, stats.numDocs)
    })

    test('preserves annotations', (t: TestContext) => {
        const matches = Array.from(code.matchAll(regexes.annotations))
        t.assert.strictEqual(matches.length, stats.numAnnotations)
    })
})

suite('with "comments.licenses: false"', async () => {
    const code = await bundle(presets, { comments: { licenses: false }})

    test('still removes line comments', (t: TestContext) => {
        t.assert.strictEqual(code.includes('line comment'), false)
    })

    test('still removes block comments', (t: TestContext) => {
        t.assert.strictEqual(code.includes('block comment'), false)
    })

    test('preserves licenses', (t: TestContext) => {
        const matches = Array.from(code.matchAll(regexes.licenses))
        t.assert.strictEqual(matches.length, stats.numLicenses)
    })

    test('still removes documentation comments', (t: TestContext) => {
        t.assert.strictEqual(regexes.docs.test(code), false)
    })

    test('still removes annotations', (t: TestContext) => {
        t.assert.strictEqual(regexes.annotations.test(code), false)
    })
})

suite('with "comments.docs: false"', async () => {
    const code = await bundle(presets, { comments: { docs: false }})

    test('still removes line comments', (t: TestContext) => {
        t.assert.strictEqual(regexes.lineComments.test(code), false)
    })

    test('still removes block comments', (t: TestContext) => {
        t.assert.strictEqual(regexes.blockComments.test(code), false)
    })

    test('still removes licenses', (t: TestContext) => {
        t.assert.strictEqual(regexes.licenses.test(code), false)
    })

    test('preserves documentation', (t: TestContext) => {
        const matches = Array.from(code.matchAll(regexes.docs))
        t.assert.strictEqual(matches.length, stats.numDocs)
    })

    test('still removes annotations', (t: TestContext) => {
        t.assert.strictEqual(regexes.annotations.test(code), false)
    })
})

suite('with "comments.annotations: false"', async () => {
    const code = await bundle(presets, { comments: { annotations: false }})

    test('still removes line comments', (t: TestContext) => {
        t.assert.strictEqual(regexes.lineComments.test(code), false)
    })

    test('still removes block comments', (t: TestContext) => {
        t.assert.strictEqual(regexes.blockComments.test(code), false)
    })

    test('still removes licenses', (t: TestContext) => {
        t.assert.strictEqual(regexes.licenses.test(code), false)
    })

    test('still removes documentation', (t: TestContext) => {
        t.assert.strictEqual(regexes.docs.test(code), false)
    })

    test('preserves annotations', (t: TestContext) => {
        const matches = Array.from(code.matchAll(regexes.annotations))
        t.assert.strictEqual(matches.length, stats.numAnnotations)
    })
})

suite('with "console: false"', async () => {
    const code = await bundle(presets, { console: false })

    test('preserves all "console.*" calls', (t: TestContext) => {
        const matches = Array.from(code.matchAll(regexes.consoleCalls))
        t.assert.strictEqual(matches.length, stats.numConsoleCalls)
    })
})

suite('with "debugger: false"', async () => {
    const code = await bundle(presets, { debugger: false })

    test('preserves all "debugger" statements', (t: TestContext) => {
        const matches = Array.from(code.matchAll(regexes.debuggerStatements))
        t.assert.strictEqual(matches.length, 1)
    })
})

suite('"comments" option with callback overrides', async () => {
    const code = await bundle(presets, {
        comments: {
            licenses: comment => comment.includes('@license'),  // Remove jsDoc-style licenses (there is 1)
            docs: comment => comment.includes('@private')       // Remove doc comments with @private tag (there is 1)
        },
        console: method => method.startsWith('group')           // Remove console.group() and console.groupEnd() (there are 2)
    })

    test('preserves license when callback returns false', (t: TestContext) => {
        const matches = Array.from(code.matchAll(regexes.licenses))
        t.assert.strictEqual(matches.length, stats.numLicenses - 1)
    })

    test('preserves documentation when callback returns false', (t: TestContext) => {
        const matches = Array.from(code.matchAll(regexes.licenses))
        t.assert.strictEqual(matches.length, stats.numDocs - 1)
    })

    test('preserves console.* when callback returns false', (t: TestContext) => {
        const matches = Array.from(code.matchAll(regexes.consoleCalls))
        t.assert.strictEqual(matches.length, stats.numConsoleCalls - 2)
    })
})

suite('"console" option with include/exclude object overrides', async () => {
    test('preserves console.* calls filtered by include', async (t: TestContext) => {
        const methods = [ 'dir', 'group', 'groupEnd' ]          // Remove 4 calls (2 x dir, 1 x group, 1 x groupEnd)
        const code = await bundle(presets, { console: { include: methods }})
        const matches = Array.from(code.matchAll(regexes.consoleCalls))
        t.assert.strictEqual(matches.length, stats.numConsoleCalls - 4)
    })

    test('preserves console.* calls filtered by exclude', async (t: TestContext) => {
        const methods = [ 'info', 'warn', 'error', 'debug' ]    // Keep these 4, remove all others
        const code = await bundle(presets, { console: { exclude: methods }})
        const matches = Array.from(code.matchAll(regexes.consoleCalls))
        t.assert.strictEqual(matches.length, methods.length)
    })
})
