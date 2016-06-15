var HtmlWebpackPlugin = require('html-webpack-plugin');
var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
  },

  entry: {
    app: './app/index.ts',
    vendor: './app/vendor.ts',
  },

  plugins: [
    new HtmlWebpackPlugin({ title: 'Journey Through Pi' }),
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.bundle.js'),
    new ExtractTextPlugin('style.css')
  ],

  output: {
    path: 'build',
    filename: 'app.js'
  },

  devtool: 'source-map',

  module: {
    loaders: [
      { test: /\.ts$/, loader: 'awesome-typescript-loader?library=es5' },
      { test: /\.css$/, loader: ExtractTextPlugin.extract('style-loader', 'css-loader') }
    ]
  }
};
