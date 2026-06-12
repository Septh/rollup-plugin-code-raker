import { suite, test, type TestContext } from 'node:test'
import { rollup } from './helpers/rollup.ts'

suite('Whitespace handling when removing comments', () => {

    suite('Line comments', () => {

        test("Standalone at top", async (t: TestContext) => {
            const source = [
                "// Comment",
                "void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\n")
        })

        test("Standalone between two line", async (t: TestContext) => {
            const source = [
                "void 0;",
                "// Comment",
                "void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\nvoid 0;\n")
        })

        test("Standalone at bottom", async (t: TestContext) => {
            const source = [
                "void 0;",
                "// Comment"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\n")
        })

        test("Standalone at top, indented", async (t: TestContext) => {
            const source = [
                "  // Comment",
                "  void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "  void 0;\n")
        })

        test("Standalone between two lines, indented", async (t: TestContext) => {
            const source = [
                "  void 0;",    // Note: Rollup will unindent this line
                "  // Comment",
                "  void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\n  void 0;\n")
        })

        test("Standalone at bottom, indented", async (t: TestContext) => {
            const source = [
                "  void 0;",    // Note: Rollup will unindent this line
                "  // Comment"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\n")
        })

        test("At first line end", async (t: TestContext) => {
            const source = [
                "void 0;  // Comment",
                "void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\nvoid 0;\n")
        })

        test("At line end between two lines", async (t: TestContext) => {
            const source = [
                "void 0;",
                "void 0;  // Comment",
                "void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\nvoid 0;\nvoid 0;\n")
        })

        test("At last line end", async (t: TestContext) => {
            const source = [
                "void 0;",
                "void 0;  // Comment"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\nvoid 0;\n")
        })

        test("At first line end, indented", async (t: TestContext) => {
            const source = [
                "  void 0;  // Comment",    // Note: Rollup will unindent this line
                "  void 0;",
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\n  void 0;\n")
        })

        test("At line end between two lines, indented", async (t: TestContext) => {
            const source = [
                "  void 0;",    // Note: Rollup will unindent this line
                "  void 0; // Comment",
                "  void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\n  void 0;\n  void 0;\n")
        })

        test("At last line end, indented", async (t: TestContext) => {
            const source = [
                "  void 0;",    // Note: Rollup will unindent this line
                "  void 0;  // Comment"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\n  void 0;\n")
        })
    })

    suite('Block comments', () => {

        test("Standalone at top", async (t: TestContext) => {
            const source = [
                "/* Comment */",
                "void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\n")
        })

        test("Standalone at top (multiline)", async (t: TestContext) => {
            const source = [
                "/*",
                " * text",
                " * text",
                " */",
                "void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\n")
        })

        test("Standalone between two lines", async (t: TestContext) => {
            const source = [
                "void 0;",
                "/* Comment */",
                "void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\nvoid 0;\n")
        })

        test("Standalone at end", async (t: TestContext) => {
            const source = [
                "void 0;",
                "/* Comment */"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\n")
        })

        test("Standalone at top, indented", async (t: TestContext) => {
            const source = [
                "  /* Comment */",
                "  void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "  void 0;\n")
        })

        test("Standalone between two lines, indented", async (t: TestContext) => {
            const source = [
                "  void 0;",        // Rollup (not this plugin) will unindent this line
                "  /* Comment */",
                "  void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\n  void 0;\n")
        })

        test("Standalone at bottom, indented", async (t: TestContext) => {
            const source = [
                "void 0;",
                "  /* Comment */"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\n")
        })

        test("At line end between two lines", async (t: TestContext) => {
            const source = [
                "void 0;",
                "void 0;  /* Comment */",
                "void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\nvoid 0;\nvoid 0;\n")
        })

        test("At last line end", async (t: TestContext) => {
            const source = [
                "void 0;",
                "void 0;  /* Comment */",
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\nvoid 0;\n")
        })

        test("At first line end, indented", async (t: TestContext) => {
            const source = [
                "  void 0;  /* Comment */", // Note: Rollup will unindent this line
                "  void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\n  void 0;\n")
        })

        test("At line end between two lines, indented", async (t: TestContext) => {
            const source = [
                "  void 0;",    // Note: Rollup will unindent this line
                "  void 0;  /* Comment */",
                "  void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\n  void 0;\n  void 0;\n")
        })

        test("At last line end, indented", async (t: TestContext) => {
            const source = [
                "  void 0;",    // Note: Rollup will unindent this line
                "  void 0;  /* Comment */",
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;\n  void 0;\n")
        })

        test("Between two statements, not spaced", async (t: TestContext) => {
            const source = [
                "void 0;/* Comment */void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0;void 0;\n")
        })

        test("Between two statements, space before", async (t: TestContext) => {
            const source = [
                "void 0;  /* Comment */void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0; void 0;\n")
        })

        test("Between two statements, space after", async (t: TestContext) => {
            const source = [
                "void 0;/* Comment */  void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0; void 0;\n")
        })

        test("Between two statements, space around", async (t: TestContext) => {
            const source = [
                "void 0;  /* Comment */  void 0;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "void 0; void 0;\n")
        })

        test("Between AST nodes within a statement, spaced", async (t: TestContext) => {
            const source = [
                "const /* Comment */ x /* Comment */ = /* Comment */ .1;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "const x = .1;\n")
        })

        test("Between AST nodes within a statement, not spaced", async (t: TestContext) => {
            const source = [
                "const/* Comment */x/* Comment */=/* Comment */.1;"
            ].join('\n')

            const raked = await rollup(source)
            t.assert.strictEqual(raked, "const x=.1;\n")
        })
    })
})
