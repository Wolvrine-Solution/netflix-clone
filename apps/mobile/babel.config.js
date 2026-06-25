module.exports = function (api) {
  const isTest = api.env('test')
  api.cache.using(() => isTest)
  return {
    presets: ['babel-preset-expo'],
    // nativewind/babel and react-native-reanimated/plugin are only needed to
    // compile app source for the bundler. Under Jest they're not required (no
    // JSX styling/worklets get exercised in unit tests) and nativewind's babel
    // plugin currently emits an invalid plugin entry when react-native-worklets
    // isn't installed, which crashes Babel for every file (including
    // node_modules files transformed by jest-expo). Skip them in the test env.
    plugins: isTest
      ? []
      : [
          'nativewind/babel',
          'react-native-reanimated/plugin',
        ],
  }
}
