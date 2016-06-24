var HtmlWebpackPlugin = require('html-webpack-plugin');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  devServer: {
    // 0.0.0.0 is available to all network devices, unlike default localhost
    host: process.env.HOST || '0.0.0.0',
    port: process.env.PORT || 8080
  },
  devtool: 'source-map',
  entry: {
    app: './app/index.ts',
    vendor: './app/vendor.ts',
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'awesome-typescript-loader?library=es5' },
      { test: /\.css$/, loader: ExtractTextPlugin.extract('style-loader', 'css-loader') }
    ]
  },
  output: {
    path: 'build',
    filename: 'app.js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './app/index.ejs', // Load a custom template
      inject: 'body' // Inject all scripts into the body
    }),
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.bundle.js'),
    new ExtractTextPlugin('style.css')
  ],
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
  }
};
