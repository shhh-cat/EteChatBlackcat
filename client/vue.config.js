const { defineConfig } = require('@vue/cli-service')
const webpack = require("webpack")

module.exports = defineConfig({
  configureWebpack: {
    plugins: [
      // Work around for Buffer is undefined:
      // https://github.com/webpack/changelog-v5/issues/10
      new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.ProvidePlugin({
          process: 'process/browser',
      }),
    ],
    resolve: {
      fallback: {
        "crypto": require.resolve("crypto-browserify"),
        "constants": require.resolve("constants-browserify"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer"),
        "assert": require.resolve('assert'),
        // "crypto": false,
        // "constants": false,
        // "stream": false,
        // "buffer": false,
        // "assert": false,
      }
    }
  },
  transpileDependencies: true,
  
})
