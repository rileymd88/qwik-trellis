// Imports
const path = require('path');
require("babel-register");
require("@babel/polyfill");

// Webpack Configuration
const config = {
  // Entry
  entry: ['@babel/polyfill','./src/qwik-trellis.js'],
  
  // Output
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'qwik-trellis.js',
  },
  // Loaders
  module: {
    rules : [
      // JavaScript
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      // HTML files
      {
        test: /\.html$/,
        loader: "html-loader"
      },
      // CSS Files
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      }
    ]
  },
  watch: true,
  devtool: 'source-map'
};
// Exports
module.exports = config;