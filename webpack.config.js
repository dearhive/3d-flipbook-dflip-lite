const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

const smp = new SpeedMeasurePlugin();

// This library allows us to combine paths easily
const path = require('path');
module.exports = smp.wrap({
  mode: 'production',
  entry: {
    'js/dflip': path.resolve(__dirname, 'src/js/', 'dflip.js'),
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build'),
    // filename: '[name].bundle.js'
  },

  resolve: {
    extensions: ['.js']
  },
  optimization: {
    // We do not want to minimize our code.
    minimize: false
  },
  target: ['web','es5'],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        // use: {
        loader: "swc-loader",
      }
    ],
    noParse: /jquery|lodash/,
  }
});
