module.exports = function (api) {
  const isTest = api.env('test')
  api.cache.using(() => isTest)
  return {
    // nativewind/babel is a preset (it returns { plugins: [...] }), not a
    // plugin — listing it under `plugins` makes Babel treat that returned
    // object as a single plugin, and a plugin whose own shape is
    // `{ plugins: [...] }` rather than `{ visitor: {...} }` is invalid,
    // crashing Babel on every file. It belongs in `presets`.
    presets: isTest ? ['babel-preset-expo'] : ['babel-preset-expo', 'nativewind/babel'],
    // react-native-reanimated/plugin is only needed to compile app source for
    // the bundler; under Jest no worklets get exercised in unit tests.
    plugins: isTest ? [] : ['react-native-reanimated/plugin'],
  }
}
