
/** Input code for the presets/* tests. */
export const source = String.raw`
/*!
 * A license
 */

/**
 * @license
 * jsDoc-style
 */

/**
 * Some documentation without tags
 */
const someVar = "something";

/**
 * Some more documentation with tags
 * @see {@link https://test.com}
 *
 * @private
 * @param {number} arg1
 * @param {number} arg2
 * @returns {void}
 */
function foo(arg1, arg2) {
    debugger;
}

/*#__NO_SIDE_EFFECTS__*/
function pure() {
    console.dir("");
}

function impure() {
    setTimeout(() => {
        // An empty code block with a line comment inside
    }, 1000);
}

// A line comment
function now() {
    console.dir("");  // An other line comment
}

const x = pure();
const y = /*@__PURE__*/impure();

/* A simple block comment */
console.group("header"); /* An other simple block comment */
console.timeStamp("")
console.log("");
console.info("");
console.warn("");
console.error("");
console.debug("");
console.groupEnd();

// An end-of-file comment
`

export const regexes = {
    lineComments: /\bline comment\b/g,
    blockComments: /\block comment\b/g,
    licenses: /@?license\b/g,
    docs: /\bdocumentation\b/g,
    annotations: /[@#]__(?:PURE|NO_SIDE_EFFECTS)__/g,
    consoleCalls: /\bconsole.(\w+)/g,
    debuggerStatements: /\bdebugger\b/g
} as const

export const stats = {
    numLineComments: Array.from(source.matchAll(regexes.lineComments)).length,
    numBlockComments: Array.from(source.matchAll(regexes.blockComments)).length,
    numLicenses: Array.from(source.matchAll(regexes.licenses)).length,
    numDocs: Array.from(source.matchAll(regexes.docs)).length,
    numAnnotations: Array.from(source.matchAll(regexes.annotations)).length,
    numConsoleCalls: Array.from(source.matchAll(regexes.consoleCalls)).length,
    numDebuggerStatements: Array.from(source.matchAll(regexes.debuggerStatements)).length
} as const
