
/** Input code for the presets/* tests. */
export const presets = `\
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
export function foo(arg1, arg2) {
    debugger;
}

/*#__NO_SIDE_EFFECTS__*/
function pure() {
    console.dir("");
}

function impure() {
    setTimeout(() => {}, 1000);
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
`

export const regexes = {
    lineComments: /\bline comment\b/g,
    blockComments: /\block comment\b/g,
    licenses: /@?license\b/g,
    docs: /\bdocumentation\b/g,
    annotations: /[@#]__(?:PURE|NO_SIDE_EFFECTS)__/g,
    debuggerStatements: /\bdebugger\b/g,
    consoleCalls: /\bconsole.(\w+)/g
} as const

export const stats = {
    numLineComments: Array.from(presets.matchAll(regexes.lineComments)).length,
    numBlockComments: Array.from(presets.matchAll(regexes.blockComments)).length,
    numLicenses: Array.from(presets.matchAll(regexes.licenses)).length,
    numDocs: Array.from(presets.matchAll(regexes.docs)).length,
    numAnnotations: Array.from(presets.matchAll(regexes.annotations)).length,
    numConsoleCalls: Array.from(presets.matchAll(regexes.consoleCalls)).length,
}
