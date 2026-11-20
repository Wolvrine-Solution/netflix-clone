/** DI tokens. Always inject with an explicit @Inject(TOKEN): tsx/esbuild emits no decorator metadata. */
export const DB = Symbol('DB')
export const ENV = Symbol('ENV')
export const REDIS = Symbol('REDIS')
