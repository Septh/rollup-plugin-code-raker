import type { Options } from './index.ts'

interface Preset {
    licenses:    (comment: string) => boolean
    docs:        (comment: string) => boolean
    annotations: () => boolean
    console:     (method: string, statement: string) => boolean
    debugger:    () => boolean
    blankLines:  () => boolean
}

function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean'
}

function isObject(value: unknown): value is object {
    return value !== null && typeof value === 'object'
}

function isFunction(value: unknown): value is Function {
    return typeof value === 'function'
}

function fail(optionName: string): never {
    throw new TypeError(`Invalid value for "${optionName}" option.`)
}

export class Config implements Preset {
    public licenses!:    Preset['licenses']
    public docs!:        Preset['docs']
    public annotations!: Preset['annotations']
    public console!:     Preset['console']
    public debugger!:    Preset['debugger']
    public blankLines!:  Preset['blankLines']

    constructor(pluginOptions: Options) {
        const base = pluginOptions.preset === undefined ? Config.presets.all
            : (pluginOptions.preset === 'application' || pluginOptions.preset === 'library') ? Config.presets[pluginOptions.preset]
            : fail('preset')

        const preset: Preset = {
            ...this.getCommentsConfig(base, pluginOptions),
            ...this.getConsoleConfig(base, pluginOptions),
            ...this.getDebuggerConfig(base, pluginOptions),
            ...this.getBlankLinesConfig(base, pluginOptions)
        }

        Object.assign(this, preset)
    }

    public testComment(comment: string): boolean {
        if (Config.docStartRx.test(comment))
            return Config.docLicenseTagRx.test(comment) ? this.licenses(comment) : this.docs(comment)

        if (Config.licenseStartRx.test(comment))
            return this.licenses(comment)

        if (Config.annotationRx.test(comment))
            return this.annotations()

        // Meaningless comments are always removed
        return true
    }

    private getCommentsConfig(basePreset: Preset, options: Options): Pick<Preset, 'licenses' | 'docs' | 'annotations'> {
        const { comments: option } = options
        if (option === undefined) {
            const { licenses, docs, annotations } = basePreset
            return { licenses, docs, annotations }
        }
        if (isBoolean(option)) {
            const { licenses, docs, annotations } = option ? Config.presets.all : Config.presets.none
            return { licenses, docs, annotations }
        }
        if (isObject(option)) {
            const { licenses, docs, annotations } = option
            return {
                licenses: (
                    licenses === undefined ? basePreset.licenses
                        : isBoolean(licenses) ? (licenses ? Config.remove : Config.preserve)
                        : isFunction(licenses) ? licenses
                        : fail('comments.licenses')
                ),
                docs: (
                    docs === undefined ? basePreset.docs
                        : isBoolean(docs) ? (docs ? Config.remove : Config.preserve)
                        : isFunction(docs) ? docs
                        : fail('comments.docs')
                ),
                annotations: (
                    annotations === undefined ? basePreset.annotations
                        : isBoolean(annotations) ? (annotations ? Config.remove : Config.preserve)
                        : fail('comments.annotations')
                )
            }
        }
        fail('comments')
    }

    private getConsoleConfig(basePreset: Preset, options: Options): Pick<Preset, 'console'> {
        const { console: option } = options
        if (option === undefined)
            return { console: basePreset.console }
        if (isBoolean(option))
            return { console: option ? Config.remove : Config.preserve }
        if (isFunction(option))
            return { console: option }
        if (isObject(option)) {
            const { include = Config.consoleMethods, exclude = [] } = option
            if (!Array.isArray(include))
                fail('console.include')
            if (!Array.isArray(exclude))
                fail('console.exclude')
            return { console: Config.createFilter(include, exclude) }
        }
        fail('console')
    }

    private getDebuggerConfig(basePreset: Preset, options: Options): Pick<Preset, 'debugger'> {
        const { debugger: option } = options
        if (option === undefined)
            return { debugger: basePreset.debugger }
        if (isBoolean(option))
            return { debugger: option ? Config.remove : Config.preserve }
        fail('debugger')
    }

    private getBlankLinesConfig(basePreset: Preset, options: Options): Pick<Preset, 'blankLines'> {
        const { blankLines: option } = options
        if (option === undefined)
            return { blankLines: basePreset.blankLines }
        if (isBoolean(option))
            return { blankLines: option ? Config.remove : Config.preserve }
        fail('blankLines')
    }

    private static consoleMethods = Object.keys(console).filter(name => typeof console[name as keyof Console] === 'function')
    private static licenseStartRx  = /^[/][*][!][\s]/
    private static docStartRx      = /^[/][*][*][\s]/
    private static docLicenseTagRx = /\s@license\b/
    private static annotationRx    = /[@#]__(?:PURE|NO_SIDE_EFFECTS)__/

    private static remove   = () => true
    private static preserve = () => false

    private static createFilter(include: string[], exclude: string[]) {
        const isIncluded = (name: string) => include.length > 0 && include.includes(name)
        const isExcluded = (name: string) => exclude.length > 0 && exclude.includes(name)
        return function filter(name: string) {
            return isIncluded(name) && !isExcluded(name)
        }
    }

    private static presets: Record<'all' | 'none' | NonNullable<Options['preset']>, Preset> = {

        // A preset that removes everything. This is the default.
        all: {
            licenses:    Config.remove,
            docs:        Config.remove,
            annotations: Config.remove,
            console:     Config.remove,
            debugger:    Config.remove,
            blankLines:  Config.remove
        },

        // A preset that removes nothing.
        none: {
            licenses:    Config.preserve,
            docs:        Config.preserve,
            annotations: Config.preserve,
            console:     Config.preserve,
            debugger:    Config.preserve,
            blankLines:  Config.preserve
        },

        // The 'library' preset.
        library: {
            licenses:    Config.preserve,
            docs:        Config.preserve,
            annotations: Config.preserve,
            console:     Config.createFilter(Config.consoleMethods, [ 'log', 'info', 'warn', 'error' ]),
            debugger:    Config.remove,
            blankLines:  Config.remove
        },

        // The 'application' preset.
        application: {
            licenses:    Config.preserve,
            docs:        Config.remove,
            annotations: Config.remove,
            console:     Config.createFilter(Config.consoleMethods, [ 'log', 'info', 'warn', 'error' ]),
            debugger:    Config.remove,
            blankLines:  Config.remove
        }
    }
}
