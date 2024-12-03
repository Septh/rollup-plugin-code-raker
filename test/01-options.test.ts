import test, { suite } from 'node:test'
import raker from '../source/index.ts'

suite('options', () => {

    test('throws on invalid type for "preset" option', t => {
        t.assert.throws(() => raker({
            // @ts-expect-error
            preset: true
        }))
    })

    test('throws on arbitrary preset name', t => {
        t.assert.throws(() => raker({
            // @ts-expect-error
            preset: 'oops'
        }))
    })

    test('throws on invalid type for "comments" option', t => {
        t.assert.throws(() => raker({
            // @ts-expect-error
            comments: 1
        }))
    })

    test('throws on invalid type for "comments.licenses" option', t => {
        t.assert.throws(() => raker({
            comments: {
                // @ts-expect-error
                licenses: 1
            }
        }))
    })

    test('throws on invalid type for "comments.docs" option', t => {
        t.assert.throws(() => raker({
            comments: {
                // @ts-expect-error
                docs: 1
            }
        }))
    })

    test('throws on invalid type for "comments.annotations" option', t => {
        t.assert.throws(() => raker({
            comments: {
                // @ts-expect-error
                annotations: 1
            }
        }))
    })

    test('throws on invalid type for "console" option', t => {
        t.assert.throws(() => raker({
            // @ts-expect-error
            console: 1
        }))
    })

    test('throws on invalid type for "console.include" option', t => {
        t.assert.throws(() => raker({
            console: {
                // @ts-expect-error
                include: 1
            }
        }))
    })

    test('throws on invalid type for "console.exclude" option', t => {
        t.assert.throws(() => raker({
            console: {
                // @ts-expect-error
                exclude: 1
            }
        }))
    })

    test('throws on invalid type for "debugger" option', t => {
        t.assert.throws(() => raker({
            // @ts-expect-error
            debugger: 1
        }))
    })
})
